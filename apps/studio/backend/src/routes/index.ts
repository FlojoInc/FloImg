import type { FastifyInstance } from "fastify";
import { nodesRoutes } from "./nodes.js";
import { executeRoutes } from "./execute.js";
import { imagesRoutes } from "./images.js";
import { uploadsRoutes } from "./uploads.js";

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  // Node registry routes
  await fastify.register(nodesRoutes, { prefix: "/api/nodes" });

  // Execution routes
  await fastify.register(executeRoutes, { prefix: "/api" });

  // Image routes
  await fastify.register(imagesRoutes, { prefix: "/api/images" });

  // Upload routes
  await fastify.register(uploadsRoutes, { prefix: "/api/uploads" });
}
