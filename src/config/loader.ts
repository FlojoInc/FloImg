import { readFile, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import type { ImgfloConfig } from "../core/types.js";

/**
 * Configuration search paths (in order of priority)
 */
const CONFIG_SEARCH_PATHS = [
  // 1. Current directory configs
  "./imgflo.config.ts",
  "./imgflo.config.js",
  "./imgflo.config.mjs",
  "./.imgflorc.json",
  "./.imgflorc",

  // 2. Global config in home directory
  join(homedir(), ".imgflo", "config.json"),
  join(homedir(), ".imgflorc.json"),
];

/**
 * Load configuration from multiple sources with priority:
 * 1. Explicit config file path (if provided)
 * 2. Config file in current directory
 * 3. Global config file in ~/.imgflo/
 * 4. Environment variables
 */
export async function loadConfig(
  explicitPath?: string
): Promise<ImgfloConfig> {
  const config: ImgfloConfig = {};

  // Step 1: Try explicit path if provided
  if (explicitPath) {
    try {
      const loadedConfig = await loadConfigFile(explicitPath);
      Object.assign(config, loadedConfig);
    } catch (error) {
      throw new Error(
        `Failed to load config from ${explicitPath}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  } else {
    // Step 2: Search for config files
    for (const path of CONFIG_SEARCH_PATHS) {
      try {
        const exists = await fileExists(path);
        if (exists) {
          const loadedConfig = await loadConfigFile(path);
          Object.assign(config, loadedConfig);
          break; // Use first found config
        }
      } catch {
        // Continue to next path
      }
    }
  }

  // Step 3: Layer in environment variables as fallbacks
  const envConfig = loadEnvConfig();

  // Merge env config but don't override existing config
  if (!config.store && envConfig.store) {
    config.store = envConfig.store;
  }
  if (!config.ai && envConfig.ai) {
    config.ai = envConfig.ai;
  }

  return config;
}

/**
 * Load config from a specific file
 */
async function loadConfigFile(path: string): Promise<ImgfloConfig> {
  if (path.endsWith('.json')) {
    // JSON config
    const content = await readFile(path, 'utf-8');
    return JSON.parse(content);
  } else if (path.endsWith('.ts') || path.endsWith('.js') || path.endsWith('.mjs')) {
    // TypeScript/JavaScript config
    const module = await import(path);
    return module.default || module;
  } else {
    // Try as JSON first
    try {
      const content = await readFile(path, 'utf-8');
      return JSON.parse(content);
    } catch {
      // Try as module
      const module = await import(path);
      return module.default || module;
    }
  }
}

/**
 * Load configuration from environment variables
 */
function loadEnvConfig(): ImgfloConfig {
  const config: ImgfloConfig = {};

  // S3 configuration
  if (process.env.S3_BUCKET || process.env.AWS_REGION) {
    config.store = {
      default: 's3',
      s3: {
        bucket: process.env.S3_BUCKET,
        region: process.env.AWS_REGION || 'us-east-1',
        ...(process.env.AWS_ACCESS_KEY_ID && {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        }),
        ...(process.env.AWS_SECRET_ACCESS_KEY && {
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        }),
      },
    };
  }

  // AI configuration
  if (process.env.OPENAI_API_KEY) {
    config.ai = {
      default: 'openai',
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
      },
    };
  }

  return config;
}

/**
 * Check if a file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

/**
 * Merge CLI arguments into config (CLI args have highest priority)
 */
export function mergeCliArgs(
  config: ImgfloConfig,
  cliArgs: {
    bucket?: string;
    region?: string;
    provider?: string;
    [key: string]: unknown;
  }
): ImgfloConfig {
  const merged = { ...config };

  // Override S3 settings from CLI
  if (cliArgs.bucket || cliArgs.region) {
    merged.store = {
      ...merged.store,
      s3: {
        ...(merged.store?.s3 as any),
        ...(cliArgs.bucket && { bucket: cliArgs.bucket }),
        ...(cliArgs.region && { region: cliArgs.region }),
      },
    };
  }

  // Override storage provider
  if (cliArgs.provider) {
    merged.store = {
      ...merged.store,
      default: cliArgs.provider,
    };
  }

  return merged;
}

/**
 * Save config to global config file
 */
export async function saveGlobalConfig(config: ImgfloConfig): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises");
  const configDir = join(homedir(), ".imgflo");
  const configPath = join(configDir, "config.json");

  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}
