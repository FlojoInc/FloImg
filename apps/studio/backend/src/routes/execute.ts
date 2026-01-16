import type { FastifyInstance } from "fastify";
import type {
  ExecutionSSEEvent,
  ErrorCategory,
  Pipeline,
  PipelineStep,
} from "@teamflojo/floimg-studio-shared";
import { executePipeline } from "../floimg/executor.js";
import { loadUpload } from "./uploads.js";
import { stringify as yamlStringify } from "yaml";
import { FloimgError, type ImageBlob } from "@teamflojo/floimg";

// Helper to extract structured error info from any error
function extractErrorInfo(error: unknown): {
  message: string;
  code?: string;
  category?: ErrorCategory;
  retryable?: boolean;
} {
  if (error instanceof FloimgError) {
    return {
      message: error.message,
      code: error.code,
      category: error.category,
      retryable: error.retryable,
    };
  }
  return {
    message: error instanceof Error ? error.message : String(error),
  };
}

// Helper to send SSE event
function sendSSE(raw: { write: (data: string) => boolean }, event: ExecutionSSEEvent): void {
  raw.write(`data: ${JSON.stringify(event)}\n\n`);
}

// AI provider configuration
interface AIProviderConfig {
  openai?: { apiKey: string };
  anthropic?: { apiKey: string };
  gemini?: { apiKey: string };
  grok?: { apiKey: string };
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

/**
 * Execute request body - Pipeline format only
 *
 * This is the canonical format used across SDK, CLI, YAML, and API.
 * The visual editor converts nodes/edges to this format before sending.
 */
interface ExecuteBody {
  /** Pipeline steps to execute */
  steps: PipelineStep[];
  /** Optional pipeline name */
  name?: string;
  /**
   * Maps variable names to upload IDs for input resolution.
   * The frontend converts input node uploadIds to this format.
   * Example: { "v0": "upload-abc123" }
   */
  inputUploads?: Record<string, string>;
  /** AI provider configurations (API keys, base URLs) */
  aiProviders?: AIProviderConfig;
  /** Cloud config for FloImg Cloud save functionality */
  cloudConfig?: CloudConfig;
}

/**
 * Map provider names to AI provider config keys
 */
const PROVIDER_TO_AI_CONFIG: Record<string, keyof AIProviderConfig> = {
  "gemini-generate": "gemini",
  "openai-images": "openai",
  "stability-ai": "openai",
  "gemini-transform": "gemini",
  "openai-transform": "openai",
  "gemini-text": "gemini",
  "grok-text": "grok",
  "openai-text": "openai",
  "gemini-vision": "gemini",
  "grok-vision": "grok",
  "openai-vision": "openai",
};

/**
 * Inject API keys into pipeline steps based on provider configuration
 */
function injectApiKeys(steps: PipelineStep[], aiProviders?: AIProviderConfig): PipelineStep[] {
  if (!aiProviders) return steps;

  return steps.map((step) => {
    // Only inject API keys for steps that use providers
    if (step.kind === "generate") {
      const configKey = PROVIDER_TO_AI_CONFIG[step.generator];
      if (!configKey) return step;

      const config = aiProviders[configKey];
      if (!config || !("apiKey" in config)) return step;

      // Only inject if not already specified
      if (step.params?.apiKey) return step;

      return {
        ...step,
        params: { ...step.params, apiKey: config.apiKey },
      };
    }

    if (step.kind === "transform" || step.kind === "vision" || step.kind === "text") {
      if (!step.provider) return step;

      const configKey = PROVIDER_TO_AI_CONFIG[step.provider];
      if (!configKey) return step;

      const config = aiProviders[configKey];
      if (!config || !("apiKey" in config)) return step;

      // Only inject if not already specified
      if (step.params?.apiKey) return step;

      return {
        ...step,
        params: { ...step.params, apiKey: config.apiKey },
      };
    }

    return step;
  });
}

/**
 * Resolve input uploads to ImageBlobs for pipeline execution
 */
async function resolveInputUploads(
  inputUploads: Record<string, string>
): Promise<Record<string, ImageBlob>> {
  const initialVariables: Record<string, ImageBlob> = {};

  for (const [varName, uploadId] of Object.entries(inputUploads)) {
    const upload = await loadUpload(uploadId);
    if (!upload) {
      throw new Error(`Upload not found: ${uploadId}`);
    }
    initialVariables[varName] = {
      bytes: upload.bytes,
      mime: upload.mime as ImageBlob["mime"],
    };
  }

  return initialVariables;
}

/**
 * Get step identifiers (variable names) from pipeline
 */
function getStepIds(steps: PipelineStep[]): string[] {
  return steps
    .map((step) => {
      if (step.kind === "fan-out") {
        return step.out; // Array of branch var names
      }
      if (step.kind === "save") {
        return undefined; // Save steps don't have output
      }
      return step.out;
    })
    .flat()
    .filter((id): id is string => id !== undefined);
}

export async function executeRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/execute/sync - Execute pipeline synchronously
   *
   * Accepts the canonical Pipeline format used across all FloImg interfaces.
   * Returns when execution is complete with all results.
   */
  fastify.post<{ Body: ExecuteBody }>("/execute/sync", async (request, reply) => {
    const { steps, name, inputUploads, aiProviders, cloudConfig } = request.body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      reply.code(400);
      return { error: "Pipeline must have at least one step" };
    }

    try {
      // Resolve input uploads to ImageBlobs
      const initialVariables = inputUploads ? await resolveInputUploads(inputUploads) : {};

      // Inject API keys into steps
      const stepsWithKeys = injectApiKeys(steps, aiProviders);

      // Build pipeline
      const pipeline: Pipeline = {
        name: name || "API Workflow",
        steps: stepsWithKeys,
      };

      // Execute
      const result = await executePipeline({ ...pipeline, initialVariables }, { cloudConfig });

      // Build previews map: stepId -> base64 data URL
      const previews: Record<string, string> = {};
      for (const [imageId, buffer] of result.images) {
        let mime = "image/png";
        if (buffer[0] === 0x3c) mime = "image/svg+xml";
        else if (buffer[0] === 0xff) mime = "image/jpeg";
        const base64 = buffer.toString("base64");
        previews[imageId] = `data:${mime};base64,${base64}`;
      }

      // Build dataOutputs (keyed by variable name)
      const dataOutputs: Record<
        string,
        { dataType: "text" | "json"; content: string; parsed?: unknown }
      > = {};
      for (const [varName, output] of result.dataOutputs) {
        dataOutputs[varName] = output;
      }

      const imageUrls = result.imageIds.map((id) => `/api/images/${id}/blob`);

      return {
        status: "completed",
        imageIds: result.imageIds,
        imageUrls,
        previews,
        dataOutputs,
        usageEvents: result.usageEvents,
      };
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      reply.code(500);
      return {
        status: "error",
        error: errorInfo.message,
        errorCode: errorInfo.code,
        errorCategory: errorInfo.category,
        retryable: errorInfo.retryable,
      };
    }
  });

  /**
   * POST /api/execute/stream - Execute pipeline with SSE streaming
   *
   * Accepts the canonical Pipeline format. Streams progress events
   * as the pipeline executes.
   */
  fastify.post<{ Body: ExecuteBody }>("/execute/stream", async (request, reply) => {
    const { steps, name, inputUploads, aiProviders, cloudConfig } = request.body;

    if (!steps || !Array.isArray(steps) || steps.length === 0) {
      reply.code(400);
      return { error: "Pipeline must have at least one step" };
    }

    // Set SSE headers
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    try {
      // Resolve input uploads
      const initialVariables = inputUploads ? await resolveInputUploads(inputUploads) : {};

      // Inject API keys
      const stepsWithKeys = injectApiKeys(steps, aiProviders);

      // Build pipeline
      const pipeline: Pipeline = {
        name: name || "API Workflow",
        steps: stepsWithKeys,
      };

      // Get step identifiers
      const ids = getStepIds(stepsWithKeys);

      // Send started event
      sendSSE(reply.raw, {
        type: "execution.started",
        data: {
          totalSteps: steps.length,
          ids,
        },
      });

      // Execute
      const result = await executePipeline({ ...pipeline, initialVariables }, { cloudConfig });

      const imageUrls = result.imageIds.map((id) => `/api/images/${id}/blob`);

      // Send completed event
      sendSSE(reply.raw, {
        type: "execution.completed",
        data: { imageIds: result.imageIds, imageUrls },
      });
    } catch (error) {
      const errorInfo = extractErrorInfo(error);
      sendSSE(reply.raw, {
        type: "execution.error",
        data: {
          error: errorInfo.message,
          errorCode: errorInfo.code,
          errorCategory: errorInfo.category,
          retryable: errorInfo.retryable,
        },
      });
    } finally {
      reply.raw.end();
    }
  });

  /**
   * POST /api/export/yaml - Export pipeline as YAML
   *
   * Accepts a Pipeline and returns YAML representation.
   */
  fastify.post<{ Body: { steps: PipelineStep[]; name?: string } }>(
    "/export/yaml",
    async (request) => {
      const { steps, name } = request.body;
      const pipeline = { name: name || "Workflow", steps };
      return {
        yaml: yamlStringify(pipeline),
      };
    }
  );
}
