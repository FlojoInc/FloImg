import type { FastifyInstance } from "fastify";
import { nodesRoutes } from "./nodes.js";
import { executeRoutes } from "./execute.js";
import { imagesRoutes } from "./images.js";
import { uploadsRoutes } from "./uploads.js";
import { importRoutes } from "./import.js";
import { generateRoutes } from "./generate.js";

export async function registerRoutes(fastify: FastifyInstance) {
  // Health check
  fastify.get("/api/health", async () => {
    return { status: "ok" };
  });

  // Version endpoint for deployment visibility
  // Returns build metadata to verify what code is running
  fastify.get("/api/version", async () => {
    return {
      service: "floimg-studio-oss",
      version: process.env.npm_package_version || process.env.APP_VERSION || "unknown",
      commit: process.env.GIT_COMMIT || "unknown",
      buildTime: process.env.BUILD_TIME || "unknown",
      nodeEnv: process.env.NODE_ENV || "development",
    };
  });

  // Node registry routes
  await fastify.register(nodesRoutes, { prefix: "/api/nodes" });

  // Execution routes
  await fastify.register(executeRoutes, { prefix: "/api" });

  // Image routes
  await fastify.register(imagesRoutes, { prefix: "/api/images" });

  // Upload routes
  await fastify.register(uploadsRoutes, { prefix: "/api/uploads" });

  // Import routes
  await fastify.register(importRoutes, { prefix: "/api" });

  // AI workflow generation routes
  await fastify.register(generateRoutes, { prefix: "/api/generate" });
}
