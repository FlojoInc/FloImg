# @teamflojo/floimg-mcp

Model Context Protocol (MCP) server for [FloImg](https://floimg.com) - AI image workflow automation.

This package exposes FloImg's image generation, transformation, and saving capabilities to AI agents like Claude, GPT, and others through the [Model Context Protocol](https://modelcontextprotocol.io/).

## Installation

```bash
npm install -g @teamflojo/floimg-mcp
# or
pnpm add -g @teamflojo/floimg-mcp
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "floimg": {
      "command": "npx",
      "args": ["-y", "@teamflojo/floimg-mcp"],
      "env": {
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

### With Claude Code

Add to your project's `.mcp.json`:

```json
{
  "mcpServers": {
    "floimg": {
      "command": "npx",
      "args": ["-y", "@teamflojo/floimg-mcp"]
    }
  }
}
```

### Direct Execution

```bash
npx @teamflojo/floimg-mcp
```

## Available Tools

### `generate_image`

Generate any type of image with smart intent routing:

- **AI Images**: DALL-E, Stability AI, Replicate
- **Charts**: Bar, line, pie, radar (via QuickChart)
- **Diagrams**: Flowcharts, sequence diagrams (via Mermaid)
- **QR Codes**: Any URL or text
- **Screenshots**: Capture any webpage
- **Shapes**: SVG gradients and basic shapes

```
Intent: "golden retriever in a sunny field" → Routes to DALL-E
Intent: "QR code for https://floimg.com" → Routes to QR generator
Intent: "bar chart of sales data" → Routes to QuickChart
```

### `transform_image`

Apply deterministic, pixel-precise transforms:

- `resize` - Exact dimensions
- `blur`, `sharpen` - Image effects
- `grayscale`, `modulate` - Color adjustments
- `addText`, `addCaption` - Text overlays
- `roundCorners` - Border radius
- `convert` - Format conversion (PNG, JPEG, WebP, AVIF)

Unlike AI regeneration, these operations modify exactly what you specify.

### `save_image`

Save to filesystem or cloud storage:

- `./output.png` → Local filesystem
- `s3://bucket/key.png` → Amazon S3
- `r2://bucket/key.png` → Cloudflare R2
- `tigris://bucket/key.png` → Tigris

### `run_pipeline`

Execute multi-step workflows atomically:

```json
{
  "steps": [
    { "generate": { "intent": "mountain landscape at sunset" } },
    { "transform": { "operation": "resize", "params": { "width": 1200, "height": 630 } } },
    { "transform": { "operation": "addCaption", "params": { "text": "Adventure Awaits" } } },
    { "save": { "destination": "s3://my-bucket/hero.png" } }
  ]
}
```

### `analyze_image`

AI vision analysis with multiple providers:

- OpenAI GPT-4V
- Anthropic Claude Vision
- Google Gemini Vision
- Ollama LLaVA (local)

### `generate_text`

AI text generation for creating prompts, descriptions, and more.

## Plugin Discovery

The MCP server automatically discovers and loads installed FloImg plugins:

- `@teamflojo/floimg-quickchart` - Chart generation
- `@teamflojo/floimg-mermaid` - Diagram generation
- `@teamflojo/floimg-qr` - QR code generation
- `@teamflojo/floimg-d3` - Data visualization
- `@teamflojo/floimg-screenshot` - Web screenshots
- `@teamflojo/floimg-google` - Gemini AI providers

Install plugins globally for the MCP server to find them:

```bash
npm install -g @teamflojo/floimg-quickchart @teamflojo/floimg-mermaid @teamflojo/floimg-qr
```

## Configuration

Configure via environment variables or `floimg.config.ts`:

```bash
# AI Providers
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=...
ANTHROPIC_API_KEY=...

# Cloud Storage
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
```

## Requirements

- Node.js 18+
- `@teamflojo/floimg` (peer dependency)

## Related

- [FloImg Documentation](https://floimg.com/docs)
- [FloImg Studio](https://studio.floimg.com) - Visual workflow builder
- [Model Context Protocol](https://modelcontextprotocol.io/)

## License

MIT
