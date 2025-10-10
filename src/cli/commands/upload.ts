import { readFile } from "fs/promises";
import { Command } from "commander";
import createClient from "../../index.js";
import { loadConfig, mergeCliArgs } from "../../config/loader.js";
import type { MimeType } from "../../core/types.js";

export const uploadCommand = new Command("upload")
  .description("Upload an image to cloud storage")
  .requiredOption("--in <path>", "Input file path")
  .requiredOption("--key <key>", "Storage key/path")
  .option("--provider <name>", "Storage provider name (overrides config)")
  .option("--bucket <name>", "S3 bucket name (overrides config)")
  .option("--region <region>", "S3 region (overrides config)")
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      let config = await loadConfig(options.config);

      // Merge CLI arguments (they have highest priority)
      config = mergeCliArgs(config, {
        provider: options.provider,
        bucket: options.bucket,
        region: options.region,
      });

      const client = createClient(config);

      // Read input file
      const inputBytes = await readFile(options.in);

      // Detect MIME type from file extension
      const ext = options.in.split(".").pop()?.toLowerCase();
      let mime: MimeType = "image/png";
      if (ext === "svg") mime = "image/svg+xml";
      else if (ext === "jpg" || ext === "jpeg") mime = "image/jpeg";
      else if (ext === "webp") mime = "image/webp";
      else if (ext === "avif") mime = "image/avif";

      const inputBlob = {
        bytes: inputBytes,
        mime,
      };

      const result = await client.upload({
        blob: inputBlob,
        key: options.key,
        provider: options.provider,
      });

      console.log(`Image uploaded successfully!`);
      console.log(`Key: ${result.key}`);
      if (result.url) {
        console.log(`URL: ${result.url}`);
      }
      if (result.etag) {
        console.log(`ETag: ${result.etag}`);
      }
    } catch (error) {
      console.error("Error uploading image:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
