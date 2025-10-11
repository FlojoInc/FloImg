#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import createClient from "../index.js";
import { loadConfig } from "../config/loader.js";
import { ImgfloError } from "../core/errors.js";
import type { MimeType } from "../core/types.js";

/**
 * imgflo MCP Server - Smart Image Generation Router
 *
 * Provides intelligent routing to appropriate image generators based on intent.
 * Auto-discovers and loads available plugins (quickchart, d3, mermaid, qr, screenshot).
 */

// Plugin auto-discovery
async function loadAvailablePlugins(client: any): Promise<string[]> {
  const plugins: string[] = [];

  // Try to load each plugin
  const potentialPlugins = [
    { name: 'quickchart', module: 'imgflo-quickchart' },
    { name: 'd3', module: 'imgflo-d3' },
    { name: 'mermaid', module: 'imgflo-mermaid' },
    { name: 'qr', module: 'imgflo-qr' },
    { name: 'screenshot', module: 'imgflo-screenshot' },
  ];

  for (const { name, module } of potentialPlugins) {
    try {
      const plugin = await import(module);
      const generator = plugin.default ? plugin.default() : plugin();
      client.registerGenerator(generator);
      plugins.push(name);
      console.error(`[imgflo-mcp] Loaded plugin: ${name}`);
    } catch (err) {
      // Plugin not installed, skip silently
    }
  }

  return plugins;
}

// Smart generator selection based on intent
function selectGenerator(intent: string, params: any): string {
  const intentLower = intent.toLowerCase();

  // QR codes
  if (intentLower.includes('qr') || intentLower.includes('barcode')) {
    return 'qr';
  }

  // Screenshots
  if (intentLower.includes('screenshot') || intentLower.includes('capture') ||
      intentLower.includes('website') || intentLower.includes('webpage') ||
      intentLower.includes('url') && params.url) {
    return 'screenshot';
  }

  // Diagrams (Mermaid)
  if (intentLower.includes('flowchart') || intentLower.includes('diagram') ||
      intentLower.includes('sequence') || intentLower.includes('gantt') ||
      intentLower.includes('class diagram') || intentLower.includes('entity') ||
      intentLower.includes('state') || intentLower.includes('mindmap')) {
    return 'mermaid';
  }

  // Charts & Data Visualization
  if (intentLower.includes('chart') || intentLower.includes('graph') ||
      intentLower.includes('plot') || intentLower.includes('visualiz')) {

    // D3 for custom/complex visualizations
    if (params.render || params.renderString ||
        intentLower.includes('custom') || intentLower.includes('d3')) {
      return 'd3';
    }

    // QuickChart for standard charts
    return 'quickchart';
  }

  // OpenAI for image generation
  if (intentLower.includes('generate') || intentLower.includes('create') ||
      intentLower.includes('dall-e') || intentLower.includes('ai image')) {
    if (params.prompt) {
      return 'openai';
    }
  }

  // Default to shapes for simple SVG graphics
  return 'shapes';
}

// Initialize server
const server = new Server(
  {
    name: "imgflo",
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
      "Generate any type of image based on natural language intent. " +
      "Supports: charts (bar, line, pie, scatter), diagrams (flowcharts, sequence, gantt), " +
      "QR codes, screenshots, data visualizations (D3), AI images (DALL-E), and simple shapes/gradients. " +
      "The system automatically selects the best generator based on your intent.",
    inputSchema: {
      type: "object",
      properties: {
        intent: {
          type: "string",
          description:
            "What you want to create (e.g., 'bar chart showing quarterly revenue', " +
            "'QR code for https://example.com', 'flowchart of authentication process', " +
            "'screenshot of https://example.com')",
        },
        params: {
          type: "object",
          description:
            "Parameters for the generator. Common params: width, height, data, colors. " +
            "For charts: {type: 'bar'|'line'|'pie', data: {...}}. " +
            "For QR: {text: 'content'}. " +
            "For diagrams: {code: 'mermaid syntax'}. " +
            "For screenshots: {url: 'https://...'}. " +
            "For D3: {render: function, data: [...]}. " +
            "For shapes: {type: 'gradient'|'circle'|'rectangle'}. " +
            "For AI: {prompt: 'description'}",
          default: {},
        },
      },
      required: ["intent"],
    },
  },
  {
    name: "transform_image",
    description:
      "Transform an image (convert format, resize, etc.). " +
      "Takes image bytes (base64) and returns transformed ImageBlob.",
    inputSchema: {
      type: "object",
      properties: {
        imageBytes: {
          type: "string",
          description: "Base64-encoded image bytes",
        },
        mime: {
          type: "string",
          description: "MIME type of input image (e.g., 'image/svg+xml')",
        },
        operation: {
          type: "string",
          description: "Transform operation: 'convert', 'resize', 'composite', or 'optimizeSvg'",
          enum: ["convert", "resize", "composite", "optimizeSvg"],
        },
        to: {
          type: "string",
          description: "Target MIME type for convert operation (e.g., 'image/png', 'image/jpeg')",
        },
        width: {
          type: "number",
          description: "Target width for resize operation",
        },
        height: {
          type: "number",
          description: "Target height for resize operation",
        },
      },
      required: ["imageBytes", "mime", "operation"],
    },
  },
  {
    name: "upload_image",
    description:
      "Upload an image to configured storage (S3 or filesystem) and return a shareable URL. " +
      "Takes image bytes (base64) and storage key.",
    inputSchema: {
      type: "object",
      properties: {
        imageBytes: {
          type: "string",
          description: "Base64-encoded image bytes",
        },
        mime: {
          type: "string",
          description: "MIME type of the image (e.g., 'image/png')",
        },
        key: {
          type: "string",
          description: "Storage key/path (e.g., 'slides/background.png')",
        },
        provider: {
          type: "string",
          description: "Storage provider to use (e.g., 's3', 'fs'). Uses default if not specified.",
        },
      },
      required: ["imageBytes", "mime", "key"],
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
    // Load configuration
    const config = await loadConfig();
    const client = createClient(config);

    // Load available plugins
    const availablePlugins = await loadAvailablePlugins(client);
    console.error(`[imgflo-mcp] Available generators: shapes, openai, ${availablePlugins.join(', ')}`);

    switch (name) {
      case "generate_image": {
        const { intent, params = {} } = args as {
          intent: string;
          params?: Record<string, unknown>;
        };

        if (!intent) {
          throw new Error("'intent' parameter is required");
        }

        // Smart generator selection
        const generator = selectGenerator(intent, params);
        console.error(`[imgflo-mcp] Intent: "${intent}" → Generator: ${generator}`);

        const blob = await client.generate({
          generator,
          params,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                generator, // Tell user which generator was used
                blob: {
                  bytes: blob.bytes.toString("base64"),
                  mime: blob.mime,
                  width: blob.width,
                  height: blob.height,
                },
              }),
            },
          ],
        };
      }

      case "transform_image": {
        const { imageBytes, mime, operation, to, width, height } = args as {
          imageBytes: string;
          mime: string;
          operation: string;
          to?: string;
          width?: number;
          height?: number;
        };

        const inputBlob = {
          bytes: Buffer.from(imageBytes, "base64"),
          mime: mime as MimeType,
        };

        let blob;
        switch (operation) {
          case "convert":
            if (!to) throw new Error("'to' parameter required for convert operation");
            blob = await client.transform({
              blob: inputBlob,
              op: "convert",
              to: to as MimeType,
            });
            break;
          case "resize":
            if (!width || !height) throw new Error("'width' and 'height' required for resize");
            blob = await client.transform({
              blob: inputBlob,
              op: "resize",
              params: { width, height },
            });
            break;
          case "optimizeSvg":
            blob = await client.transform({
              blob: inputBlob,
              op: "optimizeSvg",
            });
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                blob: {
                  bytes: blob.bytes.toString("base64"),
                  mime: blob.mime,
                  width: blob.width,
                  height: blob.height,
                },
              }),
            },
          ],
        };
      }

      case "upload_image": {
        const { imageBytes, mime, key, provider } = args as {
          imageBytes: string;
          mime: string;
          key: string;
          provider?: string;
        };

        const inputBlob = {
          bytes: Buffer.from(imageBytes, "base64"),
          mime: mime as MimeType,
        };

        const result = await client.upload({
          blob: inputBlob,
          key,
          provider,
        });

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                success: true,
                url: result.url,
                key: result.key,
              }),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorType = error instanceof ImgfloError ? error.name : "Error";

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: errorType,
            message,
          }),
        },
      ],
      isError: true,
    };
  }
});

// Start server with stdio transport
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error("imgflo MCP server running on stdio");
  console.error("Smart routing enabled - will auto-select best generator based on intent");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
