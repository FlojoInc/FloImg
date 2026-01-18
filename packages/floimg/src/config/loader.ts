import { readFile, access } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import type { FloimgConfig } from "../core/types.js";
import { ConfigurationError } from "../core/errors.js";

/**
 * Configuration search paths (in order of priority)
 */
const CONFIG_SEARCH_PATHS = [
  // 1. Current directory configs
  "./floimg.config.ts",
  "./floimg.config.js",
  "./floimg.config.mjs",
  "./.floimgrc.json",
  "./.floimgrc",

  // 2. Global config in home directory
  join(homedir(), ".floimg", "config.json"),
  join(homedir(), ".floimgrc.json"),
];

/**
 * Load configuration from multiple sources with priority:
 * 1. Explicit config file path (if provided)
 * 2. Config file in current directory
 * 3. Global config file in ~/.floimg/
 * 4. Environment variables
 */
export async function loadConfig(explicitPath?: string): Promise<FloimgConfig> {
  const config: FloimgConfig = {};

  // Step 1: Try explicit path if provided
  if (explicitPath) {
    try {
      const loadedConfig = await loadConfigFile(explicitPath);
      Object.assign(config, loadedConfig);
    } catch (error) {
      throw new ConfigurationError(
        `Failed to load config from ${explicitPath}: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
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
  if (!config.save && envConfig.save) {
    config.save = envConfig.save;
  }
  if (!config.ai && envConfig.ai) {
    config.ai = envConfig.ai;
  }

  return config;
}

/**
 * Load config from a specific file
 */
async function loadConfigFile(path: string): Promise<FloimgConfig> {
  if (path.endsWith(".json")) {
    // JSON config
    const content = await readFile(path, "utf-8");
    return JSON.parse(content);
  } else if (path.endsWith(".ts") || path.endsWith(".js") || path.endsWith(".mjs")) {
    // TypeScript/JavaScript config - convert to absolute file:// URL for import()
    const { resolve } = await import("path");
    const absolutePath = resolve(process.cwd(), path);
    const fileUrl = `file://${absolutePath}`;
    const module = await import(fileUrl);
    return module.default || module;
  } else {
    // Try as JSON first
    try {
      const content = await readFile(path, "utf-8");
      return JSON.parse(content);
    } catch {
      // Try as module - convert to absolute file:// URL
      const { resolve } = await import("path");
      const absolutePath = resolve(process.cwd(), path);
      const fileUrl = `file://${absolutePath}`;
      const module = await import(fileUrl);
      return module.default || module;
    }
  }
}

/**
 * Load configuration from environment variables.
 *
 * Supports multiple naming conventions for S3-compatible storage:
 * - FLOIMG_SAVE_S3_* - Explicit FloImg-specific naming (recommended)
 * - AWS_*, S3_* - Standard AWS naming (compatible with existing tools)
 * - TIGRIS_* - Tigris-specific naming
 *
 * Priority: FLOIMG_SAVE_S3 > TIGRIS > AWS/S3
 *
 * Filesystem storage:
 * - FLOIMG_SAVE_FS_BASE_DIR - Custom base directory for filesystem saves
 */
function loadEnvConfig(): FloimgConfig {
  const config: FloimgConfig = {};

  // Initialize save config
  const saveConfig: FloimgConfig["save"] = {};

  // Filesystem configuration
  if (process.env.FLOIMG_SAVE_FS_BASE_DIR) {
    saveConfig.fs = {
      baseDir: process.env.FLOIMG_SAVE_FS_BASE_DIR,
    };
  }

  // S3-compatible storage configuration
  // Check all naming conventions (FLOIMG_SAVE_* has priority)
  const hasS3Config =
    process.env.FLOIMG_SAVE_S3_BUCKET || process.env.S3_BUCKET || process.env.TIGRIS_BUCKET_NAME;

  if (hasS3Config) {
    // Bucket (required for S3)
    const bucket =
      process.env.FLOIMG_SAVE_S3_BUCKET || process.env.TIGRIS_BUCKET_NAME || process.env.S3_BUCKET;

    // Region
    const region =
      process.env.FLOIMG_SAVE_S3_REGION ||
      process.env.TIGRIS_REGION ||
      process.env.AWS_REGION ||
      "auto";

    // Credentials
    const accessKeyId =
      process.env.FLOIMG_SAVE_S3_ACCESS_KEY_ID ||
      process.env.TIGRIS_ACCESS_KEY_ID ||
      process.env.AWS_ACCESS_KEY_ID;

    const secretAccessKey =
      process.env.FLOIMG_SAVE_S3_SECRET_ACCESS_KEY ||
      process.env.TIGRIS_SECRET_ACCESS_KEY ||
      process.env.AWS_SECRET_ACCESS_KEY;

    // Endpoint (for non-AWS services like MinIO, R2, etc.)
    const endpoint =
      process.env.FLOIMG_SAVE_S3_ENDPOINT ||
      process.env.S3_ENDPOINT ||
      (process.env.TIGRIS_BUCKET_NAME ? "https://fly.storage.tigris.dev" : undefined);

    if (bucket) {
      saveConfig.default = "s3";
      saveConfig.s3 = {
        bucket,
        region,
        ...(endpoint && { endpoint }),
        ...(accessKeyId &&
          secretAccessKey && {
            credentials: {
              accessKeyId,
              secretAccessKey,
            },
          }),
      };
    }
  }

  // Only set config.save if we have any save configuration
  if (Object.keys(saveConfig).length > 0) {
    config.save = saveConfig;
  }

  // AI configuration
  if (process.env.OPENAI_API_KEY) {
    config.ai = {
      default: "openai",
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
  config: FloimgConfig,
  cliArgs: {
    bucket?: string;
    region?: string;
    provider?: string;
    [key: string]: unknown;
  }
): FloimgConfig {
  const merged = { ...config };

  // Override S3 settings from CLI
  if (cliArgs.bucket || cliArgs.region) {
    merged.save = {
      ...merged.save,
      s3: {
        ...(merged.save?.s3 as any),
        ...(cliArgs.bucket && { bucket: cliArgs.bucket }),
        ...(cliArgs.region && { region: cliArgs.region }),
      },
    };
  }

  // Override storage provider
  if (cliArgs.provider) {
    merged.save = {
      ...merged.save,
      default: cliArgs.provider,
    };
  }

  return merged;
}

/**
 * Save config to global config file
 */
export async function saveGlobalConfig(config: FloimgConfig): Promise<void> {
  const { mkdir, writeFile } = await import("fs/promises");
  const configDir = join(homedir(), ".floimg");
  const configPath = join(configDir, "config.json");

  await mkdir(configDir, { recursive: true });
  await writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
}
