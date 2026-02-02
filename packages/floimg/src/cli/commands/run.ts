import { Command } from "commander";
import { readFile } from "fs/promises";
import { parse } from "yaml";
import createClient from "../../index.js";
import { loadConfig } from "../../config/loader.js";
import type { Pipeline } from "../../core/types.js";
import { PipelineError } from "../../core/errors.js";

export const runCommand = new Command("run")
  .description("Run a YAML pipeline")
  .argument("<file>", "Path to YAML pipeline file")
  .option("--config <path>", "Path to config file")
  .action(async (file, options) => {
    try {
      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Read and parse YAML
      const yamlContent = await readFile(file, "utf-8");
      const pipeline: Pipeline = parse(yamlContent);

      console.log(`🚀 Running pipeline: ${pipeline.name || file}`);

      // Execute pipeline
      const results = await client.run(pipeline);

      console.log(`\n✓ Pipeline completed with ${results.length} steps\n`);

      // Output results
      for (const result of results) {
        if ("location" in result.value) {
          // SaveResult
          console.log(`  ${result.out}:`);
          console.log(`    Location: ${result.value.location}`);
          console.log(`    Provider: ${result.value.provider}`);
          console.log(`    Size: ${result.value.size} bytes`);
        } else if ("bytes" in result.value) {
          // ImageBlob
          console.log(`  ${result.out}:`);
          console.log(`    Type: ${result.value.mime}`);
          console.log(`    Size: ${result.value.width}x${result.value.height}`);
        }
      }

      console.log("\n✨ Done!");
    } catch (error) {
      if (error instanceof PipelineError) {
        // Validation errors get a clean, formatted output
        console.error("\n❌ Pipeline validation failed:\n");
        console.error(error.message);
      } else {
        console.error("\n❌ Error running pipeline:");
        console.error(error instanceof Error ? error.message : error);
      }
      process.exit(1);
    }
  });
