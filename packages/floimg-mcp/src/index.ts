/**
 * @teamflojo/floimg-mcp
 *
 * Model Context Protocol server for floimg - AI image workflow automation.
 *
 * This package provides an MCP server that exposes floimg's image generation,
 * transformation, and saving capabilities to AI agents (Claude, GPT, etc.).
 *
 * ## Usage
 *
 * Add to your MCP configuration:
 *
 * ```json
 * {
 *   "mcpServers": {
 *     "floimg": {
 *       "command": "npx",
 *       "args": ["-y", "@teamflojo/floimg-mcp"]
 *     }
 *   }
 * }
 * ```
 *
 * Or run directly:
 *
 * ```bash
 * npx @teamflojo/floimg-mcp
 * ```
 *
 * ## Available Tools
 *
 * - `generate_image` - Generate images (AI, charts, diagrams, QR codes, screenshots)
 * - `transform_image` - Apply deterministic transforms (resize, blur, caption, etc.)
 * - `save_image` - Save to filesystem or cloud storage (S3, R2, Tigris)
 * - `run_pipeline` - Execute multi-step workflows atomically
 * - `analyze_image` - AI vision analysis (GPT-4V, Claude, Gemini, Ollama)
 * - `generate_text` - AI text generation
 *
 * @packageDocumentation
 */

// Re-export for programmatic usage (advanced)
export { Server } from "@modelcontextprotocol/sdk/server/index.js";
export { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
