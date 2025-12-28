import type { FastifyInstance } from "fastify";
import type { StudioNode, StudioEdge, ExecutionStepResult } from "@teamflojo/floimg-studio-shared";
import { executeWorkflow, toPipeline } from "../floimg/executor.js";
import { stringify as yamlStringify } from "yaml";
import { nanoid } from "nanoid";

// AI provider configuration from frontend
interface AIProviderConfig {
  openai?: { apiKey: string };
  anthropic?: { apiKey: string };
  gemini?: { apiKey: string };
  openrouter?: { apiKey: string };
  ollama?: { baseUrl: string };
  lmstudio?: { baseUrl: string };
}

// Cloud config injected by floimg-cloud for cloud save functionality
interface CloudConfig {
  enabled: boolean;
  userId: string;
  apiBaseUrl: string;
  authToken: string;
}

interface ExecuteBody {
  nodes: StudioNode[];
  edges: StudioEdge[];
  aiProviders?: AIProviderConfig;
  cloudConfig?: CloudConfig;
}

// In-memory store for execution results (for PoC)
const executionResults = new Map<
  string,
  {
    status: "running" | "completed" | "error";
    imageIds: string[];
    error?: string;
  }
>();

export async function executeRoutes(fastify: FastifyInstance) {
  // Execute workflow
  fastify.post<{ Body: ExecuteBody }>("/execute", async (request, reply) => {
    const { nodes, edges } = request.body;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      reply.code(400);
      return { error: "Workflow must have at least one node" };
    }

    const executionId = nanoid();

    // Store initial status
    executionResults.set(executionId, {
      status: "running",
      imageIds: [],
    });

    // Execute asynchronously
    executeWorkflow(nodes, edges, {
      callbacks: {
        onStep: (result: ExecutionStepResult) => {
          fastify.log.info(`Step ${result.stepIndex}: ${result.status}`);
        },
        onComplete: (imageIds: string[]) => {
          executionResults.set(executionId, {
            status: "completed",
            imageIds,
          });
        },
        onError: (error: string) => {
          executionResults.set(executionId, {
            status: "error",
            imageIds: [],
            error,
          });
        },
      },
    }).catch((err: unknown) => {
      fastify.log.error(err);
    });

    return { executionId };
  });

  // Execute workflow synchronously (for simpler PoC testing)
  fastify.post<{ Body: ExecuteBody }>("/execute/sync", async (request, reply) => {
    const { nodes, edges, aiProviders, cloudConfig } = request.body;

    if (!nodes || !Array.isArray(nodes) || nodes.length === 0) {
      reply.code(400);
      return { error: "Workflow must have at least one node" };
    }

    try {
      const result = await executeWorkflow(nodes, edges, { aiProviders, cloudConfig });

      // Build previews map: nodeId -> base64 data URL
      const previews: Record<string, string> = {};
      for (const [imageId, buffer] of result.images) {
        const nodeId = result.nodeIdByImageId.get(imageId);
        if (nodeId && buffer) {
          // Detect mime type from buffer or default to png
          let mime = "image/png";
          if (buffer[0] === 0x3c)
            mime = "image/svg+xml"; // SVG starts with <
          else if (buffer[0] === 0xff) mime = "image/jpeg";

          const base64 = buffer.toString("base64");
          previews[nodeId] = `data:${mime};base64,${base64}`;
        }
      }

      // Build dataOutputs map: nodeId -> { dataType, content, parsed }
      const dataOutputs: Record<
        string,
        { dataType: "text" | "json"; content: string; parsed?: Record<string, unknown> }
      > = {};
      for (const [nodeId, output] of result.dataOutputs) {
        dataOutputs[nodeId] = {
          dataType: output.dataType,
          content: output.content,
          parsed: output.parsed,
        };
      }

      return {
        status: "completed",
        imageIds: result.imageIds,
        previews,
        dataOutputs,
      };
    } catch (error) {
      reply.code(500);
      return {
        status: "error",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  });

  // Get execution status
  fastify.get<{ Params: { id: string } }>("/executions/:id", async (request, reply) => {
    const result = executionResults.get(request.params.id);
    if (!result) {
      reply.code(404);
      return { error: "Execution not found" };
    }
    return result;
  });

  // Export workflow as YAML
  fastify.post<{ Body: ExecuteBody }>("/export/yaml", async (request) => {
    const { nodes, edges } = request.body;
    const { pipeline } = toPipeline(nodes, edges);
    return {
      yaml: yamlStringify(pipeline),
    };
  });
}
