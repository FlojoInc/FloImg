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
    ai: process.env.OPENAI_API_KEY ? { openai: { apiKey: process.env.OPENAI_API_KEY } } : undefined,
  });

  // Register generator plugins
  client.registerGenerator(qr());
  client.registerGenerator(mermaid());
  client.registerGenerator(quickchart());

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
