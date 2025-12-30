/**
 * floimg AI commands for text generation, vision analysis, and image editing
 *
 * Uses Gemini providers from @teamflojo/floimg-google
 */

import { Command } from "commander";
import { readFile, writeFile } from "fs/promises";
import createClient from "../../index.js";
import { loadConfig } from "../../config/loader.js";
import type { MimeType } from "../../core/types.js";

// Module name as variable to avoid TypeScript static analysis of optional dependency
const GOOGLE_PLUGIN_MODULE = "@teamflojo/floimg-google";

// Dynamic import helper for optional floimg-google dependency
async function loadGooglePlugin(): Promise<{
  geminiText: (config?: unknown) => unknown;
  geminiVision: (config?: unknown) => unknown;
  geminiTransform: (config?: unknown) => unknown;
  geminiGenerate: (config?: unknown) => unknown;
}> {
  try {
    // Dynamic import to avoid bundling as hard dependency

    const module = await import(GOOGLE_PLUGIN_MODULE);
    return {
      geminiText: module.geminiText,
      geminiVision: module.geminiVision,
      geminiTransform: module.geminiTransform,
      geminiGenerate: module.geminiGenerate,
    };
  } catch {
    console.error("Error: @teamflojo/floimg-google is not installed.");
    console.error("Install with: npm install @teamflojo/floimg-google");
    process.exit(1);
  }
}

// Detect MIME type from file path
function detectMime(path: string): MimeType {
  const ext = path.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, MimeType> = {
    svg: "image/svg+xml",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    avif: "image/avif",
  };
  return mimeMap[ext || ""] || "image/png";
}

// Main AI command group
export const aiCommand = new Command("ai").description(
  "AI-powered text generation, image analysis, and image editing"
);

// ============================================================================
// floimg ai text - Generate text using Gemini
// ============================================================================

aiCommand
  .command("text")
  .description("Generate text using Gemini AI")
  .requiredOption("--prompt <text>", "Text prompt for generation")
  .option("--api-key <key>", "Google AI API key (or set GOOGLE_AI_API_KEY)")
  .option("--model <model>", "Gemini model name", "gemini-2.5-flash")
  .option("--output-format <format>", "Output format: text or json", "text")
  .option("--context <text>", "Additional context for the prompt")
  .option("--system-prompt <text>", "System prompt to guide model behavior")
  .option("--temperature <number>", "Creativity level (0-2)", "0.7")
  .option("--max-tokens <number>", "Maximum tokens in response", "1000")
  .option("--out <path>", "Save output to file")
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      const { geminiText } = await loadGooglePlugin();

      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Register the Gemini text provider
      const apiKey = options.apiKey || process.env.GOOGLE_AI_API_KEY;
      client.registerTextProvider(geminiText({ apiKey, model: options.model }) as any);

      // Generate text
      const result = await client.generateText({
        provider: "gemini-text",
        params: {
          prompt: options.prompt,
          context: options.context,
          systemPrompt: options.systemPrompt,
          outputFormat: options.outputFormat,
          temperature: parseFloat(options.temperature),
          maxTokens: parseInt(options.maxTokens),
          apiKey, // Pass for per-request override
        },
      });

      const output = result.content;

      if (options.out) {
        await writeFile(options.out, output);
        console.error(`Output saved to: ${options.out}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// floimg ai vision - Analyze image using Gemini Vision
// ============================================================================

aiCommand
  .command("vision")
  .description("Analyze an image using Gemini Vision")
  .requiredOption("--image <path>", "Input image path")
  .requiredOption("--prompt <text>", "Analysis prompt (what to look for)")
  .option("--api-key <key>", "Google AI API key (or set GOOGLE_AI_API_KEY)")
  .option("--model <model>", "Gemini model name", "gemini-2.5-flash")
  .option("--output-format <format>", "Output format: text or json", "text")
  .option("--max-tokens <number>", "Maximum tokens in response", "1000")
  .option("--out <path>", "Save output to file")
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      const { geminiVision } = await loadGooglePlugin();

      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Register the Gemini vision provider
      const apiKey = options.apiKey || process.env.GOOGLE_AI_API_KEY;
      client.registerVisionProvider(geminiVision({ apiKey, model: options.model }) as any);

      // Read the input image
      const imageBytes = await readFile(options.image);
      const mime = detectMime(options.image);

      // Analyze the image
      const result = await client.analyzeImage({
        provider: "gemini-vision",
        blob: {
          bytes: imageBytes,
          mime,
        },
        params: {
          prompt: options.prompt,
          outputFormat: options.outputFormat,
          maxTokens: parseInt(options.maxTokens),
          apiKey, // Pass for per-request override
        },
      });

      const output = result.content;

      if (options.out) {
        await writeFile(options.out, output);
        console.error(`Output saved to: ${options.out}`);
      } else {
        console.log(output);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// floimg ai edit - Edit image using Gemini
// ============================================================================

aiCommand
  .command("edit")
  .description("Edit an image using Gemini AI (Nano Banana)")
  .requiredOption("--image <path>", "Input image path")
  .requiredOption("--prompt <text>", "Edit instructions")
  .requiredOption("--out <path>", "Output image path")
  .option("--api-key <key>", "Google AI API key (or set GOOGLE_AI_API_KEY)")
  .option("--model <model>", "Gemini image model", "gemini-2.5-flash-image")
  .option(
    "--pre-prompt <text>",
    "Pre-prompt instructions",
    "Edit this image by incorporating the following concept while preserving the original composition and style:"
  )
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      const { geminiTransform } = await loadGooglePlugin();

      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Register the Gemini transform provider
      const apiKey = options.apiKey || process.env.GOOGLE_AI_API_KEY;
      client.registerTransformProvider(geminiTransform({ apiKey, model: options.model }) as any);

      // Read the input image
      const imageBytes = await readFile(options.image);
      const mime = detectMime(options.image);

      // Edit the image
      const result = await client.transform({
        blob: {
          bytes: imageBytes,
          mime,
        },
        op: "edit",
        provider: "gemini-transform",
        params: {
          prompt: options.prompt,
          prePrompt: options.prePrompt,
          model: options.model,
          apiKey, // Pass for per-request override
        },
      });

      // Save the result
      await writeFile(options.out, result.bytes);
      console.error(`Edited image saved to: ${options.out}`);
      console.error(`Format: ${result.mime}`);
      if (result.width && result.height) {
        console.error(`Dimensions: ${result.width}x${result.height}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

// ============================================================================
// floimg ai generate - Generate image from text using Gemini
// ============================================================================

aiCommand
  .command("generate")
  .description("Generate an image from text using Gemini (Nano Banana)")
  .requiredOption("--prompt <text>", "Image generation prompt")
  .requiredOption("--out <path>", "Output image path")
  .option("--api-key <key>", "Google AI API key (or set GOOGLE_AI_API_KEY)")
  .option("--model <model>", "Gemini image model", "gemini-2.5-flash-image")
  .option("--config <path>", "Path to config file")
  .action(async (options) => {
    try {
      const { geminiGenerate } = await loadGooglePlugin();

      const config = await loadConfig(options.config);
      const client = createClient(config);

      // Register the Gemini generator
      const apiKey = options.apiKey || process.env.GOOGLE_AI_API_KEY;
      client.registerGenerator(geminiGenerate({ apiKey, model: options.model }) as any);

      // Generate the image
      const result = await client.generate({
        generator: "gemini-generate",
        params: {
          prompt: options.prompt,
          model: options.model,
          apiKey, // Pass for per-request override
        },
      });

      // Save the result
      await writeFile(options.out, result.bytes);
      console.error(`Generated image saved to: ${options.out}`);
      console.error(`Format: ${result.mime}`);
      if (result.width && result.height) {
        console.error(`Dimensions: ${result.width}x${result.height}`);
      }
    } catch (error) {
      console.error("Error:", error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });
