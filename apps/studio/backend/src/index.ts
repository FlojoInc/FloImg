import { fileURLToPath } from "url";
import { dirname, join } from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import websocket from "@fastify/websocket";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import { registerRoutes } from "./routes/index.js";
import { initializeClient } from "./floimg/setup.js";
import { initModeration } from "./moderation/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const fastify = Fastify({
  logger: true,
});

async function main() {
  // Initialize floimg client with plugins before anything else
  initializeClient();

  // Initialize content moderation (requires OPENAI_API_KEY)
  initModeration();

  // CORS configuration - restrict to known origins in production
  const corsOrigin = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",") : true; // Allow all in development

  await fastify.register(cors, {
    origin: corsOrigin,
    credentials: true,
  });

  await fastify.register(websocket);

  await fastify.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB max
    },
  });

  // Register routes
  await registerRoutes(fastify);

  // In production, serve the frontend static files
  if (process.env.NODE_ENV === "production") {
    const frontendPath = join(__dirname, "../../frontend/dist");
    await fastify.register(fastifyStatic, {
      root: frontendPath,
      prefix: "/",
    });

    // Fallback to index.html for SPA routing
    fastify.setNotFoundHandler((request, reply) => {
      if (request.url.startsWith("/api/")) {
        reply.status(404).send({ error: "Not found" });
      } else {
        reply.sendFile("index.html");
      }
    });
  }

  // Start server
  const port = parseInt(process.env.PORT || "5100", 10);
  const host = process.env.HOST || "0.0.0.0";

  try {
    await fastify.listen({ port, host });
    console.log(`Server listening on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

main();
