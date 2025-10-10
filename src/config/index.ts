import type { ImgfloConfig } from "../core/types.js";

/**
 * Helper to define imgflo configuration with TypeScript support
 */
export function defineConfig(config: ImgfloConfig): ImgfloConfig {
  return config;
}

/**
 * Load configuration from a file or object
 */
export async function loadConfig(
  configPath?: string
): Promise<ImgfloConfig | undefined> {
  if (!configPath) {
    // Try to find config in common locations
    const possiblePaths = [
      "./imgflo.config.ts",
      "./imgflo.config.js",
      "./imgflo.config.mjs",
    ];

    for (const path of possiblePaths) {
      try {
        const module = await import(path);
        return module.default || module;
      } catch {
        // Continue to next path
      }
    }

    return undefined;
  }

  // Load from specified path
  try {
    const module = await import(configPath);
    return module.default || module;
  } catch (error) {
    throw new Error(
      `Failed to load config from ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
