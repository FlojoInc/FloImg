#!/usr/bin/env node

import { Command } from "commander";
import { generateCommand } from "./commands/generate.js";
import { transformCommand } from "./commands/transform.js";
import { uploadCommand } from "./commands/upload.js";
import { configCommand } from "./commands/config.js";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";
import { homedir } from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read package.json for version
const packageJsonPath = join(__dirname, "../../package.json");
let version = "0.1.0";
try {
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf-8"));
  version = packageJson.version;
} catch {
  // Use default version
}

const program = new Command();

program
  .name("imgflo")
  .description("Image generation and transformation tool for AI agents and developers")
  .version(version);

program.addCommand(generateCommand);
program.addCommand(transformCommand);
program.addCommand(uploadCommand);
program.addCommand(configCommand);

// Enhanced doctor command
program
  .command("doctor")
  .description("Check imgflo configuration and environment")
  .action(async () => {
    console.log("imgflo doctor");
    console.log("=============\n");

    console.log("Version:", version);
    console.log("Node version:", process.version);

    // Check for config files
    console.log("\nConfiguration file search:");
    const configPaths = [
      { path: "./imgflo.config.ts", desc: "Local TypeScript config" },
      { path: "./.imgflorc.json", desc: "Local JSON config" },
      { path: join(homedir(), ".imgflo", "config.json"), desc: "Global config" },
    ];

    let foundConfig = false;
    for (const { path, desc } of configPaths) {
      const { access } = await import("fs/promises");
      try {
        await access(resolve(path));
        console.log(`  ✓ ${desc}: ${path}`);
        foundConfig = true;
      } catch {
        console.log(`  ✗ ${desc}: not found`);
      }
    }

    if (!foundConfig) {
      console.log("\n💡 Tip: Run 'imgflo config init' to set up configuration");
    }

    // Load and display config
    try {
      const { loadConfig } = await import("../config/loader.js");
      const config = await loadConfig();

      console.log("\nCurrent configuration:");
      if (config.store?.s3) {
        console.log("  S3 Storage:");
        console.log(`    - Bucket: ${(config.store.s3 as any).bucket || "not set"}`);
        console.log(`    - Region: ${(config.store.s3 as any).region || "not set"}`);
      }
      if (config.ai?.openai) {
        console.log("  OpenAI:");
        console.log(`    - API Key: ${(config.ai.openai as any).apiKey ? "set" : "not set"}`);
      }
      if (!config.store && !config.ai) {
        console.log("  No configuration found");
      }
    } catch (error) {
      console.log("\n⚠️  Error loading configuration:", error instanceof Error ? error.message : error);
    }

    console.log("\nEnvironment variables:");
    console.log("  - AWS_REGION:", process.env.AWS_REGION || "not set");
    console.log("  - S3_BUCKET:", process.env.S3_BUCKET || "not set");
    console.log("  - OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "set" : "not set");

    console.log("\n✨ Ready to use! Try:");
    console.log("  imgflo generate --provider svg --params '{\"type\":\"gradient\"}' --out test.svg");
  });

program.parse();
