#!/usr/bin/env node

import { Command } from "commander";
import { generateCommand } from "./commands/generate.js";
import { transformCommand } from "./commands/transform.js";
import { saveCommand } from "./commands/save.js";
import { runCommand } from "./commands/run.js";
import { configCommand } from "./commands/config.js";
import { pluginsCommand } from "./commands/plugins.js";
import { mcpCommand } from "./commands/mcp.js";
import { filterCommand, presetCommand } from "./commands/filter.js";
import { textCommand } from "./commands/text.js";
// Shorthand commands for common operations
import { qrCommand } from "./commands/qr.js";
import { resizeCommand } from "./commands/resize.js";
import { convertCommand } from "./commands/convert.js";
import { chartCommand } from "./commands/chart.js";
import { diagramCommand } from "./commands/diagram.js";
import { screenshotCommand } from "./commands/screenshot.js";
// Interactive mode
import { showInteractiveMenu, shouldShowInteractiveMenu } from "./interactive.js";
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
  .name("floimg")
  .description("Universal image workflow engine for developers and AI agents")
  .version(version);

// Core commands (full API)
program.addCommand(generateCommand);
program.addCommand(transformCommand);
program.addCommand(saveCommand);
program.addCommand(runCommand);
program.addCommand(configCommand);
program.addCommand(pluginsCommand);
program.addCommand(mcpCommand);
program.addCommand(filterCommand);
program.addCommand(presetCommand);
program.addCommand(textCommand);

// Shorthand commands (convenience wrappers)
program.addCommand(qrCommand);
program.addCommand(resizeCommand);
program.addCommand(convertCommand);
program.addCommand(chartCommand);
program.addCommand(diagramCommand);
program.addCommand(screenshotCommand);

// Enhanced doctor command
program
  .command("doctor")
  .description("Check floimg configuration and environment")
  .action(async () => {
    console.log("floimg doctor");
    console.log("==============\n");

    console.log("Version:", version);
    console.log("Node version:", process.version);

    // Check for config files
    console.log("\nConfiguration file search:");
    const configPaths = [
      { path: "./floimg.config.ts", desc: "Local TypeScript config" },
      { path: "./.floimgrc.json", desc: "Local JSON config" },
      { path: join(homedir(), ".floimg", "config.json"), desc: "Global config" },
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
      console.log("\n💡 Tip: Run 'floimg config init' to set up configuration");
    }

    // Load and display config
    try {
      const { loadConfig } = await import("../config/loader.js");
      const config = await loadConfig();

      console.log("\nCurrent configuration:");
      if (config.save?.s3) {
        console.log("  S3 Storage:");
        console.log(`    - Bucket: ${(config.save.s3 as any).bucket || "not set"}`);
        console.log(`    - Region: ${(config.save.s3 as any).region || "not set"}`);
        console.log(`    - Endpoint: ${(config.save.s3 as any).endpoint || "default (AWS)"}`);
        console.log(
          `    - Credentials: ${(config.save.s3 as any).credentials ? "configured" : "not set"}`
        );
      }
      if (config.ai?.openai) {
        console.log("  OpenAI:");
        console.log(`    - API Key: ${(config.ai.openai as any).apiKey ? "set" : "not set"}`);
      }
      if (!config.save && !config.ai) {
        console.log("  No configuration found");
      }
    } catch (error) {
      console.log(
        "\n⚠️  Error loading configuration:",
        error instanceof Error ? error.message : error
      );
    }

    console.log("\nEnvironment variables:");
    console.log("  AWS/S3:");
    console.log("    - AWS_REGION:", process.env.AWS_REGION || "not set");
    console.log("    - S3_BUCKET:", process.env.S3_BUCKET || "not set");
    console.log("    - AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID ? "set" : "not set");
    console.log("  Tigris:");
    console.log("    - TIGRIS_BUCKET_NAME:", process.env.TIGRIS_BUCKET_NAME || "not set");
    console.log("    - TIGRIS_REGION:", process.env.TIGRIS_REGION || "not set");
    console.log(
      "    - TIGRIS_ACCESS_KEY_ID:",
      process.env.TIGRIS_ACCESS_KEY_ID ? "set" : "not set"
    );
    console.log("  AI:");
    console.log("    - OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "set" : "not set");

    // Check plugins
    console.log("\nInstalled plugins:");
    const plugins = [
      "@teamflojo/floimg-quickchart",
      "@teamflojo/floimg-d3",
      "@teamflojo/floimg-mermaid",
      "@teamflojo/floimg-qr",
      "@teamflojo/floimg-screenshot",
    ];

    let hasPlugins = false;
    for (const plugin of plugins) {
      try {
        await import(plugin);
        console.log(`  ✓ ${plugin}`);
        hasPlugins = true;
      } catch {
        // Not installed
      }
    }

    if (!hasPlugins) {
      console.log("  (none installed)");
      console.log("\n💡 Install plugins: floimg plugins");
    }

    console.log("\n✨ Ready to use! Try:");
    console.log("  floimg plugins           # See available plugins");
    console.log("  floimg config init       # Interactive setup");
    console.log("  floimg mcp install       # Set up MCP for Claude Code");
    console.log(
      '  floimg generate --generator shapes --params \'{"type":"gradient"}\' --out test.svg'
    );
  });

// Check if we should show interactive menu (no args provided)
if (shouldShowInteractiveMenu(process.argv)) {
  showInteractiveMenu().catch(console.error);
} else {
  program.parse();
}
