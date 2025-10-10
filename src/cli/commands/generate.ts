import { writeFile } from "fs/promises";
import { Command } from "commander";
import createClient from "../../index.js";
import { loadConfig } from "../../config/loader.js";

export const generateCommand = new Command("generate")
  .description("Generate an image using any registered generator")
  .option("-g, --generator <name>", "Generator to use (e.g., shapes, openai)", "shapes")
  .option("--params <json>", "JSON parameters for generation", "{}")
  .option("--out <path>", "Output file path")
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      const config = await loadConfig(options.config);
      const client = createClient(config);

      const params = JSON.parse(options.params);

      const blob = await client.generate({
        generator: options.generator,
        params,
      });

      if (options.out) {
        await writeFile(options.out, blob.bytes);
        console.log(`Generated image saved to: ${options.out}`);
        console.log(`Format: ${blob.mime}`);
        console.log(`Size: ${blob.width}x${blob.height}`);
      } else {
        // Write to stdout
        process.stdout.write(blob.bytes);
      }
    } catch (error) {
      console.error("Error generating image:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
