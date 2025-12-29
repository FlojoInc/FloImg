/**
 * floimg client setup - initializes and configures the shared floimg client
 *
 * This module:
 * - Creates a singleton floimg client
 * - Registers all available generator plugins
 * - Exports getCapabilities() for auto-discovery
 */

import { createClient, type ClientCapabilities } from "@teamflojo/floimg";
import qr from "@teamflojo/floimg-qr";
import mermaid from "@teamflojo/floimg-mermaid";
import quickchart from "@teamflojo/floimg-quickchart";
import openai, { openaiTransform } from "@teamflojo/floimg-openai";
import stability, { stabilityTransform } from "@teamflojo/floimg-stability";
import googleImagen, { geminiTransform } from "@teamflojo/floimg-google";
import { replicateTransform } from "@teamflojo/floimg-replicate";

type FloimgClient = ReturnType<typeof createClient>;

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

  client = createClient({
    verbose: config.verbose ?? process.env.NODE_ENV !== "production",
  });

  // Register generator plugins
  client.registerGenerator(qr());
  client.registerGenerator(mermaid());
  client.registerGenerator(quickchart());

  // Register AI generators and transforms when API keys are available
  if (process.env.OPENAI_API_KEY) {
    client.registerGenerator(openai({ apiKey: process.env.OPENAI_API_KEY }));
    client.registerTransformProvider(openaiTransform({ apiKey: process.env.OPENAI_API_KEY }));
  }
  if (process.env.STABILITY_API_KEY) {
    client.registerGenerator(stability({ apiKey: process.env.STABILITY_API_KEY }));
    client.registerTransformProvider(stabilityTransform({ apiKey: process.env.STABILITY_API_KEY }));
  }
  if (process.env.GOOGLE_AI_API_KEY) {
    client.registerGenerator(googleImagen({ apiKey: process.env.GOOGLE_AI_API_KEY }));
    client.registerTransformProvider(geminiTransform({ apiKey: process.env.GOOGLE_AI_API_KEY }));
  }
  // Also register geminiTransform without API key - users can provide their own per-request
  // This enables the AI Edit node in the Studio even without server-side API key
  if (!process.env.GOOGLE_AI_API_KEY) {
    client.registerTransformProvider(geminiTransform());
  }
  if (process.env.REPLICATE_API_TOKEN) {
    client.registerTransformProvider(
      replicateTransform({ apiToken: process.env.REPLICATE_API_TOKEN })
    );
  }

  // Cache capabilities
  capabilities = client.getCapabilities();

  console.log(
    `[floimg] Client initialized with ${capabilities.generators.length} generators and ${capabilities.transforms.length} transforms`
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
