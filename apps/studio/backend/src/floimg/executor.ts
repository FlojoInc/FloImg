/**
 * Workflow executor - executes studio workflows with parallel execution support
 *
 * Execution model:
 * - Nodes execute in "waves" based on dependency resolution
 * - Nodes with all dependencies satisfied run in parallel
 * - Fan-out is supported (one generator -> multiple transforms)
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
} from "@floimg-studio/shared";
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

// Node output types - supports both image and text data
interface ImageOutput {
  kind: "image";
  bytes: Buffer;
  mime: string;
}

interface DataOutput {
  kind: "data";
  dataType: "text" | "json";
  content: string;
  parsed?: Record<string, unknown>;
}

type NodeOutput = ImageOutput | DataOutput | null;

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

export interface ExecutionOptions {
  /** Optional template ID if workflow was loaded from a template */
  templateId?: string;
  /** Callbacks for execution events */
  callbacks?: ExecutionCallbacks;
  /** AI provider configurations (API keys, base URLs) */
  aiProviders?: AIProviderConfig;
}

export interface ExecutionResult {
  imageIds: string[];
  images: Map<string, Buffer>;
  nodeIdByImageId: Map<string, string>;
  dataOutputs: Map<string, DataOutput>;
}

/**
 * Build dependency graph from nodes and edges
 * Returns maps for quick lookup of dependencies and dependents
 */
function buildDependencyGraph(
  nodes: StudioNode[],
  edges: StudioEdge[]
): {
  dependencies: Map<string, Set<string>>; // nodeId -> set of nodeIds it depends on
  dependents: Map<string, Set<string>>; // nodeId -> set of nodeIds that depend on it
} {
  const dependencies = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();

  // Initialize empty sets for all nodes
  for (const node of nodes) {
    dependencies.set(node.id, new Set());
    dependents.set(node.id, new Set());
  }

  // Build dependency relationships from edges
  for (const edge of edges) {
    // target depends on source
    dependencies.get(edge.target)?.add(edge.source);
    // source has target as dependent
    dependents.get(edge.source)?.add(edge.target);
  }

  return { dependencies, dependents };
}

/**
 * Find all nodes that are ready to execute (all dependencies satisfied)
 */
function findReadyNodes(
  nodes: StudioNode[],
  completed: Set<string>,
  running: Set<string>,
  dependencies: Map<string, Set<string>>
): StudioNode[] {
  return nodes.filter((node) => {
    // Skip if already completed or running
    if (completed.has(node.id) || running.has(node.id)) {
      return false;
    }

    // Check if all dependencies are satisfied
    const deps = dependencies.get(node.id) || new Set();
    for (const depId of deps) {
      if (!completed.has(depId)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Execute a single node and return the result
 * Supports both image-producing nodes (generator, transform, input)
 * and data-producing nodes (vision, text)
 */
async function executeNode(
  node: StudioNode,
  edges: StudioEdge[],
  variables: Map<string, NodeOutput>,
  client: ReturnType<typeof getClient>
): Promise<NodeOutput> {
  if (node.type === "generator") {
    const data = node.data as GeneratorNodeData;
    const result = await client.generate({
      generator: data.generatorName,
      params: data.params,
    });
    return { kind: "image", bytes: result.bytes, mime: result.mime };
  } else if (node.type === "transform") {
    const data = node.data as TransformNodeData;
    const inputEdge = edges.find((e) => e.target === node.id);
    if (!inputEdge) throw new Error(`No input for transform node ${node.id}`);

    const input = variables.get(inputEdge.source);
    if (!input || input.kind !== "image") {
      throw new Error(`Transform node ${node.id} requires image input`);
    }

    // Extract 'to' from params for convert operation (floimg expects it at top level)
    const { to, ...restParams } = data.params as { to?: string; [key: string]: unknown };

    const result = await client.transform({
      blob: {
        bytes: input.bytes,
        mime: input.mime as
          | "image/png"
          | "image/jpeg"
          | "image/svg+xml"
          | "image/webp"
          | "image/avif",
      },
      op: data.operation as
        | "convert"
        | "resize"
        | "blur"
        | "sharpen"
        | "grayscale"
        | "roundCorners"
        | "addText"
        | "addCaption"
        | "modulate"
        | "preset"
        | "composite"
        | "optimizeSvg"
        | "negate"
        | "normalize"
        | "threshold"
        | "tint"
        | "extend"
        | "extract",
      to: to as
        | "image/png"
        | "image/jpeg"
        | "image/svg+xml"
        | "image/webp"
        | "image/avif"
        | undefined,
      params: restParams,
    });
    return { kind: "image", bytes: result.bytes, mime: result.mime };
  } else if (node.type === "save") {
    const data = node.data as SaveNodeData;
    const inputEdge = edges.find((e) => e.target === node.id);
    if (!inputEdge) throw new Error(`No input for save node ${node.id}`);

    const input = variables.get(inputEdge.source);
    if (!input || input.kind !== "image") {
      throw new Error(`Save node ${node.id} requires image input`);
    }

    await client.save(
      {
        bytes: input.bytes,
        mime: input.mime as
          | "image/png"
          | "image/jpeg"
          | "image/svg+xml"
          | "image/webp"
          | "image/avif",
      },
      data.destination
    );
    return null; // Save nodes don't produce output
  } else if (node.type === "input") {
    const data = node.data as InputNodeData;
    if (!data.uploadId) {
      throw new Error(`No image selected for input node ${node.id}`);
    }

    const upload = await loadUpload(data.uploadId);
    if (!upload) {
      throw new Error(`Upload not found: ${data.uploadId}`);
    }

    return { kind: "image", bytes: upload.bytes, mime: upload.mime };
  } else if (node.type === "vision") {
    // Vision node: analyze an image with AI
    const data = node.data as VisionNodeData;
    const inputEdge = edges.find((e) => e.target === node.id);
    if (!inputEdge) throw new Error(`No input for vision node ${node.id}`);

    const input = variables.get(inputEdge.source);
    if (!input || input.kind !== "image") {
      throw new Error(`Vision node ${node.id} requires image input`);
    }

    const result = await client.analyzeImage({
      provider: data.providerName,
      blob: {
        bytes: input.bytes,
        mime: input.mime as
          | "image/png"
          | "image/jpeg"
          | "image/svg+xml"
          | "image/webp"
          | "image/avif",
      },
      params: data.params,
    });

    return {
      kind: "data",
      dataType: result.type,
      content: result.content,
      parsed: result.parsed,
    };
  } else if (node.type === "text") {
    // Text node: generate text with AI (optionally using context from previous step)
    const data = node.data as TextNodeData;
    const inputEdge = edges.find((e) => e.target === node.id);

    // If there's an input edge, get context from previous step
    let context: string | undefined;
    if (inputEdge) {
      const input = variables.get(inputEdge.source);
      if (input && input.kind === "data") {
        context = input.content;
      }
    }

    const result = await client.generateText({
      provider: data.providerName,
      params: { ...data.params, context },
    });

    return {
      kind: "data",
      dataType: result.type,
      content: result.content,
      parsed: result.parsed,
    };
  }

  return null;
}

/**
 * Execute a workflow with parallel execution support
 *
 * Algorithm:
 * 1. Build dependency graph
 * 2. Find nodes with no unsatisfied dependencies (ready set)
 * 3. Execute ready set in parallel
 * 4. Mark completed, update dependencies
 * 5. Repeat until all nodes executed
 */
export async function executeWorkflow(
  nodes: StudioNode[],
  edges: StudioEdge[],
  options?: ExecutionOptions
): Promise<ExecutionResult> {
  const { templateId, callbacks } = options || {};
  const imageIds: string[] = [];
  const images = new Map<string, Buffer>();
  const nodeIdByImageId = new Map<string, string>();
  const dataOutputs = new Map<string, DataOutput>();

  // Track execution state
  const completed = new Set<string>();
  const running = new Set<string>();
  const variables = new Map<string, NodeOutput>();

  // Build dependency graph
  const { dependencies } = buildDependencyGraph(nodes, edges);

  // Get the shared floimg client
  const client = getClient();

  let waveIndex = 0;

  try {
    // Execute in waves until all nodes are done
    while (completed.size < nodes.length) {
      // Find nodes ready to execute
      const readyNodes = findReadyNodes(nodes, completed, running, dependencies);

      if (readyNodes.length === 0 && running.size === 0) {
        // No ready nodes and nothing running - might have disconnected nodes
        const remaining = nodes.filter((n) => !completed.has(n.id));
        if (remaining.length > 0) {
          console.warn(
            `Skipping ${remaining.length} disconnected nodes:`,
            remaining.map((n) => n.id)
          );
          break;
        }
      }

      if (readyNodes.length === 0) {
        // Should not happen if graph is valid
        break;
      }

      console.log(
        `Wave ${waveIndex}: executing ${readyNodes.length} nodes in parallel:`,
        readyNodes.map((n) => `${n.type}:${n.id}`)
      );

      // Mark nodes as running and notify
      for (const node of readyNodes) {
        running.add(node.id);
        callbacks?.onStep?.({
          stepIndex: waveIndex,
          nodeId: node.id,
          status: "running",
        });
      }

      // Execute all ready nodes in parallel
      const results = await Promise.allSettled(
        readyNodes.map(async (node) => {
          try {
            const result = await executeNode(node, edges, variables, client);

            // Store result for downstream nodes
            if (result) {
              variables.set(node.id, result);

              // Handle image output (generate, transform, input nodes)
              if (result.kind === "image") {
                // SCAN BEFORE SAVE: Moderate image before writing to disk
                if (isModerationEnabled()) {
                  try {
                    const moderationResult = await moderateImage(result.bytes, result.mime);
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
                    // Check if it's a policy violation (our own error) vs API error
                    if (
                      moderationError instanceof Error &&
                      moderationError.message.includes("Content policy violation")
                    ) {
                      throw moderationError;
                    }
                    // API/service error
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

                // Save intermediate image (only reached if moderation passed)
                const imageId = `img_${Date.now()}_${nanoid(6)}`;
                const ext = MIME_TO_EXT[result.mime] || "png";
                const filename = `${imageId}.${ext}`;
                const imagePath = join(OUTPUT_DIR, filename);

                await mkdir(dirname(imagePath), { recursive: true });
                await writeFile(imagePath, result.bytes);

                // Write metadata sidecar file (enables "what workflow created this?" queries)
                const metadata: ImageMetadata = {
                  id: imageId,
                  filename,
                  mime: result.mime,
                  size: result.bytes.length,
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
                images.set(imageId, result.bytes);
                nodeIdByImageId.set(imageId, node.id);

                return { node, imageId, success: true };
              }

              // Handle data output (vision, text nodes)
              if (result.kind === "data") {
                // Store for return value
                dataOutputs.set(node.id, {
                  kind: "data",
                  dataType: result.dataType,
                  content: result.content,
                  parsed: result.parsed,
                });
                return {
                  node,
                  dataType: result.dataType,
                  content: result.content,
                  parsed: result.parsed,
                  success: true,
                };
              }
            }

            return { node, success: true };
          } catch (error) {
            return {
              node,
              success: false,
              error: error instanceof Error ? error.message : String(error),
            };
          }
        })
      );

      // Process results
      for (const settledResult of results) {
        if (settledResult.status === "fulfilled") {
          const { node, imageId, dataType, content, parsed, success, error } = settledResult.value;
          running.delete(node.id);

          if (success) {
            completed.add(node.id);
            callbacks?.onStep?.({
              stepIndex: waveIndex,
              nodeId: node.id,
              status: "completed",
              // Image output
              imageId,
              // Data output (for vision/text nodes)
              dataType,
              content,
              parsed,
            });
          } else {
            callbacks?.onStep?.({
              stepIndex: waveIndex,
              nodeId: node.id,
              status: "error",
              error,
            });
            throw new Error(`Node ${node.id} failed: ${error}`);
          }
        } else {
          // Promise rejected (shouldn't happen since we catch inside)
          const error = settledResult.reason;
          throw new Error(`Unexpected error: ${error}`);
        }
      }

      waveIndex++;
    }

    callbacks?.onComplete?.(imageIds);
    return { imageIds, images, nodeIdByImageId, dataOutputs };
  } catch (error) {
    callbacks?.onError?.(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Convert studio workflow to floimg Pipeline format (for YAML export)
 * Note: This flattens to sequential execution, parallel info is lost
 */
export function toPipeline(
  nodes: StudioNode[],
  edges: StudioEdge[]
): { pipeline: { name: string; steps: unknown[] }; nodeToVar: Map<string, string> } {
  // Topological sort for sequential ordering
  const { dependencies } = buildDependencyGraph(nodes, edges);
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
