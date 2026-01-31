/**
 * floimg client setup - initializes and configures the shared floimg client
 *
 * This module:
 * - Creates a singleton floimg client
 * - Registers all available generator plugins
 * - Exports getCapabilities() for auto-discovery
 * - Collects usage events from AI providers for cost tracking
 */

import {
  createClient,
  type ClientCapabilities,
  type UsageEvent,
  type FloimgConfig,
} from "@teamflojo/floimg";
import qr from "@teamflojo/floimg-qr";
import mermaid from "@teamflojo/floimg-mermaid";
import quickchart from "@teamflojo/floimg-quickchart";
import openai, { openaiTransform } from "@teamflojo/floimg-openai";
import stability, { stabilityTransform } from "@teamflojo/floimg-stability";
import googleImagen, {
  geminiTransform,
  geminiGenerate,
  geminiText,
  geminiVision,
} from "@teamflojo/floimg-google";
import { grokText, grokVision } from "@teamflojo/floimg-xai";
import { replicateTransform } from "@teamflojo/floimg-replicate";
import { vectorizeTransform } from "@teamflojo/floimg-vectorize";

type FloimgClient = ReturnType<typeof createClient>;

// ============================================================================
// Save Provider Configuration
// ============================================================================

/**
 * Build save provider configuration from environment variables.
 *
 * Environment variables:
 * - FLOIMG_SAVE_FS_BASE_DIR: Base directory for filesystem saves (default: ./output)
 * - FLOIMG_SAVE_S3_BUCKET: S3 bucket name (enables S3 provider)
 * - FLOIMG_SAVE_S3_REGION: S3 region (required with bucket)
 * - FLOIMG_SAVE_S3_ENDPOINT: S3 endpoint URL (for MinIO, R2, Backblaze, etc.)
 * - FLOIMG_SAVE_S3_ACCESS_KEY_ID: S3 access key
 * - FLOIMG_SAVE_S3_SECRET_ACCESS_KEY: S3 secret key
 *
 * The SDK automatically registers FsSaveProvider by default.
 * S3SaveProvider is registered when bucket and region are provided.
 */
function buildSaveConfig(): FloimgConfig["save"] {
  const save: FloimgConfig["save"] = {};

  // Filesystem save config (always available)
  if (process.env.FLOIMG_SAVE_FS_BASE_DIR) {
    save.fs = {
      baseDir: process.env.FLOIMG_SAVE_FS_BASE_DIR,
    };
  }

  // S3 save config (enabled when bucket + region are set)
  const s3Bucket = process.env.FLOIMG_SAVE_S3_BUCKET;
  const s3Region = process.env.FLOIMG_SAVE_S3_REGION;
  if (s3Bucket && s3Region) {
    save.s3 = {
      bucket: s3Bucket,
      region: s3Region,
      endpoint: process.env.FLOIMG_SAVE_S3_ENDPOINT,
    };

    // Add credentials if provided
    const accessKeyId = process.env.FLOIMG_SAVE_S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.FLOIMG_SAVE_S3_SECRET_ACCESS_KEY;
    if (accessKeyId && secretAccessKey) {
      save.s3.credentials = { accessKeyId, secretAccessKey };
    }
  }

  return save;
}

// ============================================================================
// Usage Event Collection
// ============================================================================

/**
 * Collected usage events from AI providers during workflow execution.
 * Call getCollectedUsageEvents() after execution to retrieve events,
 * then clearCollectedUsageEvents() before the next execution.
 *
 * CONCURRENCY NOTE: This module-level array assumes sequential workflow execution.
 * Node.js is single-threaded, and the executor clears events before each execution
 * and collects them after, so concurrent requests don't mix their events.
 * If we ever need true parallel execution (e.g., worker threads), this would need
 * to be refactored to use request-scoped storage (e.g., AsyncLocalStorage).
 */
let collectedUsageEvents: UsageEvent[] = [];

/**
 * Get all usage events collected since last clear
 */
export function getCollectedUsageEvents(): UsageEvent[] {
  return [...collectedUsageEvents];
}

/**
 * Clear collected usage events (call before each execution)
 */
export function clearCollectedUsageEvents(): void {
  collectedUsageEvents = [];
}

/**
 * Usage hooks that collect events into the module-level array.
 * Adds timestamp if not already present.
 */
const usageHooks = {
  onUsage: async (event: UsageEvent) => {
    collectedUsageEvents.push({
      ...event,
      timestamp: event.timestamp ?? Date.now(),
    });
  },
};

let client: FloimgClient | null = null;
let capabilities: ClientCapabilities | null = null;

/**
 * Initialize the floimg client with all plugins
 * Call this once at application startup
 */
export function initializeClient(config: { verbose?: boolean } = {}): FloimgClient {
  if (client) {
    return client;
  }

  // Build save configuration from environment variables
  const saveConfig = buildSaveConfig();

  client = createClient({
    verbose: config.verbose ?? process.env.NODE_ENV !== "production",
    save: saveConfig,
  });

  // Log save provider configuration
  const saveProviders: string[] = ["fs"]; // Always available
  if (saveConfig?.s3?.bucket) {
    saveProviders.push("s3");
    console.log(
      `[floimg] S3 save provider configured: bucket=${saveConfig.s3.bucket}, region=${saveConfig.s3.region}` +
        (saveConfig.s3.endpoint ? `, endpoint=${saveConfig.s3.endpoint}` : "")
    );
  }

  // Register generator plugins
  client.registerGenerator(qr());
  client.registerGenerator(mermaid());
  client.registerGenerator(quickchart());

  // Register deterministic transform providers (no API key required)
  client.registerTransformProvider(vectorizeTransform());

  // Register AI generators and transforms when API keys are available
  // All AI providers get usage hooks for cost tracking
  if (process.env.OPENAI_API_KEY) {
    client.registerGenerator(openai({ apiKey: process.env.OPENAI_API_KEY, hooks: usageHooks }));
    client.registerTransformProvider(
      openaiTransform({ apiKey: process.env.OPENAI_API_KEY, hooks: usageHooks })
    );
  }
  if (process.env.STABILITY_API_KEY) {
    client.registerGenerator(
      stability({ apiKey: process.env.STABILITY_API_KEY, hooks: usageHooks })
    );
    client.registerTransformProvider(
      stabilityTransform({ apiKey: process.env.STABILITY_API_KEY, hooks: usageHooks })
    );
  }
  const googleApiKey = process.env.GOOGLE_AI_API_KEY;
  if (googleApiKey) {
    client.registerGenerator(googleImagen({ apiKey: googleApiKey, hooks: usageHooks }));
    client.registerGenerator(geminiGenerate({ apiKey: googleApiKey, hooks: usageHooks }));
    client.registerTransformProvider(geminiTransform({ apiKey: googleApiKey, hooks: usageHooks }));
  } else {
    // Register Gemini providers without API key - users provide their own per-request
    // This enables the AI nodes in the Studio even without server-side API key
    client.registerGenerator(geminiGenerate({ hooks: usageHooks }));
    client.registerTransformProvider(geminiTransform({ hooks: usageHooks }));
  }
  if (process.env.REPLICATE_API_TOKEN) {
    client.registerTransformProvider(
      replicateTransform({ apiToken: process.env.REPLICATE_API_TOKEN, hooks: usageHooks })
    );
  }

  // Register text and vision providers
  // Use server keys if available, otherwise users can provide their own per-request
  client.registerTextProvider(
    geminiText(googleApiKey ? { apiKey: googleApiKey, hooks: usageHooks } : { hooks: usageHooks })
  );
  client.registerTextProvider(grokText({ hooks: usageHooks }));
  client.registerVisionProvider(
    geminiVision(googleApiKey ? { apiKey: googleApiKey, hooks: usageHooks } : { hooks: usageHooks })
  );
  client.registerVisionProvider(grokVision({ hooks: usageHooks }));

  // Cache capabilities
  capabilities = client.getCapabilities();

  console.log(
    `[floimg] Client initialized with ${capabilities.generators.length} generators, ` +
      `${capabilities.transforms.length} transforms, ` +
      `${capabilities.textProviders.length} text providers, ` +
      `${capabilities.visionProviders.length} vision providers, ` +
      `${saveProviders.length} save providers (${saveProviders.join(", ")})`
  );

  return client;
}

/**
 * Get the shared floimg client instance
 * Throws if client hasn't been initialized
 */
export function getClient(): FloimgClient {
  if (!client) {
    throw new Error("floimg client not initialized. Call initializeClient() at startup.");
  }
  return client;
}

/**
 * Get cached capabilities from the floimg client
 * Throws if client hasn't been initialized
 */
export function getCachedCapabilities(): ClientCapabilities {
  if (!capabilities) {
    throw new Error("floimg client not initialized. Call initializeClient() at startup.");
  }
  return capabilities;
}
