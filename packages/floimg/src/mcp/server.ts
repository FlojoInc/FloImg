#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import createClient from "../index.js";
import { loadConfig } from "../config/loader.js";
import { FloimgError } from "../core/errors.js";
import type { MimeType, ImageBlob } from "../core/types.js";

/**
 * floimg MCP Server v0.1.0 - Smart Image Generation & Workflow Orchestration
 *
 * Key improvements:
 * - Session workspace: Images stored with IDs, no byte passing between tools
 * - File path references: Transform/save can reference any image by path or ID
 * - Pipeline support: Multi-step workflows in a single call
 * - Better intent routing: Recognizes AI image requests properly
 */

// Session workspace for storing images between tool calls
const SESSION_WORKSPACE = join(process.cwd(), ".floimg", "mcp-session");
const imageRegistry = new Map<string, { path: string; mime: MimeType; metadata: any }>();

// Ensure workspace exists
async function ensureWorkspace() {
  if (!existsSync(SESSION_WORKSPACE)) {
    await mkdir(SESSION_WORKSPACE, { recursive: true });
  }
}

// Generate unique image ID
function generateImageId(): string {
  return `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Load image from various sources
async function loadImage(
  imageId?: string,
  imagePath?: string,
  imageBytes?: string,
  mime?: string
): Promise<ImageBlob> {
  // Priority 1: imageId (reference to session image)
  if (imageId) {
    const registered = imageRegistry.get(imageId);
    if (!registered) {
      throw new Error(
        `Image ID not found: ${imageId}. Use generate_image first to create an image.`
      );
    }
    const bytes = await readFile(registered.path);
    return {
      bytes,
      mime: registered.mime,
      ...registered.metadata,
    };
  }

  // Priority 2: imagePath (reference to file on disk)
  if (imagePath) {
    const bytes = await readFile(imagePath);
    // Detect MIME type from extension if not provided
    const detectedMime = mime || detectMimeFromPath(imagePath);
    return {
      bytes,
      mime: detectedMime as MimeType,
    };
  }

  // Priority 3: imageBytes (base64 encoded, for external images)
  if (imageBytes && mime) {
    return {
      bytes: Buffer.from(imageBytes, "base64"),
      mime: mime as MimeType,
    };
  }

  throw new Error("Must provide imageId, imagePath, or imageBytes+mime");
}

// Detect MIME type from file path
function detectMimeFromPath(path: string): MimeType {
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

// Plugin type definitions
interface GeneratorPlugin {
  name: string;
  module: string;
  type: "generator";
}

interface AIPlugin {
  name: string;
  module: string;
  type: "ai";
  // Named exports for AI providers
  exports: {
    textProvider?: string;
    visionProvider?: string;
    transformProvider?: string;
    generator?: string;
  };
}

type PluginDef = GeneratorPlugin | AIPlugin;

// Plugin auto-discovery
async function loadAvailablePlugins(client: any): Promise<string[]> {
  const plugins: string[] = [];

  console.error("[floimg-mcp] Starting plugin discovery...");

  const potentialPlugins: PluginDef[] = [
    // Generator plugins (default export)
    { name: "quickchart", module: "@teamflojo/floimg-quickchart", type: "generator" },
    { name: "d3", module: "@teamflojo/floimg-d3", type: "generator" },
    { name: "mermaid", module: "@teamflojo/floimg-mermaid", type: "generator" },
    { name: "qr", module: "@teamflojo/floimg-qr", type: "generator" },
    { name: "screenshot", module: "@teamflojo/floimg-screenshot", type: "generator" },
    // AI provider plugins (named exports)
    {
      name: "google",
      module: "@teamflojo/floimg-google",
      type: "ai",
      exports: {
        textProvider: "geminiText",
        visionProvider: "geminiVision",
        transformProvider: "geminiTransform",
        generator: "geminiGenerate",
      },
    },
  ];

  for (const pluginDef of potentialPlugins) {
    try {
      console.error(`[floimg-mcp] Attempting to load ${pluginDef.module}...`);
      const plugin = await import(pluginDef.module);

      if (pluginDef.type === "generator") {
        // Generator plugin - use default export
        if (!plugin.default) {
          console.error(`[floimg-mcp] ⚠ ${pluginDef.module} has no default export`);
          continue;
        }
        const generator = typeof plugin.default === "function" ? plugin.default() : plugin.default;
        client.registerGenerator(generator);
        plugins.push(pluginDef.name);
        console.error(`[floimg-mcp] ✓ Loaded generator: ${pluginDef.name}`);
      } else if (pluginDef.type === "ai") {
        // AI provider plugin - use named exports
        const aiPlugin = pluginDef;
        let loadedAny = false;

        // Load text provider
        if (aiPlugin.exports.textProvider && plugin[aiPlugin.exports.textProvider]) {
          const textProviderFn = plugin[aiPlugin.exports.textProvider];
          const textProvider =
            typeof textProviderFn === "function" ? textProviderFn() : textProviderFn;
          client.registerTextProvider(textProvider);
          console.error(`[floimg-mcp] ✓ Loaded text provider: ${textProvider.name}`);
          loadedAny = true;
        }

        // Load vision provider
        if (aiPlugin.exports.visionProvider && plugin[aiPlugin.exports.visionProvider]) {
          const visionProviderFn = plugin[aiPlugin.exports.visionProvider];
          const visionProvider =
            typeof visionProviderFn === "function" ? visionProviderFn() : visionProviderFn;
          client.registerVisionProvider(visionProvider);
          console.error(`[floimg-mcp] ✓ Loaded vision provider: ${visionProvider.name}`);
          loadedAny = true;
        }

        // Load transform provider
        if (aiPlugin.exports.transformProvider && plugin[aiPlugin.exports.transformProvider]) {
          const transformProviderFn = plugin[aiPlugin.exports.transformProvider];
          const transformProvider =
            typeof transformProviderFn === "function" ? transformProviderFn() : transformProviderFn;
          client.registerTransformProvider(transformProvider);
          console.error(`[floimg-mcp] ✓ Loaded transform provider: ${transformProvider.name}`);
          loadedAny = true;
        }

        // Load generator
        if (aiPlugin.exports.generator && plugin[aiPlugin.exports.generator]) {
          const generatorFn = plugin[aiPlugin.exports.generator];
          const generator = typeof generatorFn === "function" ? generatorFn() : generatorFn;
          client.registerGenerator(generator);
          console.error(`[floimg-mcp] ✓ Loaded generator: ${generator.name}`);
          loadedAny = true;
        }

        if (loadedAny) {
          plugins.push(aiPlugin.name);
        }
      }
    } catch (err) {
      const error = err as Error;
      console.error(`[floimg-mcp] ✗ Failed to load ${pluginDef.module}: ${error.message}`);
    }
  }

  console.error(`[floimg-mcp] Plugin discovery complete. Loaded: ${plugins.join(", ") || "none"}`);

  if (plugins.length === 0) {
    console.error("[floimg-mcp] ⚠ No plugins found!");
    console.error(
      "[floimg-mcp] Install with: npm install -g @teamflojo/floimg-quickchart @teamflojo/floimg-mermaid @teamflojo/floimg-qr @teamflojo/floimg-d3 @teamflojo/floimg-screenshot @teamflojo/floimg-google"
    );
    console.error("[floimg-mcp] Only built-in generators (shapes, openai) will be available.");
  }

  return plugins;
}

// Smart generator selection based on intent - IMPROVED for v0.4.0
function selectGenerator(intent: string, params: any): string {
  const intentLower = intent.toLowerCase();

  // QR codes
  if (intentLower.includes("qr") || intentLower.includes("barcode")) {
    return "qr";
  }

  // Screenshots
  if (
    intentLower.includes("screenshot") ||
    intentLower.includes("capture") ||
    intentLower.includes("website") ||
    intentLower.includes("webpage") ||
    (intentLower.includes("url") && params.url)
  ) {
    return "screenshot";
  }

  // Diagrams (Mermaid)
  if (
    intentLower.includes("flowchart") ||
    intentLower.includes("diagram") ||
    intentLower.includes("sequence") ||
    intentLower.includes("gantt") ||
    intentLower.includes("class diagram") ||
    intentLower.includes("entity") ||
    intentLower.includes("state") ||
    intentLower.includes("mindmap")
  ) {
    return "mermaid";
  }

  // Charts & Data Visualization (check BEFORE AI detection)
  if (
    intentLower.includes("chart") ||
    intentLower.includes("graph") ||
    intentLower.includes("plot") ||
    intentLower.includes("visualiz")
  ) {
    // D3 for custom/complex visualizations
    if (
      params.render ||
      params.renderString ||
      intentLower.includes("custom") ||
      intentLower.includes("d3")
    ) {
      return "d3";
    }

    // QuickChart for standard charts
    return "quickchart";
  }

  // AI Image Generation - IMPROVED: Better keyword detection
  // Check for scene descriptions, subjects, art styles, etc.
  const aiKeywords = [
    "photo",
    "picture",
    "illustration",
    "painting",
    "drawing",
    "scene",
    "image of",
    "portrait",
    "landscape",
    "artwork",
    "realistic",
    "photorealistic",
    "stylized",
    "artistic",
    "dall-e",
    "ai image",
    "ai generated",
    "generate image",
    "person",
    "people",
    "animal",
    "building",
    "nature",
    "stadium",
    "player",
    "celebrating",
    "sunset",
    "dramatic",
  ];

  const hasAIKeyword = aiKeywords.some((keyword) => intentLower.includes(keyword));
  const hasPromptParam = params.prompt !== undefined;

  // Route to OpenAI if:
  // 1. Has AI-related keywords OR
  // 2. Has prompt parameter OR
  // 3. Intent describes a scene/subject (more than 5 words)
  const wordCount = intent.trim().split(/\s+/).length;
  const isDescriptiveIntent =
    wordCount > 5 && !intentLower.includes("gradient") && !intentLower.includes("shape");

  if (hasAIKeyword || hasPromptParam || isDescriptiveIntent) {
    return "openai";
  }

  // Default to shapes for simple SVG graphics (gradients, basic shapes)
  return "shapes";
}

// Initialize server
const server = new Server(
  {
    name: "floimg",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define available tools
const TOOLS: Tool[] = [
  {
    name: "generate_image",
    description:
      "Generate any type of image. Routes to the appropriate generator based on intent. " +
      "Supports: AI images (DALL-E), charts (bar, line, pie), diagrams (flowcharts, sequence), " +
      "QR codes, screenshots, data visualizations (D3), and simple shapes/gradients. " +
      "Images are saved to session workspace and assigned an imageId for chaining operations.",
    inputSchema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description:
            "Brief description to route to the right generator and provide simple defaults. " +
            "For AI images: intent becomes the prompt (e.g., 'golden retriever in field'). " +
            "For QR codes: include the URL (e.g., 'QR code for https://example.com'). " +
            "For charts/diagrams: just routing hint (e.g., 'bar chart', 'flowchart') - must provide params with data.",
        },
        params: {
          type: "object",
          description:
            "Generator-specific parameters. " +
            "AI images & QR codes: Optional (auto-filled from intent). " +
            "Charts & diagrams: REQUIRED - must provide structured data. " +
            "Examples: " +
            "Charts: {type: 'bar', data: {labels: [...], datasets: [...]}}. " +
            "Diagrams: {code: 'graph TD; A-->B'}. " +
            "AI images: {prompt: '...', size: '1024x1024'} (or omit, uses intent). " +
            "QR codes: {text: 'https://...'} (or omit if URL in intent).",
          default: {},
        },
        saveTo: {
          type: "string",
          description:
            "Optional: Also save to a destination (filesystem or cloud). " +
            "Examples: './output.png', 's3://bucket/key.png', 'r2://bucket/key.png'. " +
            "Image is always saved to session workspace regardless.",
        },
      },
      required: ["intent"],
    },
  },
  {
    name: "transform_image",
    description:
      "Apply deterministic, pixel-precise transforms to images. Unlike AI regeneration " +
      "(DALL-E, inpainting), these operations mathematically modify exactly what you specify—" +
      "the rest of your image stays identical. When you say 'resize to 1200x630,' it does " +
      "exactly that, guaranteed. " +
      "Supports: resize, convert, blur, sharpen, grayscale, modulate (brightness/saturation/hue), " +
      "tint, roundCorners, addText, addCaption, and preset filters. " +
      "Reference images by: imageId (from generate_image), imagePath, or imageBytes. " +
      "Each transform creates a new imageId for chaining.",
    inputSchema: {
      type: "object",
      properties: {
        imageId: {
          type: "string",
          description: "ID of image from previous generate_image or transform_image call",
        },
        imagePath: {
          type: "string",
          description: "Path to image file on disk (e.g., './my-image.png', 'generated/abc.png')",
        },
        imageBytes: {
          type: "string",
          description: "Base64-encoded image bytes (for external images not in session)",
        },
        mime: {
          type: "string",
          description:
            "MIME type (required only if using imageBytes, auto-detected for imagePath/imageId)",
        },
        operation: {
          type: "string",
          description: "Transform operation to apply",
          enum: [
            "convert",
            "resize",
            "composite",
            "optimizeSvg",
            "blur",
            "sharpen",
            "grayscale",
            "negate",
            "normalize",
            "threshold",
            "modulate",
            "tint",
            "extend",
            "extract",
            "roundCorners",
            "addText",
            "addCaption",
            "preset",
          ],
        },
        params: {
          type: "object",
          description:
            "Parameters for the operation. Examples: " +
            "resize: {width: 800, height: 600}, " +
            "blur: {sigma: 5}, " +
            "modulate: {brightness: 1.2, saturation: 1.3}, " +
            "roundCorners: {radius: 20}, " +
            "addText: {text: 'Hello', x: 100, y: 100, size: 48, color: '#fff', shadow: true}, " +
            "addCaption: {text: 'Caption', position: 'bottom'}, " +
            "preset: {name: 'vintage' | 'vibrant' | 'dramatic' | 'soft'}",
        },
        to: {
          type: "string",
          description: "Target MIME type (for convert operation)",
        },
        saveTo: {
          type: "string",
          description:
            "Optional: Also save to a destination (filesystem or cloud). " +
            "Image is always saved to session workspace regardless.",
        },
      },
      required: ["operation"],
    },
  },
  {
    name: "save_image",
    description:
      "Save an image to filesystem or cloud storage (S3, Tigris, R2, etc.). " +
      "Reference images by: imageId (from previous calls), imagePath (any file), or imageBytes (base64). " +
      "Supports smart destination routing: './output.png' → filesystem, 's3://bucket/key' → S3. " +
      "Returns public URL if saving to cloud storage.",
    inputSchema: {
      type: "object",
      properties: {
        imageId: {
          type: "string",
          description: "ID of image from previous generate_image or transform_image call",
        },
        imagePath: {
          type: "string",
          description: "Path to image file on disk",
        },
        imageBytes: {
          type: "string",
          description: "Base64-encoded image bytes",
        },
        mime: {
          type: "string",
          description: "MIME type (required only if using imageBytes)",
        },
        destination: {
          type: "string",
          description:
            "Where to save: './output.png', 's3://bucket/key.png', 'r2://bucket/key.png'",
        },
        provider: {
          type: "string",
          description:
            "Storage provider: 's3' or 'fs' (auto-detected from destination if not specified)",
        },
      },
      required: ["destination"],
    },
  },
  {
    name: "run_pipeline",
    description:
      "Execute a complete image workflow as one atomic operation. Combine AI generation " +
      "with deterministic transforms and cloud upload in a single call. What typically " +
      "requires 4+ separate tools becomes one pipeline: generate → transform → save. " +
      "Each step auto-chains to the next. Session state means you can iterate: run a " +
      "pipeline, then refine with additional transforms without starting over.",
    inputSchema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          description:
            "Array of steps to execute in order. Each step is an object with one key: " +
            "'generate', 'transform', or 'save'. The value is the parameters for that operation.",
          items: {
            type: "object",
          },
        },
      },
      required: ["steps"],
    },
  },
  {
    name: "analyze_image",
    description:
      "Analyze an image using AI vision (Claude Vision, GPT-4V, Gemini Vision, Ollama LLaVA). " +
      "Returns text or structured JSON describing the image content. " +
      "Reference images by: imageId (from previous calls), imagePath (any file), or imageBytes (base64). " +
      "Useful for: extracting text, describing contents, detecting objects, answering questions about images.",
    inputSchema: {
      type: "object",
      properties: {
        imageId: {
          type: "string",
          description: "ID of image from previous generate_image or transform_image call",
        },
        imagePath: {
          type: "string",
          description: "Path to image file on disk (e.g., './my-image.png')",
        },
        imageBytes: {
          type: "string",
          description: "Base64-encoded image bytes",
        },
        mime: {
          type: "string",
          description: "MIME type (required only if using imageBytes)",
        },
        prompt: {
          type: "string",
          description:
            "What to analyze or ask about the image. " +
            "Examples: 'Describe this image', 'What text is visible?', 'List all objects'",
        },
        provider: {
          type: "string",
          description:
            "Vision provider to use. Defaults to first available. " +
            "Options: 'openai' (GPT-4V), 'anthropic' (Claude), 'ollama' (LLaVA), 'gemini'",
          enum: ["openai", "anthropic", "ollama", "gemini"],
        },
        outputFormat: {
          type: "string",
          description: "Output format: 'text' (default) or 'json' (structured data)",
          enum: ["text", "json"],
        },
      },
      required: ["prompt"],
    },
  },
  {
    name: "generate_text",
    description:
      "Generate text using AI (Claude, GPT-4, Gemini, Ollama Llama/Mistral). " +
      "Useful for: creating prompts, writing descriptions, generating code, expanding on ideas. " +
      "Can optionally take context from previous analysis to chain operations.",
    inputSchema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The prompt or question to generate text for",
        },
        context: {
          type: "string",
          description: "Optional context to include (e.g., output from analyze_image)",
        },
        provider: {
          type: "string",
          description:
            "Text provider to use. Defaults to first available. " +
            "Options: 'openai' (GPT-4), 'anthropic' (Claude), 'ollama' (Llama/Mistral), 'gemini'",
          enum: ["openai", "anthropic", "ollama", "gemini"],
        },
        systemPrompt: {
          type: "string",
          description: "Optional system prompt to set the AI's behavior/role",
        },
        temperature: {
          type: "number",
          description: "Creativity level (0.0 = deterministic, 1.0 = creative). Default: 0.7",
        },
        maxTokens: {
          type: "number",
          description: "Maximum tokens to generate. Default: 1024",
        },
      },
      required: ["prompt"],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    await ensureWorkspace();

    // Load configuration (from floimg.config.ts or .floimgrc.json)
    const config = await loadConfig();
    const client = createClient(config);

    // Load available plugins
    const availablePlugins = await loadAvailablePlugins(client);
    console.error(
      `[floimg-mcp] Available generators: shapes, openai, ${availablePlugins.join(", ")}`
    );

    switch (name) {
      case "generate_image": {
        const {
          intent,
          params = {},
          saveTo,
        } = args as {
          intent: string;
          params?: Record<string, unknown>;
          saveTo?: string;
        };

        if (!intent) {
          throw new Error("'intent' parameter is required");
        }

        // Smart generator selection
        const generator = selectGenerator(intent, params);
        console.error(`[floimg-mcp] Intent: "${intent}" → Generator: ${generator}`);

        // Auto-fill params for simple cases to improve UX
        const finalParams = { ...params };

        if (generator === "openai" && !finalParams.prompt) {
          // For AI images: use intent as prompt
          finalParams.prompt = intent;
          finalParams.size = finalParams.size || "1024x1024";
          console.error(`[floimg-mcp] Auto-filled: prompt="${intent}", size=${finalParams.size}`);
        }

        if (generator === "qr" && !finalParams.text) {
          // For QR codes: extract URL from intent
          const urlMatch = intent.match(/https?:\/\/[^\s]+/);
          if (urlMatch) {
            finalParams.text = urlMatch[0];
            console.error(`[floimg-mcp] Auto-filled: text="${finalParams.text}"`);
          } else {
            throw new Error(
              "Could not extract URL from intent for QR code. " +
                "Please provide params.text explicitly. " +
                "Example: { intent: 'qr code', params: { text: 'https://example.com' } }"
            );
          }
        }

        // For charts and diagrams: params always required (too complex to extract)
        if (
          (generator === "quickchart" || generator === "mermaid" || generator === "d3") &&
          !finalParams.type &&
          !finalParams.data &&
          !finalParams.code &&
          !finalParams.render
        ) {
          throw new Error(
            `${generator} requires explicit params. Intent is only for routing. ` +
              `Please provide structured data: ` +
              `${generator === "quickchart" ? '{ type: "bar", data: {...} }' : ""}` +
              `${generator === "mermaid" ? '{ code: "graph TD; A-->B" }' : ""}` +
              `${generator === "d3" ? '{ render: "...", data: [...] }' : ""}`
          );
        }

        const blob = await client.generate({
          generator,
          params: finalParams,
        });

        // Save to session workspace
        const imageId = generateImageId();
        const ext = getExtension(blob.mime);
        const sessionPath = join(SESSION_WORKSPACE, `${imageId}.${ext}`);
        await client.save(blob, sessionPath);

        // Register in session
        imageRegistry.set(imageId, {
          path: sessionPath,
          mime: blob.mime,
          metadata: {
            width: blob.width,
            height: blob.height,
            source: blob.source,
          },
        });

        console.error(`[floimg-mcp] Saved to session: ${imageId} → ${sessionPath}`);

        // Optionally save to additional destination
        let cloudResult = null;
        if (saveTo) {
          cloudResult = await client.save(blob, saveTo);
          console.error(`[floimg-mcp] Also saved to: ${saveTo}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  imageId,
                  generator,
                  session: {
                    path: sessionPath,
                    mime: blob.mime,
                    width: blob.width,
                    height: blob.height,
                  },
                  ...(cloudResult && {
                    saved: {
                      location: cloudResult.location,
                      provider: cloudResult.provider,
                      size: cloudResult.size,
                    },
                  }),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "transform_image": {
        const {
          imageId,
          imagePath,
          imageBytes,
          mime,
          operation,
          params = {},
          to,
          saveTo,
        } = args as {
          imageId?: string;
          imagePath?: string;
          imageBytes?: string;
          mime?: string;
          operation: string;
          params?: Record<string, unknown>;
          to?: string;
          saveTo?: string;
        };

        // Load input image
        const inputBlob = await loadImage(imageId, imagePath, imageBytes, mime);

        let resultBlob: ImageBlob;

        // Handle special cases that need specific parameters
        if (operation === "convert") {
          if (!to) throw new Error("'to' parameter required for convert operation");
          resultBlob = await client.transform({
            blob: inputBlob,
            op: "convert",
            to: to as MimeType,
            params,
          });
        } else if (operation === "resize") {
          const { width, height } = params as any;
          if (!width && !height)
            throw new Error("'width' or 'height' required in params for resize");
          resultBlob = await client.transform({
            blob: inputBlob,
            op: "resize",
            params: { width, height, ...params },
          });
        } else {
          // All other operations use the generic params approach
          resultBlob = await client.transform({
            blob: inputBlob,
            op: operation as any,
            params,
          });
        }

        // Save to session workspace
        const newImageId = generateImageId();
        const ext = getExtension(resultBlob.mime);
        const sessionPath = join(SESSION_WORKSPACE, `${newImageId}.${ext}`);
        await client.save(resultBlob, sessionPath);

        // Register in session
        imageRegistry.set(newImageId, {
          path: sessionPath,
          mime: resultBlob.mime,
          metadata: {
            width: resultBlob.width,
            height: resultBlob.height,
            source: resultBlob.source,
          },
        });

        console.error(`[floimg-mcp] Transformed and saved: ${newImageId} → ${sessionPath}`);

        // Optionally save to additional destination
        let cloudResult = null;
        if (saveTo) {
          cloudResult = await client.save(resultBlob, saveTo);
          console.error(`[floimg-mcp] Also saved to: ${saveTo}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  imageId: newImageId,
                  operation,
                  session: {
                    path: sessionPath,
                    mime: resultBlob.mime,
                    width: resultBlob.width,
                    height: resultBlob.height,
                  },
                  ...(cloudResult && {
                    saved: {
                      location: cloudResult.location,
                      provider: cloudResult.provider,
                      size: cloudResult.size,
                    },
                  }),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "save_image": {
        const { imageId, imagePath, imageBytes, mime, destination, provider } = args as {
          imageId?: string;
          imagePath?: string;
          imageBytes?: string;
          mime?: string;
          destination: string;
          provider?: string;
        };

        // Load input image
        const inputBlob = await loadImage(imageId, imagePath, imageBytes, mime);

        const result = await client.save(
          inputBlob,
          provider ? { path: destination, provider } : destination
        );

        console.error(`[floimg-mcp] Saved to: ${destination}`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  location: result.location,
                  provider: result.provider,
                  size: result.size,
                  mime: result.mime,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "run_pipeline": {
        const { steps } = args as {
          steps: Array<Record<string, any>>;
        };

        if (!Array.isArray(steps) || steps.length === 0) {
          throw new Error("'steps' must be a non-empty array");
        }

        let currentImageId: string | undefined;
        const results: any[] = [];

        for (let i = 0; i < steps.length; i++) {
          const step = steps[i];
          const stepType = Object.keys(step)[0]; // 'generate', 'transform', or 'save'
          const stepParams = step[stepType];

          console.error(`[floimg-mcp] Pipeline step ${i + 1}/${steps.length}: ${stepType}`);

          if (stepType === "generate") {
            // Generate step
            const { intent, params = {} } = stepParams;
            const generator = selectGenerator(intent, params);

            // Auto-fill params for simple cases (same logic as generate_image tool)
            const finalParams = { ...params };
            if (generator === "openai" && !finalParams.prompt) {
              finalParams.prompt = intent;
              finalParams.size = finalParams.size || "1024x1024";
            }
            if (generator === "qr" && !finalParams.text) {
              const urlMatch = intent.match(/https?:\/\/[^\s]+/);
              if (urlMatch) finalParams.text = urlMatch[0];
            }

            const blob = await client.generate({ generator, params: finalParams });

            // Save to session
            const imageId = generateImageId();
            const ext = getExtension(blob.mime);
            const sessionPath = join(SESSION_WORKSPACE, `${imageId}.${ext}`);
            await client.save(blob, sessionPath);

            imageRegistry.set(imageId, {
              path: sessionPath,
              mime: blob.mime,
              metadata: { width: blob.width, height: blob.height, source: blob.source },
            });

            currentImageId = imageId;
            results.push({ step: i + 1, type: "generate", imageId, generator });
          } else if (stepType === "transform") {
            // Transform step - uses current image
            if (!currentImageId) {
              throw new Error(
                `Pipeline step ${i + 1}: transform requires a previous generate step`
              );
            }

            const { operation, params = {}, to } = stepParams;
            const inputBlob = await loadImage(currentImageId);

            let resultBlob: ImageBlob;
            if (operation === "convert") {
              resultBlob = await client.transform({
                blob: inputBlob,
                op: "convert",
                to: to as MimeType,
                params,
              });
            } else if (operation === "resize") {
              resultBlob = await client.transform({
                blob: inputBlob,
                op: "resize",
                params,
              });
            } else {
              resultBlob = await client.transform({
                blob: inputBlob,
                op: operation as any,
                params,
              });
            }

            // Save to session
            const newImageId = generateImageId();
            const ext = getExtension(resultBlob.mime);
            const sessionPath = join(SESSION_WORKSPACE, `${newImageId}.${ext}`);
            await client.save(resultBlob, sessionPath);

            imageRegistry.set(newImageId, {
              path: sessionPath,
              mime: resultBlob.mime,
              metadata: { width: resultBlob.width, height: resultBlob.height },
            });

            currentImageId = newImageId;
            results.push({ step: i + 1, type: "transform", operation, imageId: newImageId });
          } else if (stepType === "save") {
            // Save step - saves current image
            if (!currentImageId) {
              throw new Error(
                `Pipeline step ${i + 1}: save requires a previous generate/transform step`
              );
            }

            const { destination, provider } = stepParams;
            const inputBlob = await loadImage(currentImageId);

            const result = await client.save(
              inputBlob,
              provider ? { path: destination, provider } : destination
            );

            results.push({
              step: i + 1,
              type: "save",
              location: result.location,
              provider: result.provider,
              size: result.size,
            });
          } else {
            throw new Error(
              `Unknown pipeline step type: ${stepType}. Use 'generate', 'transform', or 'save'.`
            );
          }
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  pipeline: {
                    totalSteps: steps.length,
                    finalImageId: currentImageId,
                    results,
                  },
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "analyze_image": {
        const {
          imageId,
          imagePath,
          imageBytes,
          mime,
          prompt,
          provider,
          outputFormat = "text",
        } = args as {
          imageId?: string;
          imagePath?: string;
          imageBytes?: string;
          mime?: string;
          prompt: string;
          provider?: "openai" | "anthropic" | "ollama" | "gemini";
          outputFormat?: "text" | "json";
        };

        if (!prompt) {
          throw new Error("'prompt' parameter is required");
        }

        // Load input image
        const inputBlob = await loadImage(imageId, imagePath, imageBytes, mime);

        // Check if vision providers are available
        const capabilities = client.getCapabilities();
        if (!capabilities.visionProviders || capabilities.visionProviders.length === 0) {
          throw new Error(
            "No vision providers configured. " +
              "Configure AI providers in floimg.config.ts or environment variables. " +
              "Supported: OpenAI (OPENAI_API_KEY), Anthropic (ANTHROPIC_API_KEY), " +
              "Ollama (OLLAMA_BASE_URL), Gemini (GOOGLE_AI_API_KEY)"
          );
        }

        // Select provider (use specified or first available)
        const selectedProvider = provider || capabilities.visionProviders[0].name;
        console.error(`[floimg-mcp] Analyzing image with provider: ${selectedProvider}`);

        const result = await client.analyzeImage({
          provider: selectedProvider,
          blob: inputBlob,
          params: {
            prompt,
            outputFormat,
          },
        });

        console.error(`[floimg-mcp] Analysis complete: ${result.content.slice(0, 100)}...`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  provider: selectedProvider,
                  outputFormat: result.type,
                  content: result.content,
                  ...(result.parsed && { parsed: result.parsed }),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "generate_text": {
        const { prompt, context, provider, systemPrompt, temperature, maxTokens } = args as {
          prompt: string;
          context?: string;
          provider?: "openai" | "anthropic" | "ollama" | "gemini";
          systemPrompt?: string;
          temperature?: number;
          maxTokens?: number;
        };

        if (!prompt) {
          throw new Error("'prompt' parameter is required");
        }

        // Check if text providers are available
        const capabilities = client.getCapabilities();
        if (!capabilities.textProviders || capabilities.textProviders.length === 0) {
          throw new Error(
            "No text providers configured. " +
              "Configure AI providers in floimg.config.ts or environment variables. " +
              "Supported: OpenAI (OPENAI_API_KEY), Anthropic (ANTHROPIC_API_KEY), " +
              "Ollama (OLLAMA_BASE_URL), Gemini (GOOGLE_AI_API_KEY)"
          );
        }

        // Select provider (use specified or first available)
        const selectedProvider = provider || capabilities.textProviders[0].name;
        console.error(`[floimg-mcp] Generating text with provider: ${selectedProvider}`);

        const result = await client.generateText({
          provider: selectedProvider,
          params: {
            prompt,
            ...(context && { context }),
            ...(systemPrompt && { systemPrompt }),
            ...(temperature !== undefined && { temperature }),
            ...(maxTokens !== undefined && { maxTokens }),
          },
        });

        console.error(`[floimg-mcp] Text generation complete: ${result.content.slice(0, 100)}...`);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: true,
                  provider: selectedProvider,
                  content: result.content,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof FloimgError ? error.name : "Error";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: errorType,
              message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Helper: Get file extension from MIME type
function getExtension(mime: MimeType): string {
  const map: Record<MimeType, string> = {
    "image/svg+xml": "svg",
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/avif": "avif",
  };
  return map[mime] || "png";
}

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error("floimg MCP server v0.1.0 running on stdio");
  console.error("Session workspace:", SESSION_WORKSPACE);
  console.error("Smart routing enabled - will auto-select best generator based on intent");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
