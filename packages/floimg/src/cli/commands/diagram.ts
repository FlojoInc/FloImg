import { readFile, writeFile } from "fs/promises";
import { Command } from "commander";
import createClient from "../../index.js";
import { loadConfig } from "../../config/loader.js";
import { loadPlugin, showNpxTip } from "../utils/plugin-loader.js";

/**
 * Shorthand command for generating Mermaid diagrams
 *
 * This command auto-installs @teamflojo/floimg-mermaid if not present.
 *
 * @example
 * ```bash
 * # Inline Mermaid code
 * floimg diagram "graph TD; A-->B; B-->C" -o flow.png
 *
 * # From file
 * floimg diagram --file diagram.mmd -o diagram.png
 *
 * # With theme
 * floimg diagram "sequenceDiagram; A->>B: Hello" --theme dark -o seq.svg
 * ```
 */
export const diagramCommand = new Command("diagram")
  .description("Generate a Mermaid diagram (auto-installs @teamflojo/floimg-mermaid if needed)")
  .argument("[code]", "Mermaid diagram code (inline)")
  .option("-f, --file <path>", "Read Mermaid code from file (.mmd)")
  .option("-o, --out <path>", "Output file path (default: diagram.png)", "diagram.png")
  .option("-w, --width <pixels>", "Width in pixels", "800")
  .option("-h, --height <pixels>", "Height in pixels")
  .option("--theme <theme>", "Mermaid theme: default, dark, forest, neutral", "default")
  .option("--format <format>", "Output format: png, svg", "png")
  .option("--background <color>", "Background color", "white")
  .option("--no-auto-install", "Don't prompt to install missing plugins")
  .option("--config <path>", "Path to config file")
  .action(async (code, options) => {
    try {
      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Load the Mermaid plugin (auto-installs if needed)
      const mermaidPlugin = await loadPlugin<{ default: () => unknown }>(
        "mermaid",
        options.autoInstall !== false
      );

      if (!mermaidPlugin) {
        process.exit(1);
      }

      client.registerGenerator(
        mermaidPlugin.default() as Parameters<typeof client.registerGenerator>[0]
      );

      // Get Mermaid code from inline argument or file
      let mermaidCode: string;

      if (options.file) {
        mermaidCode = await readFile(options.file, "utf-8");
      } else if (code) {
        // Handle inline code - convert semicolons to newlines for compact syntax
        mermaidCode = code.replace(/;\s*/g, "\n");
      } else {
        console.error("Error: Provide Mermaid code as argument or use --file <path>");
        console.error("");
        console.error("Examples:");
        console.error('  floimg diagram "graph TD; A-->B; B-->C" -o flow.png');
        console.error("  floimg diagram --file diagram.mmd -o diagram.png");
        process.exit(1);
      }

      const blob = await client.generate({
        generator: "mermaid",
        params: {
          code: mermaidCode,
          width: parseInt(options.width, 10),
          height: options.height ? parseInt(options.height, 10) : undefined,
          theme: options.theme,
          format: options.format,
          backgroundColor: options.background,
        },
      });

      // Determine output path with correct extension
      let outPath = options.out;
      if (outPath === "diagram.png" && options.format === "svg") {
        outPath = "diagram.svg";
      }

      if (outPath.includes("://")) {
        // Cloud storage
        const result = await client.save(blob, outPath);
        console.log(`✅ Diagram saved to: ${result.location}`);
      } else {
        // Local file
        await writeFile(outPath, blob.bytes);
        console.log(`✅ Diagram saved to: ${outPath}`);
      }

      // Show tip for npx users
      showNpxTip();
    } catch (error) {
      console.error("Error generating diagram:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
