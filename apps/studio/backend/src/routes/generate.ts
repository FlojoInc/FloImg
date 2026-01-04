/**
 * Workflow generation routes - AI-powered workflow creation
 */

import type { FastifyInstance } from "fastify";
import type {
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
} from "@teamflojo/floimg-studio-shared";
import { generateWorkflow } from "../ai/workflow-generator.js";

export async function generateRoutes(fastify: FastifyInstance) {
  /**
   * Generate a workflow from natural language
   * POST /api/generate/workflow
   */
  fastify.post<{ Body: GenerateWorkflowRequest }>(
    "/workflow",
    async (request, reply): Promise<GenerateWorkflowResponse> => {
      const { prompt, history } = request.body;

      if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
        reply.code(400);
        return {
          success: false,
          message: "Prompt is required",
          error: "Missing or empty prompt",
        };
      }

      const result = await generateWorkflow(prompt.trim(), history);

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
   * Check if workflow generation is available
   * GET /api/generate/status
   */
  fastify.get("/status", async () => {
    const hasApiKey = !!process.env.GOOGLE_AI_API_KEY;

    if (!hasApiKey) {
      fastify.log.warn("AI workflow generation unavailable: GOOGLE_AI_API_KEY not configured");
    }

    return {
      available: hasApiKey,
      model: "gemini-3-pro-preview",
      message: hasApiKey
        ? "Workflow generation is available"
        : "Set GOOGLE_AI_API_KEY environment variable to enable AI workflow generation",
      reason: hasApiKey ? undefined : ("not_configured" as const),
      isCloudDeployment: false,
    };
  });
}
