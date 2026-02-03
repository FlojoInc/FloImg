/**
 * Workflow generation routes - AI-powered workflow creation
 */

import type { FastifyInstance } from "fastify";
import type {
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
  GenerationSSEEvent,
} from "@teamflojo/floimg-studio-shared";
import { generateWorkflow, AVAILABLE_MODELS } from "../ai/workflow-generator.js";

// Helper to send SSE event
function sendSSE(raw: { write: (data: string) => boolean }, event: GenerationSSEEvent): void {
  raw.write(`data: ${JSON.stringify(event)}\n\n`);
}

export async function generateRoutes(fastify: FastifyInstance) {
  /**
   * Generate a workflow from natural language
   * POST /api/generate/workflow
   */
  fastify.post<{ Body: GenerateWorkflowRequest }>(
    "/workflow",
    async (request, reply): Promise<GenerateWorkflowResponse> => {
      const { prompt, history, model } = request.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        reply.code(400);
        return {
          success: false,
          message: "Prompt is required",
          error: "Missing or empty prompt",
        };
      }

      const result = await generateWorkflow(prompt.trim(), history, model);

      if (!result.success) {
        // Return 200 with error details (not 500, since it's a valid response)
        return {
          success: false,
          message: result.message,
          error: result.error,
        };
      }

      return {
        success: true,
        workflow: result.workflow,
        message: result.message,
      };
    }
  );

  /**
   * Generate a workflow with SSE streaming for progress updates
   * POST /api/generate/workflow/stream
   */
  fastify.post<{ Body: GenerateWorkflowRequest }>("/workflow/stream", async (request, reply) => {
    const { prompt, history, model } = request.body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      reply.code(400);
      return { error: "Prompt is required" };
    }

    // Determine which model to use
    const defaultModel = AVAILABLE_MODELS.find((m) => m.isDefault)?.id || "gemini-3-pro-preview";
    const selectedModel =
      model && AVAILABLE_MODELS.some((m) => m.id === model) ? model : defaultModel;

    // Set SSE headers
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    // Send started event
    sendSSE(reply.raw, {
      type: "generation.started",
      data: {
        model: selectedModel,
      },
    });

    // Phase 1: Analyzing
    sendSSE(reply.raw, {
      type: "generation.progress",
      data: {
        phase: "analyzing",
        message: "Analyzing your request...",
      },
    });

    // Small delay to show the phase
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Phase 2: Selecting nodes
    sendSSE(reply.raw, {
      type: "generation.progress",
      data: {
        phase: "selecting_nodes",
        message: "Selecting appropriate nodes...",
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 200));

    // Phase 3: Generating (the actual Gemini call happens here)
    sendSSE(reply.raw, {
      type: "generation.progress",
      data: {
        phase: "generating",
        message: "Generating workflow...",
      },
    });

    try {
      const result = await generateWorkflow(prompt.trim(), history, selectedModel);

      if (!result.success || !result.workflow) {
        sendSSE(reply.raw, {
          type: "generation.error",
          data: {
            error: result.error || result.message || "Failed to generate workflow",
          },
        });
      } else {
        // Phase 4: Validating
        sendSSE(reply.raw, {
          type: "generation.progress",
          data: {
            phase: "validating",
            message: "Validating workflow...",
          },
        });

        await new Promise((resolve) => setTimeout(resolve, 150));

        // Send completed event with the workflow
        sendSSE(reply.raw, {
          type: "generation.completed",
          data: result.workflow,
        });
      }
    } catch (error) {
      sendSSE(reply.raw, {
        type: "generation.error",
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    } finally {
      reply.raw.end();
    }
  });

  /**
   * Check if workflow generation is available
   * GET /api/generate/status
   */
  fastify.get("/status", async () => {
    const hasApiKey = !!process.env.GOOGLE_AI_API_KEY;
    const defaultModel = AVAILABLE_MODELS.find((m) => m.isDefault)?.id || "gemini-3-pro-preview";

    if (!hasApiKey) {
      fastify.log.warn("AI workflow generation unavailable: GOOGLE_AI_API_KEY not configured");
    }

    return {
      available: hasApiKey,
      model: defaultModel,
      availableModels: hasApiKey
        ? AVAILABLE_MODELS.map((m) => ({
            id: m.id,
            name: m.name,
            description: m.description,
            isDefault: m.isDefault,
          }))
        : undefined,
      message: hasApiKey
        ? "Workflow generation is available"
        : "Set GOOGLE_AI_API_KEY environment variable to enable AI workflow generation",
      reason: hasApiKey ? undefined : ("not_configured" as const),
      isCloudDeployment: false,
    };
  });
}
