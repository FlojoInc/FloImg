import type { FastifyInstance } from "fastify";
import {
  getGenerators,
  getTransforms,
  getInputNodes,
  getGeneratorSchema,
  getTransformSchema,
} from "../floimg/registry.js";

export async function nodesRoutes(fastify: FastifyInstance) {
  // List all generators
  fastify.get("/generators", async () => {
    return getGenerators();
  });

  // List all transforms
  fastify.get("/transforms", async () => {
    return getTransforms();
  });

  // List all input nodes
  fastify.get("/inputs", async () => {
    return getInputNodes();
  });

  // Get generator schema
  fastify.get<{ Params: { name: string } }>("/generators/:name/schema", async (request, reply) => {
    const schema = getGeneratorSchema(request.params.name);
    if (!schema) {
      reply.code(404);
      return { error: "Generator not found" };
    }
    return schema;
  });

  // Get transform schema
  fastify.get<{ Params: { op: string } }>("/transforms/:op/schema", async (request, reply) => {
    const schema = getTransformSchema(request.params.op);
    if (!schema) {
      reply.code(404);
      return { error: "Transform not found" };
    }
    return schema;
  });
}
