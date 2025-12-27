import { writeFile } from "fs/promises";
import { Command } from "commander";
import createClient from "../../index.js";
import { loadConfig } from "../../config/loader.js";
import { loadPlugin, showNpxTip } from "../utils/plugin-loader.js";

/**
 * Shorthand command for capturing webpage screenshots
 *
 * This command auto-installs @teamflojo/floimg-screenshot if not present.
 *
 * @example
 * ```bash
 * # Basic screenshot
 * floimg screenshot "https://github.com" -o github.png
 *
 * # Full page capture
 * floimg screenshot "https://docs.floimg.com" --full-page -o docs.png
 *
 * # Custom viewport (mobile)
 * floimg screenshot "https://example.com" --width 375 --height 812 -o mobile.png
 * ```
 */
export const screenshotCommand = new Command("screenshot")
  .description(
    "Capture a webpage screenshot (auto-installs @teamflojo/floimg-screenshot if needed)"
  )
  .argument("<url>", "URL of the webpage to capture")
  .option("-o, --out <path>", "Output file path (default: screenshot.png)", "screenshot.png")
  .option("-w, --width <pixels>", "Viewport width in pixels", "1280")
  .option("-h, --height <pixels>", "Viewport height in pixels", "720")
  .option("--full-page", "Capture full scrollable page (default: viewport only)", false)
  .option("-s, --selector <css>", "Screenshot a specific element by CSS selector")
  .option("-f, --format <format>", "Output format: png, jpeg", "png")
  .option("--device-scale <factor>", "Device scale factor (2 for retina)", "1")
  .option("--no-auto-install", "Don't prompt to install missing plugins")
  .option("--config <path>", "Path to config file")
  .action(async (url, options) => {
    try {
      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Load the Screenshot plugin (auto-installs if needed)
      const screenshotPlugin = await loadPlugin<{ default: () => unknown }>(
        "screenshot",
        options.autoInstall !== false
      );

      if (!screenshotPlugin) {
        process.exit(1);
      }

      client.registerGenerator(
        screenshotPlugin.default() as Parameters<typeof client.registerGenerator>[0]
      );

      // Ensure URL has protocol
      let targetUrl = url;
      if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
        targetUrl = `https://${targetUrl}`;
      }

      console.log(`Capturing screenshot of ${targetUrl}...`);

      const blob = await client.generate({
        generator: "screenshot",
        params: {
          url: targetUrl,
          width: parseInt(options.width, 10),
          height: parseInt(options.height, 10),
          fullPage: options.fullPage,
          selector: options.selector,
          format: options.format,
          deviceScaleFactor: parseFloat(options.deviceScale),
        },
      });

      // Determine output path with correct extension
      let outPath = options.out;
      if (outPath === "screenshot.png" && options.format === "jpeg") {
        outPath = "screenshot.jpg";
      }

      if (outPath.includes("://")) {
        // Cloud storage
        const result = await client.save(blob, outPath);
        console.log(`✅ Screenshot saved to: ${result.location}`);
      } else {
        // Local file
        await writeFile(outPath, blob.bytes);
        console.log(`✅ Screenshot saved to: ${outPath}`);
      }

      // Show tip for npx users
      showNpxTip();
    } catch (error) {
      console.error("Error capturing screenshot:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
