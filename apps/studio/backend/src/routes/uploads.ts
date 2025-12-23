import type { FastifyInstance } from "fastify";
import { mkdir, writeFile, readFile, readdir, unlink, stat } from "fs/promises";
import { join, extname } from "path";
import { nanoid } from "nanoid";
import {
  isModerationEnabled,
  isStrictModeEnabled,
  moderateImage,
  logModerationIncident,
} from "../moderation/index.js";

// Directory for uploaded images
const UPLOADS_DIR = "./data/uploads";

// Supported mime types
const SUPPORTED_MIMES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
  "image/avif": "avif",
  "image/gif": "gif",
};

// Extension to mime mapping
const EXT_TO_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".gif": "image/gif",
};

interface UploadMetadata {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
}

// In-memory metadata store (for PoC - would use SQLite in production)
const uploadMetadata = new Map<string, UploadMetadata>();

// Load existing uploads on startup
async function loadExistingUploads() {
  try {
    await mkdir(UPLOADS_DIR, { recursive: true });
    const files = await readdir(UPLOADS_DIR);

    for (const file of files) {
      if (file.endsWith(".json")) continue; // Skip metadata files if any

      const ext = extname(file).toLowerCase();
      const mime = EXT_TO_MIME[ext];
      if (!mime) continue;

      const id = file.replace(/\.[^.]+$/, ""); // Remove extension
      const filePath = join(UPLOADS_DIR, file);
      const stats = await stat(filePath);

      uploadMetadata.set(id, {
        id,
        filename: file,
        mime,
        size: stats.size,
        createdAt: stats.mtimeMs,
      });
    }

    console.log(`Loaded ${uploadMetadata.size} existing uploads`);
  } catch (error) {
    console.error("Error loading existing uploads:", error);
  }
}

// Initialize on module load
loadExistingUploads();

export async function uploadsRoutes(fastify: FastifyInstance) {
  // Ensure uploads directory exists
  await mkdir(UPLOADS_DIR, { recursive: true });

  // Upload a new image
  fastify.post("/", async (request, reply) => {
    const data = await request.file();

    if (!data) {
      reply.code(400);
      return { error: "No file uploaded" };
    }

    const mime = data.mimetype;
    if (!SUPPORTED_MIMES[mime]) {
      reply.code(400);
      return {
        error: `Unsupported file type: ${mime}. Supported: ${Object.keys(SUPPORTED_MIMES).join(", ")}`,
      };
    }

    const ext = SUPPORTED_MIMES[mime];
    const id = `upload_${nanoid(10)}`;
    const filename = `${id}.${ext}`;
    const filePath = join(UPLOADS_DIR, filename);

    // Read file buffer
    const buffer = await data.toBuffer();

    // Validate file size (max 10MB)
    if (buffer.length > 10 * 1024 * 1024) {
      reply.code(400);
      return { error: "File too large. Maximum size is 10MB." };
    }

    // SCAN BEFORE SAVE: Moderate image before writing to disk
    if (isModerationEnabled()) {
      try {
        const moderationResult = await moderateImage(buffer, mime);
        if (moderationResult.flagged) {
          await logModerationIncident("uploaded", moderationResult, {
            originalFilename: data.filename,
            mime,
            size: buffer.length,
          });
          reply.code(400);
          return {
            error: `Content policy violation: This image was flagged for ${moderationResult.flaggedCategories.join(", ")}. Upload rejected.`,
          };
        }
      } catch (moderationError) {
        console.error("Moderation check failed:", moderationError);
        // In strict mode, block content when moderation fails
        if (isStrictModeEnabled()) {
          await logModerationIncident(
            "error",
            {
              safe: false,
              flagged: true,
              categories: {} as never,
              categoryScores: {},
              flaggedCategories: ["moderation_service_error"],
            },
            {
              originalFilename: data.filename,
              mime,
              error: String(moderationError),
            }
          );
          reply.code(503);
          return {
            error: "Content moderation service unavailable. Upload blocked for safety.",
          };
        }
        // In permissive mode, allow through with warning
        console.warn("Moderation failed but strict mode is OFF - allowing upload");
      }
    }

    // Save file (only reached if moderation passed)
    await writeFile(filePath, buffer);

    const metadata: UploadMetadata = {
      id,
      filename: data.filename || filename,
      mime,
      size: buffer.length,
      createdAt: Date.now(),
    };

    uploadMetadata.set(id, metadata);

    return metadata;
  });

  // List all uploads
  fastify.get("/", async () => {
    const uploads = Array.from(uploadMetadata.values()).sort((a, b) => b.createdAt - a.createdAt);
    return uploads;
  });

  // Get upload metadata
  fastify.get<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const metadata = uploadMetadata.get(request.params.id);
    if (!metadata) {
      reply.code(404);
      return { error: "Upload not found" };
    }
    return metadata;
  });

  // Get upload blob
  fastify.get<{ Params: { id: string } }>("/:id/blob", async (request, reply) => {
    const metadata = uploadMetadata.get(request.params.id);
    if (!metadata) {
      reply.code(404);
      return { error: "Upload not found" };
    }

    const ext = SUPPORTED_MIMES[metadata.mime];
    const filePath = join(UPLOADS_DIR, `${metadata.id}.${ext}`);

    try {
      const buffer = await readFile(filePath);
      reply.type(metadata.mime);
      return buffer;
    } catch {
      reply.code(404);
      return { error: "Upload file not found" };
    }
  });

  // Get upload thumbnail (base64 for preview)
  fastify.get<{ Params: { id: string } }>("/:id/thumbnail", async (request, reply) => {
    const metadata = uploadMetadata.get(request.params.id);
    if (!metadata) {
      reply.code(404);
      return { error: "Upload not found" };
    }

    const ext = SUPPORTED_MIMES[metadata.mime];
    const filePath = join(UPLOADS_DIR, `${metadata.id}.${ext}`);

    try {
      const buffer = await readFile(filePath);
      const base64 = buffer.toString("base64");
      return {
        dataUrl: `data:${metadata.mime};base64,${base64}`,
      };
    } catch {
      reply.code(404);
      return { error: "Upload file not found" };
    }
  });

  // Delete upload
  fastify.delete<{ Params: { id: string } }>("/:id", async (request, reply) => {
    const metadata = uploadMetadata.get(request.params.id);
    if (!metadata) {
      reply.code(404);
      return { error: "Upload not found" };
    }

    const ext = SUPPORTED_MIMES[metadata.mime];
    const filePath = join(UPLOADS_DIR, `${metadata.id}.${ext}`);

    try {
      await unlink(filePath);
    } catch {
      // File may already be deleted
    }

    uploadMetadata.delete(request.params.id);

    return { success: true };
  });
}

// Export function to load upload data (for executor)
export async function loadUpload(id: string): Promise<{ bytes: Buffer; mime: string } | null> {
  const metadata = uploadMetadata.get(id);
  if (!metadata) return null;

  const ext = SUPPORTED_MIMES[metadata.mime];
  const filePath = join(UPLOADS_DIR, `${metadata.id}.${ext}`);

  try {
    const bytes = await readFile(filePath);
    return { bytes, mime: metadata.mime };
  } catch {
    return null;
  }
}
