/**
 * Workflow executor - executes studio workflows using floimg core's pipeline runner
 *
 * Execution model:
 * - Converts Studio graph (nodes + edges) to floimg Pipeline format
 * - Delegates execution to client.run() which handles wave-based parallel execution
 * - Pre-loads input nodes and injects them via pipeline.initialVariables
 * - Post-processes results for moderation, saving, and callbacks
 */

import { getClient, clearCollectedUsageEvents, getCollectedUsageEvents } from "./setup.js";
import type {
  StudioNode,
  StudioEdge,
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  InputNodeData,
  VisionNodeData,
  TextNodeData,
  FanOutNodeData,
  CollectNodeData,
  RouterNodeData,
  ExecutionStepResult,
  ImageMetadata,
} from "@teamflojo/floimg-studio-shared";
import type { ImageBlob, DataBlob, Pipeline, UsageEvent } from "@teamflojo/floimg";
import { isImageBlob, isDataBlob } from "@teamflojo/floimg";
import { loadUpload } from "../routes/uploads.js";
import { nanoid } from "nanoid";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import {
  isModerationEnabled,
  isStrictModeEnabled,
  moderateImage,
  logModerationIncident,
} from "../moderation/index.js";

// Output directory for generated images
const OUTPUT_DIR = "./data/images";

// SDK branching step types from @teamflojo/floimg (PR #114)
// The SDK handles fan-out, collect, and router execution - we just convert Studio nodes to SDK types

// Type guards for SDK branching steps
function isFanOutStep(step: { kind: string }): step is { kind: "fan-out"; out: string[] } {
  return step.kind === "fan-out";
}

function isCollectStep(step: {
  kind: string;
}): step is { kind: "collect"; in: string[]; out: string } {
  return step.kind === "collect";
}

function isRouterStep(step: {
  kind: string;
}): step is { kind: "router"; in: string; selectionIn: string; out: string } {
  return step.kind === "router";
}

/**
 * Find a string prompt in a parsed JSON object
 * Checks for common prompt property names, then falls back to first long string property
 */
function findPromptInParsed(parsed: Record<string, unknown>): string | undefined {
  // Priority order: common prompt property names, then first long string
  const promptKeys = ["prompt", "refined_prompt", "improved_prompt", "image_prompt", "description"];
  for (const key of promptKeys) {
    if (key in parsed && typeof parsed[key] === "string") {
      return parsed[key] as string;
    }
  }
  // Fallback: find first string property that looks like a prompt (> 20 chars)
  for (const [key, value] of Object.entries(parsed)) {
    if (typeof value === "string" && value.length > 20) {
      console.log(`Using "${key}" property as prompt source`);
      return value;
    }
  }
  return undefined;
}
// Mime type to file extension mapping
const MIME_TO_EXT: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
};

// Data output type for vision/text nodes
interface DataOutput {
  kind: "data";
  dataType: "text" | "json";
  content: string;
  parsed?: Record<string, unknown>;
}

export interface ExecutionCallbacks {
  onStep?: (result: ExecutionStepResult) => void;
  onComplete?: (imageIds: string[]) => void;
  /** Called when execution fails. id is the step identifier when the error occurred. */
  onError?: (error: string, id?: string) => void;
}

// AI provider configuration from frontend
export interface AIProviderConfig {
  openai?: { apiKey: string };
  anthropic?: { apiKey: string };
  gemini?: { apiKey: string };
  grok?: { apiKey: string };
  openrouter?: { apiKey: string };
  ollama?: { baseUrl: string };
  lmstudio?: { baseUrl: string };
}

// Cloud config for FloImg Cloud save functionality
// Injected by floimg-cloud when running in cloud context
export interface CloudConfig {
  enabled: boolean;
  userId: string;
  apiBaseUrl: string;
  authToken: string;
}

/**
 * Map provider names to AI provider config keys
 */
const PROVIDER_TO_AI_CONFIG: Record<string, keyof AIProviderConfig> = {
  // Generator providers
  "gemini-generate": "gemini",
  "openai-images": "openai",
  "stability-ai": "openai", // Stability uses its own key, but we map for consistency
  // Transform providers
  "gemini-transform": "gemini",
  "openai-transform": "openai",
  // Text providers
  "gemini-text": "gemini",
  "grok-text": "grok",
  "openai-text": "openai",
  // Vision providers
  "gemini-vision": "gemini",
  "grok-vision": "grok",
  "openai-vision": "openai",
};

/**
 * Get API key for a provider from AI config
 */
function getApiKeyForProvider(
  providerName: string,
  aiProviders?: AIProviderConfig
): string | undefined {
  if (!aiProviders) return undefined;

  const configKey = PROVIDER_TO_AI_CONFIG[providerName];
  if (!configKey) return undefined;

  const config = aiProviders[configKey];
  if (!config) return undefined;

  // All AI provider configs have apiKey or baseUrl
  if ("apiKey" in config) {
    return config.apiKey as string;
  }

  return undefined;
}

export interface ExecutionOptions {
  /** Optional template ID if workflow was loaded from a template */
  templateId?: string;
  /** Callbacks for execution events */
  callbacks?: ExecutionCallbacks;
  /** AI provider configurations (API keys, base URLs) */
  aiProviders?: AIProviderConfig;
  /** Cloud config for FloImg Cloud save functionality */
  cloudConfig?: CloudConfig;
}

export interface ExecutionResult {
  imageIds: string[];
  images: Map<string, Buffer>;
  idByImageId: Map<string, string>;
  dataOutputs: Map<string, DataOutput>;
  /** Usage events collected from AI providers during execution */
  usageEvents: UsageEvent[];
}

/**
 * Result from executing a Pipeline directly (simpler than ExecutionResult)
 * Used by external API callers who send Pipeline format
 */
export interface PipelineExecutionResult {
  imageIds: string[];
  images: Map<string, Buffer>;
  dataOutputs: Map<string, { dataType: "text" | "json"; content: string; parsed?: unknown }>;
  usageEvents: UsageEvent[];
}

/**
 * Callbacks for pipeline execution progress
 */
export interface PipelineExecutionCallbacks {
  /** Called when a step starts or completes */
  onStep?: (result: ExecutionStepResult) => void;
  /** Called when execution fails. id is the step identifier when the error occurred. */
  onError?: (error: string, id?: string) => void;
}

/**
 * Options for direct pipeline execution
 */
export interface PipelineExecutionOptions {
  /** AI provider configurations (API keys, base URLs) */
  aiProviders?: AIProviderConfig;
  /** Cloud config for FloImg Cloud save functionality */
  cloudConfig?: CloudConfig;
  /** Callbacks for execution progress */
  callbacks?: PipelineExecutionCallbacks;
}

/**
 * Execute a Pipeline directly (for API callers using the canonical format)
 *
 * This is the preferred path for external API users. Unlike executeWorkflow(),
 * this function accepts the canonical Pipeline format directly and doesn't
 * require conversion from the visual editor's nodes/edges format.
 *
 * @param pipeline - The Pipeline to execute (canonical format)
 * @param options - Execution options (AI providers, cloud config, callbacks)
 * @returns Execution result with images and data outputs
 */
export async function executePipeline(
  pipeline: Pipeline,
  options?: PipelineExecutionOptions
): Promise<PipelineExecutionResult> {
  const { cloudConfig, callbacks } = options || {};
  let currentStepId: string | undefined;

  try {
    const imageIds: string[] = [];
    const images = new Map<string, Buffer>();
    const dataOutputs = new Map<
      string,
      { dataType: "text" | "json"; content: string; parsed?: unknown }
    >();

    // Get the shared floimg client
    const client = getClient();

    // Dynamically register CloudSaveProvider when running in cloud context
    if (cloudConfig?.enabled) {
      const { CloudSaveProvider } = await import("./providers/CloudSaveProvider.js");
      const provider = new CloudSaveProvider(
        cloudConfig.userId,
        cloudConfig.apiBaseUrl,
        cloudConfig.authToken
      );
      client.registerSaveProvider(provider);
    }

    // Clear any previously collected usage events before this execution
    clearCollectedUsageEvents();

    // Build intermediate variable storage for step-by-step execution
    // Store both ImageBlob and DataBlob values during execution
    const stepVariables: Record<string, ImageBlob | DataBlob> = { ...pipeline.initialVariables };

    // Execute steps one-by-one to provide real-time progress
    for (let i = 0; i < pipeline.steps.length; i++) {
      const step = pipeline.steps[i];
      // Get step identifier (the 'out' variable name)
      const stepId = getStepId(step);
      currentStepId = stepId;

      // Notify step is starting
      if (stepId && callbacks?.onStep) {
        callbacks.onStep({
          stepIndex: i,
          id: stepId,
          status: "running",
        });
      }

      // Inject reference images for transforms that need them (e.g., edit/inpaint)
      // The frontend's nodesToPipeline() adds _referenceImageVars to tell us which
      // variables to look up and inject as referenceImages[]
      if (
        (step.kind === "generate" || step.kind === "transform") &&
        step.params?._referenceImageVars
      ) {
        const refVars = step.params._referenceImageVars as string[];
        const referenceImages: ImageBlob[] = [];
        const missingRefs: string[] = [];

        for (const varName of refVars) {
          const blob = stepVariables[varName];
          if (blob && isImageBlob(blob)) {
            referenceImages.push(blob);
          } else {
            missingRefs.push(varName);
          }
        }

        if (missingRefs.length > 0) {
          throw new Error(`Transform missing reference images: ${missingRefs.join(", ")}`);
        }

        step.params.referenceImages = referenceImages;
        console.log(
          `[executePipeline] Injected ${referenceImages.length} reference images for ${step.kind} step`
        );

        // Clean up the marker
        delete step.params._referenceImageVars;
      }

      // Inject overlay images for composite transforms
      // The frontend's nodesToPipeline() adds _overlayImageVars to tell us which
      // variables to look up and inject as overlays[N].blob
      if (step.kind === "transform" && step.params?._overlayImageVars) {
        const overlayVarsWithIndex = step.params._overlayImageVars as Array<{
          varName: string;
          index: number;
        }>;
        const existingOverlays = (step.params.overlays || []) as Array<{
          left?: number;
          top?: number;
          blob?: ImageBlob;
        }>;

        const missingOverlays: string[] = [];

        for (const { varName, index } of overlayVarsWithIndex) {
          const blob = stepVariables[varName];
          if (blob && isImageBlob(blob)) {
            // Ensure overlays array is long enough for this index
            while (existingOverlays.length <= index) {
              existingOverlays.push({ left: 0, top: 0 });
            }
            existingOverlays[index].blob = blob;
          } else {
            missingOverlays.push(`${varName} (index ${index})`);
          }
        }

        if (missingOverlays.length > 0) {
          throw new Error(
            `Composite transform missing overlay images: ${missingOverlays.join(", ")}`
          );
        }

        step.params.overlays = existingOverlays;
        console.log(
          `[executePipeline] Injected ${overlayVarsWithIndex.length} overlay images for composite step`
        );

        // Clean up the marker
        delete step.params._overlayImageVars;
      }

      // Create a single-step pipeline with current variables
      // Include both ImageBlob and DataBlob for dependent steps
      const pipelineVariables: Record<string, ImageBlob | DataBlob> = {};
      for (const [key, value] of Object.entries(stepVariables)) {
        if (isImageBlob(value) || isDataBlob(value)) {
          pipelineVariables[key] = value;
        }
      }
      const singlePipeline: Pipeline = {
        name: "Single Step",
        steps: [step],
        initialVariables: pipelineVariables,
      };

      try {
        // Execute the single step
        const stepResults = await client.run(singlePipeline);

        // Process step results
        for (const result of stepResults) {
          if (isImageBlob(result.value)) {
            // Store for dependent steps
            if (result.out) {
              stepVariables[result.out] = result.value;
            }

            const imageId = nanoid();
            const buffer = Buffer.from(result.value.bytes);
            imageIds.push(imageId);
            images.set(imageId, buffer);

            // Save image to disk
            const ext = MIME_TO_EXT[result.value.mime] || "png";
            const filename = `${imageId}.${ext}`;
            const filepath = join(OUTPUT_DIR, filename);
            await mkdir(dirname(filepath), { recursive: true });
            await writeFile(filepath, buffer);

            // Notify step completed with image preview
            if (stepId && callbacks?.onStep) {
              const previewMime = result.value.mime || "image/png";
              const preview = `data:${previewMime};base64,${buffer.toString("base64")}`;
              callbacks.onStep({
                stepIndex: i,
                id: stepId,
                status: "completed",
                imageId,
                preview,
              });
            }
          } else if (isDataBlob(result.value)) {
            // Store for dependent steps (text/vision output)
            if (result.out) {
              stepVariables[result.out] = result.value;
            }

            // Store data outputs
            dataOutputs.set(result.out, {
              dataType: result.value.type,
              content: result.value.content,
              parsed: result.value.parsed,
            });

            // Notify step completed with data output
            if (stepId && callbacks?.onStep) {
              callbacks.onStep({
                stepIndex: i,
                id: stepId,
                status: "completed",
                dataType: result.value.type,
                content: result.value.content,
                parsed: result.value.parsed,
              });
            }
          } else if (stepId && callbacks?.onStep) {
            // Step completed without specific output (e.g., save step)
            callbacks.onStep({
              stepIndex: i,
              id: stepId,
              status: "completed",
            });
          }
        }
      } catch (stepError) {
        // Fire error callback for this specific step
        if (stepId && callbacks?.onStep) {
          callbacks.onStep({
            stepIndex: i,
            id: stepId,
            status: "error",
            error: stepError instanceof Error ? stepError.message : String(stepError),
          });
        }
        throw stepError; // Re-throw for outer catch
      }
    }

    // Get usage events collected during execution
    const usageEvents = getCollectedUsageEvents();

    return {
      imageIds,
      images,
      dataOutputs,
      usageEvents,
    };
  } catch (error) {
    callbacks?.onError?.(error instanceof Error ? error.message : String(error), currentStepId);
    throw error;
  }
}

/**
 * Get step identifier from a pipeline step
 * Returns the 'out' variable name, or first output for fan-out steps
 */
function getStepId(step: Pipeline["steps"][number]): string | undefined {
  if (step.kind === "fan-out") {
    return step.out[0]; // Return first branch variable
  }
  if (step.kind === "save") {
    return undefined; // Save steps don't have output
  }
  return step.out;
}

/**
 * Build dependency graph from nodes and edges
 * Returns map for quick lookup of dependencies
 */
function buildDependencyGraph(nodes: StudioNode[], edges: StudioEdge[]): Map<string, Set<string>> {
  const dependencies = new Map<string, Set<string>>();

  // Initialize empty sets for all nodes
  for (const node of nodes) {
    dependencies.set(node.id, new Set());
  }

  // Build dependency relationships from edges
  for (const edge of edges) {
    // target depends on source
    dependencies.get(edge.target)?.add(edge.source);
  }

  return dependencies;
}

/**
 * Execute a workflow using floimg core's pipeline runner
 *
 * @param nodes - Workflow nodes from the visual editor
 * @param edges - Connections between nodes
 * @param options - Execution options (callbacks, AI providers, etc.)
 * @returns Execution result with image IDs and data outputs
 */
export async function executeWorkflow(
  nodes: StudioNode[],
  edges: StudioEdge[],
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  const { templateId, callbacks, cloudConfig } = options || {};
  const imageIds: string[] = [];
  const images = new Map<string, Buffer>();
  const idByImageId = new Map<string, string>();
  const dataOutputs = new Map<string, DataOutput>();

  // Track current node being executed (for error reporting)
  let currentStepId: string | undefined;

  // Get the shared floimg client
  const client = getClient();

  // Dynamically register CloudSaveProvider when running in cloud context
  if (cloudConfig?.enabled) {
    const { CloudSaveProvider } = await import("./providers/CloudSaveProvider.js");
    const provider = new CloudSaveProvider(
      cloudConfig.userId,
      cloudConfig.apiBaseUrl,
      cloudConfig.authToken
    );
    client.registerSaveProvider(provider);
  }

  try {
    // Clear any previously collected usage events before this execution
    clearCollectedUsageEvents();

    // Step 1: Pre-load all input nodes
    const inputNodes = nodes.filter((n) => n.type === "input");
    const initialVariables: Record<string, ImageBlob> = {};

    for (const inputNode of inputNodes) {
      const data = inputNode.data as InputNodeData;
      if (!data.uploadId) {
        throw new Error(`No image selected for input node ${inputNode.id}`);
      }

      callbacks?.onStep?.({
        stepIndex: 0,
        id: inputNode.id,
        status: "running",
      });
    }

    // Step 2: Convert workflow to pipeline format (pass aiProviders for API key injection)
    const { pipeline: pipelineData, nodeToVar } = toPipeline(nodes, edges, options?.aiProviders);

    // Step 3: Populate initialVariables with input node blobs
    for (const inputNode of inputNodes) {
      const data = inputNode.data as InputNodeData;
      const varName = nodeToVar.get(inputNode.id);
      if (varName && data.uploadId) {
        const upload = await loadUpload(data.uploadId);
        if (!upload) {
          throw new Error(`Upload not found: ${data.uploadId}`);
        }
        initialVariables[varName] = {
          bytes: upload.bytes,
          mime: upload.mime as ImageBlob["mime"],
        };

        callbacks?.onStep?.({
          stepIndex: 0,
          id: inputNode.id,
          status: "completed",
        });
      }
    }

    // Step 4: Build the full pipeline with initialVariables
    const pipeline: Pipeline = {
      name: pipelineData.name,
      steps: pipelineData.steps as Pipeline["steps"],
      initialVariables,
    };

    // Step 4.5: Resolve text inputs for AI generators and transforms
    // If any generator/transform has _promptFromVar, we need to execute text nodes first
    // and inject their output as the prompt
    const textVarToResolve = new Set<string>();
    for (const step of pipeline.steps) {
      if ((step.kind === "generate" || step.kind === "transform") && step.params?._promptFromVar) {
        const varName = step.params._promptFromVar as string;

        // Check if this is a branch variable (e.g., "v1_0" from fan-out)
        // If so, we need to trace back through the fan-out to find the source text node
        // SDK fan-out outputs: ["v1_0", "v1_1", "v1_2"] (varName_index format)
        const branchMatch = varName.match(/^(.+)_(\d+)$/);
        if (branchMatch) {
          // Find the fan-out step whose output array contains this branch variable
          const allSteps = pipeline.steps as unknown[];
          const fanoutStep = allSteps.find((s) => {
            if (!isFanOutStep(s as { kind: string })) return false;
            const step = s as { kind: "fan-out"; in: string; out: string[] };
            return step.out.includes(varName);
          }) as { kind: "fan-out"; in: string; out: string[] } | undefined;

          if (fanoutStep?.in) {
            // Add the fan-out's input (the text node's output) to resolution set
            textVarToResolve.add(fanoutStep.in);
          }
        } else {
          textVarToResolve.add(varName);
        }
      }
    }

    if (textVarToResolve.size > 0) {
      console.log(`Resolving ${textVarToResolve.size} text inputs for AI generators/transforms`);

      // Execute text/vision nodes first to get their outputs
      // BUT only if they have NO 'in' dependency - steps with dependencies run in main loop
      // This is a conservative approach: text/vision steps that depend on other steps
      // (even other text steps) will execute in the normal pipeline flow
      const textSteps = pipeline.steps.filter((s) => {
        if (!((s.kind === "text" || s.kind === "vision") && textVarToResolve.has(s.out))) {
          return false;
        }
        // Check if this step has an 'in' dependency - if so, skip early resolution
        const stepIn = "in" in s ? (s.in as string | undefined) : undefined;
        if (stepIn) {
          console.log(`Skipping early resolution of ${s.out} - has dependency on ${stepIn}`);
          return false;
        }
        return true;
      });

      if (textSteps.length > 0) {
        // Execute each text step individually for real-time progress
        const textResults: Array<{ out: string; value: unknown }> = [];

        for (const textStep of textSteps) {
          // Find the node for this step
          const textStepOut = (textStep as { out: string }).out;
          const textNodeId = [...nodeToVar.entries()].find(([, v]) => v === textStepOut)?.[0];

          if (textNodeId) {
            callbacks?.onStep?.({
              stepIndex: 0,
              id: textNodeId,
              status: "running",
            });
          }

          const singleTextPipeline: Pipeline = {
            name: "Text Resolution",
            steps: [textStep] as Pipeline["steps"],
            initialVariables,
          };

          const singleResults = await client.run(singleTextPipeline);

          // Fire callback with completed status and data
          if (textNodeId && singleResults.length > 0) {
            const result = singleResults[0];
            if (isDataBlob(result.value)) {
              // Store for dataOutputs
              const textNode = nodes.find((n) => n.id === textNodeId);
              if (textNode) {
                dataOutputs.set(textNodeId, {
                  kind: "data",
                  dataType: result.value.type,
                  content: result.value.content,
                  parsed: result.value.parsed,
                });
              }

              callbacks?.onStep?.({
                stepIndex: 0,
                id: textNodeId,
                status: "completed",
                dataType: result.value.type,
                content: result.value.content,
                parsed: result.value.parsed,
              });
            }
          }

          textResults.push(...singleResults);
        }

        // Store resolved text values and parsed objects for property extraction
        const resolvedText = new Map<string, string>();
        const resolvedParsed = new Map<string, Record<string, unknown>>();
        for (const result of textResults) {
          if (isDataBlob(result.value)) {
            resolvedText.set(result.out, result.value.content);
            if (result.value.parsed) {
              resolvedParsed.set(result.out, result.value.parsed);
            }
          }
        }

        // Inject resolved prompts into generator/transform steps
        for (const step of pipeline.steps) {
          if (
            (step.kind === "generate" || step.kind === "transform") &&
            step.params?._promptFromVar
          ) {
            const varName = step.params._promptFromVar as string;
            const propertyName = step.params._promptFromProperty as string | undefined;

            let text: string | undefined;

            // Check if this is a branch variable (e.g., "v1_0" from SDK fan-out)
            // SDK fan-out outputs: ["v1_0", "v1_1", "v1_2"] (varName_index format)
            const branchMatch = varName.match(/^(.+)_(\d+)$/);

            if (branchMatch) {
              // This is a branch variable - extract from fan-out's source text node
              const branchIndex = parseInt(branchMatch[2], 10); // e.g., 0

              // Find the fan-out step whose output array contains this branch variable
              const allSteps = pipeline.steps as unknown[];
              const fanoutStep = allSteps.find((s) => {
                if (!isFanOutStep(s as { kind: string })) return false;
                const step = s as {
                  kind: "fan-out";
                  in: string;
                  out: string[];
                  arrayProperty?: string;
                };
                return step.out.includes(varName);
              }) as
                | { kind: "fan-out"; in: string; out: string[]; arrayProperty?: string }
                | undefined;

              if (fanoutStep?.in && fanoutStep.arrayProperty) {
                // Get the parsed output from the fan-out's input (text node)
                const sourceParsed = resolvedParsed.get(fanoutStep.in);

                if (sourceParsed && fanoutStep.arrayProperty in sourceParsed) {
                  const arrayValue = sourceParsed[fanoutStep.arrayProperty];

                  if (Array.isArray(arrayValue) && branchIndex < arrayValue.length) {
                    const item = arrayValue[branchIndex];
                    text = typeof item === "string" ? item : JSON.stringify(item);
                  }
                }
              }
            } else if (propertyName) {
              // If a specific property was requested (from sourceHandle like "output.prompt")
              const parsed = resolvedParsed.get(varName);
              if (parsed && propertyName in parsed) {
                const value = parsed[propertyName];
                // Convert to string (could be string, number, boolean, etc.)
                text = typeof value === "string" ? value : JSON.stringify(value);
              } else {
                console.warn(
                  `Property "${propertyName}" not found in parsed output, trying auto-detect`
                );
                // Try to find a prompt in the parsed output
                if (parsed) {
                  text = findPromptInParsed(parsed);
                }
                if (!text) {
                  text = resolvedText.get(varName);
                }
              }
            } else {
              // No property specified - try parsed output first, then full content
              const parsed = resolvedParsed.get(varName);
              if (parsed) {
                text = findPromptInParsed(parsed);
              }
              if (!text) {
                // Fall back to raw content only if it's not JSON
                const rawText = resolvedText.get(varName);
                if (rawText && !rawText.startsWith("{")) {
                  text = rawText;
                }
              }
            }

            if (text) {
              // Use resolved text as prompt (override any existing prompt)
              step.params.prompt = text;
              // Only clean up markers if we successfully injected the prompt
              // Otherwise, leave them for dynamic injection in the main loop
              delete step.params._promptFromVar;
              delete step.params._promptFromProperty;
            } else {
              // Don't delete markers - the text source will be resolved in main loop
              console.log(
                `Text source ${varName} not available during early resolution, will inject dynamically`
              );
            }
          }
        }

        // Handle vision context injection (separate loop)
        for (const step of pipeline.steps) {
          if (step.kind === "vision" && step.params?._contextFromVar) {
            const contextVarName = step.params._contextFromVar as string;
            const contextText = resolvedText.get(contextVarName);
            const contextParsed = resolvedParsed.get(contextVarName);

            if (contextText || contextParsed) {
              // Create context string from resolved text/parsed data
              let contextStr = "";
              if (contextParsed) {
                // Pretty-print the parsed JSON for context
                contextStr = `Context from workflow:\n${JSON.stringify(contextParsed, null, 2)}\n\n`;
              } else if (contextText) {
                contextStr = `Context from workflow:\n${contextText}\n\n`;
              }

              // Prepend context to the existing prompt
              const existingPrompt = (step.params.prompt as string) || "";
              step.params.prompt = contextStr + existingPrompt;
              console.log(`Injected context into vision prompt: "${contextStr.slice(0, 100)}..."`);
            }
            // Clean up the marker
            delete step.params._contextFromVar;
          }
        }
      }
    }

    // Step 4.6: Resolve reference images for AI generators/transforms
    // Reference images can come from:
    // 1. Input nodes (pre-loaded in initialVariables)
    // 2. Generator/transform nodes (need to execute first)
    const refImageVarsToResolve = new Set<string>();
    for (const step of pipeline.steps) {
      if (
        (step.kind === "generate" || step.kind === "transform") &&
        step.params?._referenceImageVars
      ) {
        const refVars = step.params._referenceImageVars as string[];
        for (const varName of refVars) {
          // Only need to resolve if not already in initialVariables
          if (!initialVariables[varName]) {
            refImageVarsToResolve.add(varName);
          }
        }
      }
    }

    // Execute reference image source steps first if needed
    const resolvedRefImages = new Map<string, ImageBlob>();
    if (refImageVarsToResolve.size > 0) {
      console.log(`Resolving ${refImageVarsToResolve.size} reference image sources`);

      // Find steps that produce the needed reference images
      const refSourceSteps = pipeline.steps.filter(
        (s) => (s.kind === "generate" || s.kind === "transform") && refImageVarsToResolve.has(s.out)
      );

      if (refSourceSteps.length > 0) {
        const refPipeline: Pipeline = {
          name: "Reference Image Resolution",
          steps: refSourceSteps as Pipeline["steps"],
          initialVariables,
        };

        const refResults = await client.run(refPipeline);

        for (const result of refResults) {
          if (isImageBlob(result.value)) {
            resolvedRefImages.set(result.out, result.value);
          }
        }
      }
    }

    // Now inject reference images into steps that need them
    for (const step of pipeline.steps) {
      if (
        (step.kind === "generate" || step.kind === "transform") &&
        step.params?._referenceImageVars
      ) {
        const refVars = step.params._referenceImageVars as string[];
        const referenceImages: ImageBlob[] = [];

        for (const varName of refVars) {
          // Check initialVariables first (input nodes)
          const fromInitial = initialVariables[varName];
          if (fromInitial && isImageBlob(fromInitial)) {
            referenceImages.push(fromInitial);
          } else {
            // Check resolved images (from generator/transform nodes)
            const fromResolved = resolvedRefImages.get(varName);
            if (fromResolved) {
              referenceImages.push(fromResolved);
            } else {
              console.warn(`Reference image variable ${varName} not found`);
            }
          }
        }

        if (referenceImages.length > 0) {
          step.params.referenceImages = referenceImages;
          console.log(`Injected ${referenceImages.length} reference images for ${step.kind} step`);
        }

        // Clean up the marker
        delete step.params._referenceImageVars;
      }
    }

    // Step 4.7: Resolve overlay images for composite transforms
    // Similar to reference images, but injected into params.overlays[N].blob
    const overlayImageVarsToResolve = new Set<string>();
    for (const step of pipeline.steps) {
      if (step.kind === "transform" && step.params?._overlayImageVars) {
        const overlayVarsWithIndex = step.params._overlayImageVars as Array<{
          varName: string;
          index: number;
        }>;
        for (const { varName } of overlayVarsWithIndex) {
          if (!initialVariables[varName]) {
            overlayImageVarsToResolve.add(varName);
          }
        }
      }
    }

    // Execute overlay image source steps if needed
    const resolvedOverlayImages = new Map<string, ImageBlob>();
    if (overlayImageVarsToResolve.size > 0) {
      console.log(`Resolving ${overlayImageVarsToResolve.size} overlay image sources`);

      // Find steps that produce the needed overlay images (skip already resolved refs)
      const overlaySourceSteps = pipeline.steps.filter(
        (s) =>
          (s.kind === "generate" || s.kind === "transform") &&
          overlayImageVarsToResolve.has(s.out) &&
          !resolvedRefImages.has(s.out)
      );

      if (overlaySourceSteps.length > 0) {
        const overlayPipeline: Pipeline = {
          name: "Overlay Image Resolution",
          steps: overlaySourceSteps as Pipeline["steps"],
          initialVariables,
        };

        const overlayResults = await client.run(overlayPipeline);

        for (const result of overlayResults) {
          if (isImageBlob(result.value)) {
            resolvedOverlayImages.set(result.out, result.value);
          }
        }
      }
    }

    // Inject overlay images into composite transform steps
    for (const step of pipeline.steps) {
      if (step.kind === "transform" && step.params?._overlayImageVars) {
        const overlayVarsWithIndex = step.params._overlayImageVars as Array<{
          varName: string;
          index: number;
        }>;
        const existingOverlays = (step.params.overlays || []) as Array<{
          left?: number;
          top?: number;
          blob?: ImageBlob;
        }>;

        // Track missing overlays for clear error reporting
        const missingOverlays: string[] = [];

        // Inject blob at the correct index position (supports sparse arrays)
        for (const { varName, index } of overlayVarsWithIndex) {
          let blob: ImageBlob | undefined;

          // Check initialVariables first
          const fromInitial = initialVariables[varName];
          if (fromInitial && isImageBlob(fromInitial)) {
            blob = fromInitial;
          } else {
            // Check resolved images (from generator/transform)
            blob = resolvedRefImages.get(varName) || resolvedOverlayImages.get(varName);
          }

          if (blob) {
            // Ensure overlays array is long enough for this index
            while (existingOverlays.length <= index) {
              existingOverlays.push({ left: 0, top: 0 });
            }
            existingOverlays[index].blob = blob;
          } else {
            missingOverlays.push(`${varName} (index ${index})`);
          }
        }

        // Fail fast with clear error instead of cryptic Sharp error
        if (missingOverlays.length > 0) {
          throw new Error(
            `Composite transform missing overlay images: ${missingOverlays.join(", ")}`
          );
        }

        step.params.overlays = existingOverlays;
        console.log(`Injected ${overlayVarsWithIndex.length} overlay images for composite step`);

        // Clean up the marker
        delete step.params._overlayImageVars;
      }
    }

    console.log(`Executing pipeline with ${pipeline.steps.length} steps via core runner`);

    // Step 5: Map step indices to node IDs for callbacks
    const stepsToNodes = new Map<number, string>();
    for (const node of nodes.filter((n) => n.type !== "input")) {
      const varName = nodeToVar.get(node.id);
      if (varName) {
        const stepIdx = pipeline.steps.findIndex((s) => "out" in s && s.out === varName);
        if (stepIdx !== -1) {
          stepsToNodes.set(stepIdx, node.id);
        }
      }
    }

    // Step 6: Execute steps sequentially for real-time progress
    // Filter out text/vision steps that were already executed for prompt resolution
    const alreadyExecuted = new Set(
      [...dataOutputs.keys()].map((nodeId) => nodeToVar.get(nodeId)).filter(Boolean)
    );

    const remainingSteps = pipeline.steps.filter((step) => {
      const stepOut = "out" in step ? (step as { out: string }).out : null;
      return !stepOut || !alreadyExecuted.has(stepOut);
    });

    // Build intermediate variable storage for sequential execution
    const stepVariables: Record<string, ImageBlob> = { ...initialVariables };

    // Copy any resolved reference images to stepVariables
    for (const [varName, blob] of resolvedRefImages) {
      stepVariables[varName] = blob;
    }

    // Track failed output variables to skip dependent steps
    const failedOutputVars = new Set<string>();

    // Track all results for processing
    type StepResult = {
      step: Pipeline["steps"][number];
      value: unknown;
      out: string;
      id?: string;
    };
    const results: StepResult[] = [];

    for (let i = 0; i < remainingSteps.length; i++) {
      const step = remainingSteps[i];
      const stepOut = "out" in step ? (step as { out: string }).out : undefined;
      const stepNodeId = stepOut
        ? [...nodeToVar.entries()].find(([, v]) => v === stepOut)?.[0]
        : undefined;

      // Check if any input dependencies have failed
      const stepIn = "in" in step ? (step as { in?: string }).in : undefined;
      if (stepIn && failedOutputVars.has(stepIn)) {
        // Mark this step's output as failed too (propagate failure)
        if (stepOut) {
          failedOutputVars.add(stepOut);
        }
        // Fire skipped callback
        if (stepNodeId) {
          callbacks?.onStep?.({
            stepIndex: i,
            id: stepNodeId,
            status: "skipped",
            skipReason: "Upstream step failed or was blocked by content moderation",
          });
        }
        continue; // Skip this step
      }

      // Track current node for error reporting
      currentStepId = stepNodeId;

      // Notify step is running
      if (stepNodeId) {
        callbacks?.onStep?.({
          stepIndex: i,
          id: stepNodeId,
          status: "running",
        });
      }

      // Handle SDK branching steps (fan-out, collect, router) via SDK execution
      // The SDK handles these step types natively - we delegate execution and handle results
      const stepWithKind = step as { kind: string };

      if (isFanOutStep(stepWithKind)) {
        // Fan-out: SDK distributes input to multiple branch outputs
        const fanoutStep = step as unknown as {
          kind: "fan-out";
          in: string;
          mode: string;
          count?: number;
          arrayProperty?: string;
          out: string[];
        };
        const singlePipeline: Pipeline = {
          name: "Fan-Out Step",
          steps: [step] as Pipeline["steps"],
          initialVariables: stepVariables,
        };

        const fanoutResults = await client.run(singlePipeline);

        // Store branch outputs in stepVariables using the out array names
        for (const result of fanoutResults) {
          if (result.out && result.value !== undefined) {
            stepVariables[result.out] = result.value as ImageBlob;
          }
        }

        // Fire callback for each branch
        const branchCount = fanoutStep.out.length;
        for (let branchIdx = 0; branchIdx < branchCount; branchIdx++) {
          callbacks?.onStep?.({
            stepIndex: i,
            id: stepNodeId!,
            status: "completed",
            branchId: fanoutStep.out[branchIdx],
            branchIndex: branchIdx,
            totalBranches: branchCount,
          });
        }

        results.push({
          step,
          value: fanoutResults.map((r) => r.value),
          out: fanoutStep.out[0],
          id: stepNodeId,
        });
        continue;
      }

      if (isCollectStep(stepWithKind)) {
        // Collect: SDK gathers inputs from branches into an array
        const collectStep = step as unknown as {
          kind: "collect";
          in: string[];
          waitMode: string;
          out: string;
        };
        const singlePipeline: Pipeline = {
          name: "Collect Step",
          steps: [step] as Pipeline["steps"],
          initialVariables: stepVariables,
        };

        const collectResults = await client.run(singlePipeline);

        // Store collected array in stepVariables
        if (collectResults.length > 0) {
          const collectResult = collectResults[0];
          stepVariables[collectStep.out] = collectResult.value as ImageBlob;
        }

        callbacks?.onStep?.({
          stepIndex: i,
          id: stepNodeId!,
          status: "completed",
        });

        results.push({
          step,
          value: collectResults[0]?.value,
          out: collectStep.out,
          id: stepNodeId,
        });
        continue;
      }

      if (isRouterStep(stepWithKind)) {
        // Router: SDK selects from candidates based on selection data
        const routerStep = step as unknown as {
          kind: "router";
          in: string;
          selectionIn: string;
          selectionProperty: string;
          selectionType: string;
          out: string;
        };
        const singlePipeline: Pipeline = {
          name: "Router Step",
          steps: [step] as Pipeline["steps"],
          initialVariables: stepVariables,
        };

        const routerResults = await client.run(singlePipeline);

        // Store selected value in stepVariables
        let winnerValue: unknown = null;
        if (routerResults.length > 0) {
          const routerResult = routerResults[0];
          winnerValue = routerResult.value;
          stepVariables[routerStep.out] = winnerValue as ImageBlob;

          // If winner is an ImageBlob, save it and fire callback with preview
          if (isImageBlob(winnerValue) && stepNodeId) {
            const blob = winnerValue;
            const node = nodes.find((n) => n.id === stepNodeId);

            if (node) {
              // Save the winning image to disk
              const imageId = `img_${Date.now()}_${nanoid(6)}`;
              const ext = MIME_TO_EXT[blob.mime] || "png";
              const filename = `${imageId}.${ext}`;
              const imagePath = join(OUTPUT_DIR, filename);

              await mkdir(dirname(imagePath), { recursive: true });
              await writeFile(imagePath, blob.bytes);

              // Write metadata sidecar file
              const metadata: ImageMetadata = {
                id: imageId,
                filename,
                mime: blob.mime,
                size: blob.bytes.length,
                createdAt: Date.now(),
                workflow: {
                  nodes,
                  edges,
                  executedAt: Date.now(),
                  templateId,
                },
              };
              const metadataPath = join(OUTPUT_DIR, `${imageId}.meta.json`);
              await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

              imageIds.push(imageId);
              images.set(imageId, blob.bytes);
              idByImageId.set(imageId, node.id);

              // Build preview and fire completed callback
              const previewMime = blob.mime || "image/png";
              const preview = `data:${previewMime};base64,${blob.bytes.toString("base64")}`;

              callbacks?.onStep?.({
                stepIndex: i,
                id: stepNodeId,
                status: "completed",
                imageId,
                preview,
              });

              results.push({ step, value: winnerValue, out: routerStep.out, id: stepNodeId });
              continue;
            }
          }
        }

        callbacks?.onStep?.({
          stepIndex: i,
          id: stepNodeId!,
          status: "completed",
        });

        results.push({ step, value: winnerValue, out: routerStep.out, id: stepNodeId });
        continue;
      }

      // Special handling for vision steps with array input (from collect)
      if (step.kind === "vision" && step.in) {
        const inputValue = stepVariables[step.in];
        if (Array.isArray(inputValue)) {
          // Input is an array of images from collect - pass all images via params
          const imageBlobs = inputValue.filter((v) => isImageBlob(v)) as ImageBlob[];
          if (imageBlobs.length > 0) {
            // Use first image as primary, rest as additional
            const primaryImage = imageBlobs[0];
            const additionalImages = imageBlobs.slice(1);

            // Clone params and add additional images
            const visionParams = {
              ...step.params,
              _additionalImages: additionalImages,
            };

            // Create modified step with first image as input
            const modifiedStepVariables = {
              ...stepVariables,
              [step.in]: primaryImage,
            };

            const singlePipeline: Pipeline = {
              name: "Single Step",
              steps: [{ ...step, params: visionParams }] as Pipeline["steps"],
              initialVariables: modifiedStepVariables,
            };

            const singleResults = await client.run(singlePipeline);

            if (singleResults.length > 0) {
              const singleResult = singleResults[0];
              if (stepOut) {
                stepVariables[stepOut] = singleResult.value as ImageBlob;
              }

              // Store parsed data for router to access
              if (stepOut && isDataBlob(singleResult.value) && singleResult.value.parsed) {
                stepVariables[`${stepOut}_parsed`] = singleResult.value
                  .parsed as unknown as ImageBlob;
                // Also store the raw DataBlob for direct access
                stepVariables[stepOut] = singleResult.value.parsed as unknown as ImageBlob;
              }

              if (stepNodeId && isDataBlob(singleResult.value)) {
                dataOutputs.set(stepNodeId, {
                  kind: "data",
                  dataType: singleResult.value.type,
                  content: singleResult.value.content,
                  parsed: singleResult.value.parsed,
                });

                callbacks?.onStep?.({
                  stepIndex: i,
                  id: stepNodeId,
                  status: "completed",
                  dataType: singleResult.value.type,
                  content: singleResult.value.content,
                  parsed: singleResult.value.parsed,
                });
              }

              results.push({
                step,
                value: singleResult.value,
                out: stepOut || "",
                id: stepNodeId,
              });
            }
            continue;
          }
        }
      }

      // Dynamic prompt injection for generators whose text source wasn't resolved early
      // (e.g., text step that depends on vision output)
      if ((step.kind === "generate" || step.kind === "transform") && step.params?._promptFromVar) {
        const varName = step.params._promptFromVar as string;
        const propertyName = step.params._promptFromProperty as string | undefined;

        // Check if the source variable is now available in stepVariables (from a text step that ran in main loop)
        const sourceValue = stepVariables[varName];
        const sourceParsed = stepVariables[`${varName}_parsed`] as unknown as
          | Record<string, unknown>
          | undefined;

        if (sourceValue || sourceParsed) {
          let text: string | undefined;

          // Handle DataBlob objects (text step results stored as full DataBlob)
          if (isDataBlob(sourceValue as unknown)) {
            const dataBlob = sourceValue as unknown as {
              content: string;
              parsed?: Record<string, unknown>;
            };
            if (propertyName && dataBlob.parsed && propertyName in dataBlob.parsed) {
              const value = dataBlob.parsed[propertyName];
              text = typeof value === "string" ? value : JSON.stringify(value);
            } else if (dataBlob.parsed) {
              text = findPromptInParsed(dataBlob.parsed);
            }
            // Final fallback to raw content only if it's not JSON
            if (!text && !dataBlob.content.startsWith("{")) {
              text = dataBlob.content;
            }
          } else if (propertyName && sourceParsed && propertyName in sourceParsed) {
            const value = sourceParsed[propertyName];
            text = typeof value === "string" ? value : JSON.stringify(value);
          } else if (sourceParsed) {
            text = findPromptInParsed(sourceParsed);
          } else if (typeof sourceValue === "string") {
            text = sourceValue;
          }

          if (text) {
            step.params.prompt = text;
            console.log(`Dynamic prompt injection for ${step.kind}: "${text.slice(0, 50)}..."`);
          } else {
            console.warn(
              `No text extracted for ${varName} - sourceValue type: ${typeof sourceValue}`
            );
          }
          // Clean up markers
          delete step.params._promptFromVar;
          delete step.params._promptFromProperty;
        }
      }

      // Execute single step (existing logic for generator, transform, etc.)
      const singlePipeline: Pipeline = {
        name: "Single Step",
        steps: [step] as Pipeline["steps"],
        initialVariables: stepVariables,
      };

      const singleResults = await client.run(singlePipeline);

      // Store result for variable passing to next steps
      if (singleResults.length > 0) {
        const singleResult = singleResults[0];
        const node = stepNodeId ? nodes.find((n) => n.id === stepNodeId) : undefined;

        if (stepOut && isImageBlob(singleResult.value)) {
          stepVariables[stepOut] = singleResult.value;
          const blob = singleResult.value;

          // Process image immediately: moderate, save, callback
          if (stepNodeId && node) {
            // Moderate image before saving
            if (isModerationEnabled()) {
              try {
                const moderationResult = await moderateImage(blob.bytes, blob.mime);
                if (moderationResult.flagged) {
                  await logModerationIncident("generated", moderationResult, {
                    id: node.id,
                    nodeType: node.type,
                  });
                  // Track this output var as failed so dependent steps can be skipped
                  if (stepOut) {
                    failedOutputVars.add(stepOut);
                  }
                  callbacks?.onStep?.({
                    stepIndex: i,
                    id: stepNodeId,
                    status: "error",
                    error: `Content policy violation: Image flagged for ${moderationResult.flaggedCategories.join(", ")}`,
                  });
                  continue; // Skip saving this image
                }
              } catch (moderationError) {
                if (
                  moderationError instanceof Error &&
                  moderationError.message.includes("Content policy violation")
                ) {
                  throw moderationError;
                }
                console.error("Moderation check failed:", moderationError);
                if (isStrictModeEnabled()) {
                  await logModerationIncident(
                    "error",
                    {
                      safe: false,
                      flagged: true,
                      categories: {} as never,
                      categoryScores: {},
                      flaggedCategories: ["moderation_service_error"],
                    },
                    {
                      id: node.id,
                      nodeType: node.type,
                      error: String(moderationError),
                    }
                  );
                  throw new Error(
                    "Content moderation service unavailable. Generation blocked for safety."
                  );
                }
                console.warn("Moderation failed but strict mode is OFF - allowing generation");
              }
            }

            // Save image to disk
            const imageId = `img_${Date.now()}_${nanoid(6)}`;
            const ext = MIME_TO_EXT[blob.mime] || "png";
            const filename = `${imageId}.${ext}`;
            const imagePath = join(OUTPUT_DIR, filename);

            await mkdir(dirname(imagePath), { recursive: true });
            await writeFile(imagePath, blob.bytes);

            // Write metadata sidecar file
            const metadata: ImageMetadata = {
              id: imageId,
              filename,
              mime: blob.mime,
              size: blob.bytes.length,
              createdAt: Date.now(),
              workflow: {
                nodes,
                edges,
                executedAt: Date.now(),
                templateId,
              },
            };
            const metadataPath = join(OUTPUT_DIR, `${imageId}.meta.json`);
            await writeFile(metadataPath, JSON.stringify(metadata, null, 2));

            imageIds.push(imageId);
            images.set(imageId, blob.bytes);
            idByImageId.set(imageId, node.id);

            // Build preview and fire completed callback immediately
            const previewMime = blob.mime || "image/png";
            const preview = `data:${previewMime};base64,${blob.bytes.toString("base64")}`;

            callbacks?.onStep?.({
              stepIndex: i,
              id: stepNodeId,
              status: "completed",
              imageId,
              preview,
            });
          }
        }

        // Handle text/vision outputs - these don't need moderation, so complete immediately
        if (stepNodeId && isDataBlob(singleResult.value) && !dataOutputs.has(stepNodeId)) {
          const dataBlob = singleResult.value;
          dataOutputs.set(stepNodeId, {
            kind: "data",
            dataType: dataBlob.type,
            content: dataBlob.content,
            parsed: dataBlob.parsed,
          });

          // Store the DataBlob in stepVariables so dependent steps can access it
          if (stepOut) {
            stepVariables[stepOut] = dataBlob as unknown as ImageBlob;
          }
          // Also store parsed data separately for property extraction
          if (stepOut && dataBlob.parsed) {
            stepVariables[`${stepOut}_parsed`] = dataBlob.parsed as unknown as ImageBlob;
          }

          callbacks?.onStep?.({
            stepIndex: i,
            id: stepNodeId,
            status: "completed",
            dataType: dataBlob.type,
            content: dataBlob.content,
            parsed: dataBlob.parsed,
          });
        }

        results.push({ step, value: singleResult.value, out: stepOut || "", id: stepNodeId });
      }
    }

    // Step 7: Handle save steps (images and data outputs were already processed in the loop above)
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const stepId = result.id;

      if (!stepId) continue;

      // Handle save steps (no output to track, just fire callback)
      if (result.step.kind === "save") {
        callbacks?.onStep?.({
          stepIndex: i,
          id: stepId,
          status: "completed",
        });
      }
    }

    callbacks?.onComplete?.(imageIds);
    // Collect usage events from all AI operations in this execution
    const usageEvents = getCollectedUsageEvents();

    return { imageIds, images, idByImageId, dataOutputs, usageEvents };
  } catch (error) {
    callbacks?.onError?.(error instanceof Error ? error.message : String(error), currentStepId);
    throw error;
  }
}

/**
 * Convert studio workflow to floimg Pipeline format
 *
 * Used for:
 * - YAML export
 * - Execution via client.run()
 *
 * @param nodes - Workflow nodes
 * @param edges - Workflow edges
 * @param aiProviders - Optional AI provider configuration for API key injection
 */
export function toPipeline(
  nodes: StudioNode[],
  edges: StudioEdge[],
  aiProviders?: AIProviderConfig
): { pipeline: { name: string; steps: unknown[] }; nodeToVar: Map<string, string> } {
  // Build a map of fan-out node IDs to their output counts
  const fanoutNodes = new Map<string, { count: number; mode: "array" | "count" }>();
  for (const node of nodes) {
    if (node.type === "fanout") {
      const data = node.data as FanOutNodeData;
      fanoutNodes.set(node.id, {
        count: data.count || 3,
        mode: data.mode || "count",
      });
    }
  }

  // Topological sort for ordering
  const dependencies = buildDependencyGraph(nodes, edges);
  const completed = new Set<string>();
  const sorted: StudioNode[] = [];

  while (sorted.length < nodes.length) {
    const ready = nodes.filter((n) => {
      if (completed.has(n.id)) return false;
      const deps = dependencies.get(n.id) || new Set();
      for (const dep of deps) {
        if (!completed.has(dep)) return false;
      }
      return true;
    });

    if (ready.length === 0) break;

    for (const node of ready) {
      sorted.push(node);
      completed.add(node.id);
    }
  }

  const nodeToVar = new Map<string, string>();
  const steps: unknown[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const node = sorted[i];
    const varName = `v${i}`;
    nodeToVar.set(node.id, varName);

    // Input nodes don't create pipeline steps - their data is injected via initialVariables
    if (node.type === "input") {
      continue;
    }

    if (node.type === "generator") {
      const data = node.data as GeneratorNodeData;

      // Inject API key for AI generators if available
      let params = { ...data.params };
      const apiKey = getApiKeyForProvider(data.generatorName, aiProviders);
      if (apiKey && !params.apiKey) {
        params = { ...params, apiKey };
      }

      // Find text input edge (for AI generators with dynamic prompts)
      const textEdge = edges.find((e) => e.target === node.id && e.targetHandle === "text");
      const textSourceVar = textEdge ? nodeToVar.get(textEdge.source) : undefined;
      // Capture source handle for property extraction (e.g., "output.prompt" extracts just the prompt property)
      const textSourceHandle = textEdge?.sourceHandle;

      // Check if text input comes from a fan-out branch (sourceHandle like "out[0]", "out[1]", etc.)
      const fanoutBranchMatch = textSourceHandle?.match(/^out\[(\d+)\]$/);
      const isFanoutBranch = fanoutBranchMatch && textEdge && fanoutNodes.has(textEdge.source);

      if (isFanoutBranch && textEdge) {
        // This generator is connected to a specific fan-out branch
        // Create a single step that references the branch variable
        // SDK fan-out outputs use format: varName_index (e.g., "v3_0", "v3_1")
        const branchIndex = parseInt(fanoutBranchMatch[1], 10);
        const fanoutVar = nodeToVar.get(textEdge.source);

        params = {
          ...params,
          _promptFromVar: `${fanoutVar}_${branchIndex}`, // SDK format: varName_index
        };

        steps.push({
          kind: "generate",
          generator: data.generatorName,
          params,
          out: varName,
        });
      } else {
        // Regular non-branch generator
        // If there's a text input, mark it for resolution
        if (textSourceVar) {
          params = { ...params, _promptFromVar: textSourceVar };
          // If sourceHandle specifies a property (e.g., "output.prompt"), mark it for extraction
          if (textSourceHandle?.startsWith("output.")) {
            params = { ...params, _promptFromProperty: textSourceHandle.slice(7) };
          }
        }

        // Find reference image edges (for AI generators that accept reference images)
        const referenceEdges = edges.filter(
          (e) => e.target === node.id && e.targetHandle === "references"
        );
        if (referenceEdges.length > 0) {
          const refVars = referenceEdges
            .map((e) => nodeToVar.get(e.source))
            .filter((v): v is string => v !== undefined);
          if (refVars.length > 0) {
            params = { ...params, _referenceImageVars: refVars };
          }
        }

        steps.push({
          kind: "generate",
          generator: data.generatorName,
          params,
          out: varName,
        });
      }
    } else if (node.type === "transform") {
      const data = node.data as TransformNodeData;

      // Find image input edge (targetHandle is "image" or undefined for backward compat)
      const imageEdge = edges.find(
        (e) => e.target === node.id && (e.targetHandle === "image" || !e.targetHandle)
      );
      const inputVar = imageEdge ? nodeToVar.get(imageEdge.source) : undefined;

      // Find text input edge (for AI transforms with dynamic prompts)
      const textEdge = edges.find((e) => e.target === node.id && e.targetHandle === "text");
      const textSourceVar = textEdge ? nodeToVar.get(textEdge.source) : undefined;
      // Capture source handle for property extraction (e.g., "output.prompt" extracts just the prompt property)
      const textSourceHandle = textEdge?.sourceHandle;

      // Inject API key for AI transforms if provider is specified
      let params = { ...data.params };
      if (data.providerName) {
        const apiKey = getApiKeyForProvider(data.providerName, aiProviders);
        if (apiKey && !params.apiKey) {
          // Only inject if not already specified in params
          params = { ...params, apiKey };
        }
      }

      // If there's a text input, mark it for resolution
      // The actual text will be injected during execution after text nodes complete
      if (textSourceVar) {
        params = { ...params, _promptFromVar: textSourceVar };
        // If sourceHandle specifies a property (e.g., "output.prompt"), mark it for extraction
        if (textSourceHandle?.startsWith("output.")) {
          params = { ...params, _promptFromProperty: textSourceHandle.slice(7) }; // Extract "prompt" from "output.prompt"
        }
      }

      // Find reference image edges (for AI transforms that accept additional references)
      const referenceEdges = edges.filter(
        (e) => e.target === node.id && e.targetHandle === "references"
      );
      if (referenceEdges.length > 0) {
        const refVars = referenceEdges
          .map((e) => nodeToVar.get(e.source))
          .filter((v): v is string => v !== undefined);
        if (refVars.length > 0) {
          params = { ...params, _referenceImageVars: refVars };
        }
      }

      steps.push({
        kind: "transform",
        op: data.operation,
        in: inputVar,
        params,
        out: varName,
        // Include provider name if specified (for AI transforms routing)
        ...(data.providerName && { provider: data.providerName }),
      });
    } else if (node.type === "save") {
      const data = node.data as SaveNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      steps.push({
        kind: "save",
        in: inputVar,
        destination: data.destination,
        provider: data.provider,
      });
    } else if (node.type === "vision") {
      const data = node.data as VisionNodeData;
      // Find image input edge (targetHandle is "image" or undefined for backward compat)
      const inputEdge = edges.find(
        (e) => e.target === node.id && (e.targetHandle === "image" || !e.targetHandle)
      );
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      // Find context input edge (for workflow context - prompts, objectives, etc.)
      const contextEdge = edges.find((e) => e.target === node.id && e.targetHandle === "context");
      const contextSourceVar = contextEdge ? nodeToVar.get(contextEdge.source) : undefined;

      // Inject API key for vision providers
      let params = { ...data.params };

      // If there's a context input, mark it for resolution
      // The context will be prepended to the prompt during execution
      if (contextSourceVar) {
        params = { ...params, _contextFromVar: contextSourceVar };
      }
      const apiKey = getApiKeyForProvider(data.providerName, aiProviders);
      if (apiKey && !params.apiKey) {
        params = { ...params, apiKey };
      }

      steps.push({
        kind: "vision",
        provider: data.providerName,
        in: inputVar,
        params,
        out: varName,
      });
    } else if (node.type === "text") {
      const data = node.data as TextNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      // Inject API key for text providers
      let params = { ...data.params };
      const apiKey = getApiKeyForProvider(data.providerName, aiProviders);
      if (apiKey && !params.apiKey) {
        params = { ...params, apiKey };
      }

      steps.push({
        kind: "text",
        provider: data.providerName,
        in: inputVar,
        params,
        out: varName,
      });
    } else if (node.type === "fanout") {
      const data = node.data as FanOutNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      // SDK fan-out: out is an array of branch variable names
      const branchCount = data.count || 3;
      const branchVars = Array.from({ length: branchCount }, (_, i) => `${varName}_${i}`);

      steps.push({
        kind: "fan-out", // SDK uses hyphen
        in: inputVar || "",
        mode: data.mode || "count",
        count: branchCount,
        arrayProperty: data.arrayProperty,
        out: branchVars, // Array of output variable names
      });
    } else if (node.type === "collect") {
      const data = node.data as CollectNodeData;
      // Collect gathers from multiple inputs - find all incoming edges
      const inputEdges = edges.filter((e) => e.target === node.id);
      const inputVars = inputEdges
        .map((e) => nodeToVar.get(e.source))
        .filter((v): v is string => v !== undefined);

      // SDK collect: uses 'in' (not 'inputs'), minRequired for available mode
      const waitMode = data.waitMode || "all";
      steps.push({
        kind: "collect", // SDK format
        in: inputVars, // SDK uses 'in' for input array
        waitMode,
        ...(waitMode === "available" && { minRequired: Math.max(1, data.expectedInputs || 1) }),
        out: varName,
      });
    } else if (node.type === "router") {
      const data = node.data as RouterNodeData;
      // Router takes candidates array and selection data
      const candidatesEdge = edges.find(
        (e) => e.target === node.id && e.targetHandle === "candidates"
      );
      const selectionEdge = edges.find(
        (e) => e.target === node.id && e.targetHandle === "selection"
      );

      const candidatesVar = candidatesEdge ? nodeToVar.get(candidatesEdge.source) : undefined;
      const selectionVar = selectionEdge ? nodeToVar.get(selectionEdge.source) : undefined;

      // SDK router: uses 'in' for candidates, proper selectionType values
      // Note: SDK uses "property" not "value" for selection type
      const selectionType =
        data.selectionType === "value" ? "property" : data.selectionType || "index";
      steps.push({
        kind: "router",
        in: candidatesVar || "", // SDK uses 'in' for candidates
        selectionIn: selectionVar || "", // Selection data variable
        selectionType: selectionType as "index" | "property",
        selectionProperty: data.selectionProperty || "winner",
        out: varName,
        // Note: outputCount and contextProperty are Studio-specific features not in SDK
      });
    }
  }

  return {
    pipeline: {
      name: "Studio Workflow",
      steps,
    },
    nodeToVar,
  };
}
