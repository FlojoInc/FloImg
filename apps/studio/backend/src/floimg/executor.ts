/**
 * Workflow executor - executes studio workflows using floimg core's pipeline runner
 *
 * Execution model:
 * - Converts Studio graph (nodes + edges) to floimg Pipeline format
 * - Delegates execution to client.run() which handles wave-based parallel execution
 * - Pre-loads input nodes and injects them via pipeline.initialVariables
 * - Post-processes results for moderation, saving, and callbacks
 */

import { getClient } from "./setup.js";
import type {
  StudioNode,
  StudioEdge,
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  InputNodeData,
  VisionNodeData,
  TextNodeData,
  ExecutionStepResult,
  ImageMetadata,
} from "@teamflojo/floimg-studio-shared";
import type { ImageBlob, Pipeline } from "@teamflojo/floimg";
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
  onError?: (error: string) => void;
}

// AI provider configuration from frontend
export interface AIProviderConfig {
  openai?: { apiKey: string };
  anthropic?: { apiKey: string };
  gemini?: { apiKey: string };
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
  nodeIdByImageId: Map<string, string>;
  dataOutputs: Map<string, DataOutput>;
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
  const nodeIdByImageId = new Map<string, string>();
  const dataOutputs = new Map<string, DataOutput>();

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
        nodeId: inputNode.id,
        status: "running",
      });
    }

    // Step 2: Convert workflow to pipeline format
    const { pipeline: pipelineData, nodeToVar } = toPipeline(nodes, edges);

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
          nodeId: inputNode.id,
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

    // Notify all steps as running
    for (const [stepIdx, nodeId] of stepsToNodes) {
      callbacks?.onStep?.({
        stepIndex: stepIdx,
        nodeId,
        status: "running",
      });
    }

    // Step 6: Execute the pipeline using core
    const results = await client.run(pipeline);

    // Step 7: Process results - moderate, save images, and call callbacks
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const nodeId = stepsToNodes.get(i);

      if (!nodeId) continue;

      const node = nodes.find((n) => n.id === nodeId);
      if (!node) continue;

      // Handle image outputs (generate, transform nodes)
      if (result.value && isImageBlob(result.value)) {
        const blob = result.value;

        // Moderate image before saving
        if (isModerationEnabled()) {
          try {
            const moderationResult = await moderateImage(blob.bytes, blob.mime);
            if (moderationResult.flagged) {
              await logModerationIncident("generated", moderationResult, {
                nodeId: node.id,
                nodeType: node.type,
              });
              throw new Error(
                `Content policy violation: Image flagged for ${moderationResult.flaggedCategories.join(", ")}. ` +
                  `This content cannot be saved.`
              );
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
                  nodeId: node.id,
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
        nodeIdByImageId.set(imageId, node.id);

        callbacks?.onStep?.({
          stepIndex: i,
          nodeId: node.id,
          status: "completed",
          imageId,
        });
      }

      // Handle data outputs (vision, text nodes)
      if (result.value && isDataBlob(result.value)) {
        const dataBlob = result.value;
        dataOutputs.set(node.id, {
          kind: "data",
          dataType: dataBlob.type,
          content: dataBlob.content,
          parsed: dataBlob.parsed,
        });

        callbacks?.onStep?.({
          stepIndex: i,
          nodeId: node.id,
          status: "completed",
          dataType: dataBlob.type,
          content: dataBlob.content,
          parsed: dataBlob.parsed,
        });
      }

      // Handle save steps (no output to track)
      if (result.step.kind === "save") {
        callbacks?.onStep?.({
          stepIndex: i,
          nodeId: node.id,
          status: "completed",
        });
      }
    }

    callbacks?.onComplete?.(imageIds);
    return { imageIds, images, nodeIdByImageId, dataOutputs };
  } catch (error) {
    callbacks?.onError?.(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Convert studio workflow to floimg Pipeline format
 *
 * Used for:
 * - YAML export
 * - Execution via client.run()
 */
export function toPipeline(
  nodes: StudioNode[],
  edges: StudioEdge[]
): { pipeline: { name: string; steps: unknown[] }; nodeToVar: Map<string, string> } {
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
      steps.push({
        kind: "generate",
        generator: data.generatorName,
        params: data.params,
        out: varName,
      });
    } else if (node.type === "transform") {
      const data = node.data as TransformNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      steps.push({
        kind: "transform",
        op: data.operation,
        in: inputVar,
        params: data.params,
        out: varName,
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
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      steps.push({
        kind: "vision",
        provider: data.providerName,
        in: inputVar,
        params: data.params,
        out: varName,
      });
    } else if (node.type === "text") {
      const data = node.data as TextNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      steps.push({
        kind: "text",
        provider: data.providerName,
        in: inputVar,
        params: data.params,
        out: varName,
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
