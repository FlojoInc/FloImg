import type { FastifyInstance } from "fastify";
import { readdir, readFile, stat } from "fs/promises";
import { join } from "path";

const OUTPUT_DIR = "./data/images";

export async function imagesRoutes(fastify: FastifyInstance) {
  // List all images
  fastify.get("/", async (_request, _reply) => {
    try {
      const files = await readdir(OUTPUT_DIR);
      const images = await Promise.all(
        files
          // Filter to image files only (exclude .meta.json files)
          .filter((f) => /\.(png|jpg|jpeg|webp|svg|avif)$/i.test(f))
          .map(async (filename) => {
            const filePath = join(OUTPUT_DIR, filename);
            const stats = await stat(filePath);
            const id = filename.replace(/\.[^.]+$/, "");
            const ext = filename.split(".").pop() || "png";
            const mime =
              ext === "svg"
                ? "image/svg+xml"
                : ext === "jpg" || ext === "jpeg"
                  ? "image/jpeg"
                  : `image/${ext}`;

            return {
              id,
              filename,
              mime,
              size: stats.size,
              createdAt: stats.birthtime.getTime(),
            };
          })
      );

      // Sort by creation time descending
      images.sort((a, b) => b.createdAt - a.createdAt);

      return images;
    } catch (_error) {
      // Directory might not exist yet
      return [];
    }
  });

  // Get image blob
  fastify.get<{ Params: { id: string } }>("/:id/blob", async (request, reply) => {
    const { id } = request.params;

    try {
      const files = await readdir(OUTPUT_DIR);
      // Exclude .meta.json files - only match actual image files
      const file = files.find((f) => f.startsWith(id) && !f.endsWith(".meta.json"));

      if (!file) {
        reply.code(404);
        return { error: "Image not found" };
      }

      const filePath = join(OUTPUT_DIR, file);
      const buffer = await readFile(filePath);
      const ext = file.split(".").pop() || "png";
      const mime =
        ext === "svg"
          ? "image/svg+xml"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : `image/${ext}`;

      reply.header("Content-Type", mime);
      reply.header("Cache-Control", "public, max-age=31536000");
      return buffer;
    } catch (_error) {
      reply.code(404);
      return { error: "Image not found" };
    }
  });

  // Get image metadata (basic)
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const { id } = request.params;

    try {
      const files = await readdir(OUTPUT_DIR);
      const file = files.find((f) => f.startsWith(id) && !f.endsWith(".meta.json"));

      if (!file) {
        reply.code(404);
        return { error: "Image not found" };
      }

      const filePath = join(OUTPUT_DIR, file);
      const stats = await stat(filePath);
      const ext = file.split(".").pop() || "png";
      const mime =
        ext === "svg"
          ? "image/svg+xml"
          : ext === "jpg" || ext === "jpeg"
            ? "image/jpeg"
            : `image/${ext}`;

      return {
        id,
        filename: file,
        mime,
        size: stats.size,
        createdAt: stats.birthtime.getTime(),
      };
    } catch (_error) {
      reply.code(404);
      return { error: "Image not found" };
    }
  });

  // Get full image metadata with workflow info (from sidecar file)
  fastify.get<{ Params: { id: string } }>("/:id/workflow", async (request, reply) => {
    const { id } = request.params;

    try {
      const metadataPath = join(OUTPUT_DIR, `${id}.meta.json`);
      const metadataJson = await readFile(metadataPath, "utf-8");
      const metadata = JSON.parse(metadataJson);
      return metadata;
    } catch (_error) {
      // Sidecar file may not exist for older images
      reply.code(404);
      return { error: "Workflow metadata not found for this image" };
    }
  });
}
