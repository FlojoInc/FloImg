/**
 * Pre-flight workflow validation endpoint
 *
 * Validates workflows before execution using the SDK validator.
 * Returns validation issues with node IDs for UI highlighting.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import type {
  StudioNode,
  StudioEdge,
  StudioValidationIssue,
} from "@teamflojo/floimg-studio-shared";
import { nodesToPipeline, mapValidationToNodes } from "@teamflojo/floimg-studio-shared";
import { validatePipelineFull } from "@teamflojo/floimg";
import { getCachedCapabilities } from "../floimg/setup.js";

interface ValidateBody {
  nodes: StudioNode[];
  edges: StudioEdge[];
}

interface ValidateResponse {
  valid: boolean;
  issues: StudioValidationIssue[];
}

export async function validateRoutes(fastify: FastifyInstance) {
  /**
   * POST /api/validate
   * Validates a workflow before execution
   */
  fastify.post<{
    Body: ValidateBody;
    Reply: ValidateResponse;
  }>("/validate", async (request: FastifyRequest<{ Body: ValidateBody }>, reply: FastifyReply) => {
    const { nodes, edges } = request.body;

    if (!nodes || !Array.isArray(nodes)) {
      return reply.code(400).send({
        valid: false,
        issues: [
          {
            severity: "error",
            code: "INVALID_REQUEST",
            message: "Request body must contain a nodes array",
          },
        ],
      });
    }

    try {
      // Convert to Pipeline format
      const { pipeline, nodeToVar } = nodesToPipeline(nodes, edges || []);

      // Get capabilities from the client
      const capabilities = getCachedCapabilities();

      // Validate the pipeline
      const validation = validatePipelineFull(pipeline, capabilities);

      if (validation.valid) {
        return { valid: true, issues: [] };
      }

      // Map validation issues to node IDs for UI highlighting
      const studioIssues = mapValidationToNodes(validation.errors, nodeToVar, pipeline.steps);

      return {
        valid: false,
        issues: studioIssues,
      };
    } catch (error) {
      // Handle conversion errors (e.g., circular dependencies)
      const message = error instanceof Error ? error.message : "Validation failed";
      return {
        valid: false,
        issues: [
          {
            severity: "error" as const,
            code: "CONVERSION_ERROR",
            message,
            suggestedFix: "Check that all nodes are properly connected",
          },
        ],
      };
    }
  });
}
