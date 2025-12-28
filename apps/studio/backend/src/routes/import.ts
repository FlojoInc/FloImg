import type { FastifyInstance } from "fastify";
import { fromYaml, validateYaml, type ImportError } from "../floimg/importer.js";

interface ImportBody {
  yaml: string;
}

interface ValidateBody {
  yaml: string;
}

export async function importRoutes(fastify: FastifyInstance) {
  /**
   * Import YAML workflow
   * POST /api/import
   *
   * Converts a floimg YAML pipeline to Studio graph format (nodes + edges)
   */
  fastify.post<{ Body: ImportBody }>("/import", async (request, reply) => {
    const { yaml } = request.body;

    if (!yaml || typeof yaml !== "string") {
      reply.code(400);
      return { error: "Request must include 'yaml' string" };
    }

    if (yaml.trim().length === 0) {
      reply.code(400);
      return { error: "YAML content cannot be empty" };
    }

    try {
      const result = fromYaml(yaml);

      return {
        success: true,
        nodes: result.nodes,
        edges: result.edges,
        name: result.name || "Imported Workflow",
      };
    } catch (err) {
      const importError = err as ImportError;
      reply.code(400);
      return {
        error: importError.message,
        line: importError.line,
        column: importError.column,
      };
    }
  });

  /**
   * Validate YAML without importing
   * POST /api/import/validate
   *
   * Returns validation errors without converting to graph
   */
  fastify.post<{ Body: ValidateBody }>("/import/validate", async (request, reply) => {
    const { yaml } = request.body;

    if (!yaml || typeof yaml !== "string") {
      reply.code(400);
      return { valid: false, errors: [{ message: "Request must include 'yaml' string" }] };
    }

    const errors = validateYaml(yaml);

    return {
      valid: errors.length === 0,
      errors,
    };
  });
}
