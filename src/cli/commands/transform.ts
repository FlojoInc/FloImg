import { readFile, writeFile } from "fs/promises";
import { Command } from "commander";
import createClient from "../../index.js";
import { loadConfig } from "../../config/loader.js";
import type { MimeType } from "../../core/types.js";

export const transformCommand = new Command("transform")
  .description("Transform an image (convert, resize, etc.)")
  .requiredOption("--in <path>", "Input file path")
  .requiredOption("--op <operation>", "Operation: convert, resize, composite, optimizeSvg")
  .option("--to <format>", "Target format for convert operation")
  .option("--params <json>", "JSON parameters for the operation", "{}")
  .option("--out <path>", "Output file path")
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
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

      const params = JSON.parse(options.params);
      if (options.to) {
        params.to = options.to;
      }

      const result = await client.transform({
        blob: inputBlob,
        op: options.op,
        to: options.to as MimeType,
        params,
      });

      if (options.out) {
        await writeFile(options.out, result.bytes);
        console.log(`Transformed image saved to: ${options.out}`);
        console.log(`Format: ${result.mime}`);
      } else {
        // Write to stdout
        process.stdout.write(result.bytes);
      }
    } catch (error) {
      console.error("Error transforming image:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
