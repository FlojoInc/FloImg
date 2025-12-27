# @teamflojo/floimg-claude

Claude Code plugin for [floimg](https://floimg.com) — composable image workflows.

## Why?

**The Probabilistic Editing Problem**: When you ask ChatGPT to modify an image, DALL-E generates a new image—it doesn't edit pixels. Even AI "editing" like inpainting is probabilistic. FloImg applies deterministic transforms: adjust hue, resize, add caption—the image stays intact except for exactly what you asked.

**The Tool Fragmentation Problem**: People wrangle remove.bg, Photoshop, Figma, format converters, cloud services. FloImg consolidates into one pipeline.

**Better Than Glue Code**: FloImg isn't just integration code—it's accessible through natural language in Claude Code, visual builder in FloImg Studio, SDK, CLI, or MCP.

Generate AI images, resize for social media, add captions, upload to S3—all through natural conversation.

> **[Full Documentation →](https://floimg.com/docs/claude-code)**

## Quick Start

Install the plugin and start using it:

```bash
npm install -g @teamflojo/floimg-claude
```

Then describe what you need:

```
"Create a hero image for my blog, resize to 1200x630, add a caption"
"Generate a product mockup with a subtle watermark"
/floimg:workflow AI hero → resize → caption → save to S3
```

Simple generators (`/floimg:qr`, `/floimg:chart`) work immediately via CLI. Complex workflows use MCP for session state and iteration.

## Architecture

| Command Type                                                                    | Method      | Works Immediately? |
| ------------------------------------------------------------------------------- | ----------- | ------------------ |
| Simple (`/floimg:qr`, `/floimg:chart`, `/floimg:diagram`, `/floimg:screenshot`) | CLI via npx | Yes                |
| Complex (`/floimg:image`, `/floimg:workflow`)                                   | MCP         | After restart      |

**Simple commands** work out of the box via CLI.

**Complex workflows** (multi-step transforms, iteration) use MCP for session state. Restart Claude Code once to enable MCP.

## Slash Commands

| Command              | Description                              | Method |
| -------------------- | ---------------------------------------- | ------ |
| `/floimg:qr`         | Create QR codes                          | CLI    |
| `/floimg:chart`      | Data visualizations with QuickChart      | CLI    |
| `/floimg:diagram`    | Mermaid diagrams (flowcharts, sequences) | CLI    |
| `/floimg:screenshot` | Capture webpages                         | CLI    |
| `/floimg:image`      | Generate any image with transforms       | MCP    |
| `/floimg:workflow`   | Multi-step pipelines                     | MCP    |

## Usage Examples

### AI Image Workflows (Primary Use Case)

Generate AI images and transform them in one conversation:

```
User: "Create a hero image for my tech blog"
Claude: [generates with DALL-E]

User: "Make it more vibrant"
Claude: [transforms the same image]

User: "Resize to 1200x630 and add our tagline"
Claude: [resizes, adds caption]

User: "Save to S3"
Claude: [uploads to s3://bucket/hero.png]
```

Session state enables referencing images by ID, not file paths. Each step builds on the last.

### Multi-Step Workflows

Describe the full pipeline in one request:

```
/floimg:workflow Generate product mockup, add watermark, create 3 size variants, upload to CDN
```

### Simple Generators

Quick one-shot operations work immediately via CLI:

```
/floimg:qr https://floimg.com
/floimg:chart pie chart: Desktop 60%, Mobile 30%, Tablet 10%
/floimg:diagram user login flow: user -> form -> auth -> dashboard
/floimg:screenshot https://github.com
```

## MCP Setup (For Complex Workflows)

MCP unlocks:

- **Multi-step transforms**: generate → resize → caption → save
- **Iterative refinement**: "make it bluer", "add more contrast"
- **Session state**: reference images by ID, not file paths

After installing the plugin, restart Claude Code once. The MCP server auto-configures.

Or manually add to your MCP config:

```json
{
  "mcpServers": {
    "floimg": {
      "command": "npx",
      "args": ["-y", "@teamflojo/floimg", "mcp"]
    }
  }
}
```

## Configuration

Set environment variables for optional features:

```bash
# For AI image generation (DALL-E)
export OPENAI_API_KEY=sk-...

# For cloud storage
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export S3_BUCKET=my-bucket
```

## Image Architect Agent

A specialized agent for complex image tasks:

- Choosing the right generator for each task
- Planning multi-step image workflows
- Optimizing image pipelines

## Auto-Discovery Skill

Claude automatically detects image-related tasks when you mention:

- Charts, graphs, visualizations
- Diagrams, flowcharts, sequences
- QR codes, screenshots
- Images, photos, illustrations

Just describe what you need in natural language.

## Supported Generators

| Generator     | Triggered By                 | Requires         |
| ------------- | ---------------------------- | ---------------- |
| OpenAI/DALL-E | photo, illustration, scene   | `OPENAI_API_KEY` |
| QuickChart    | chart, graph, bar, pie       | (included)       |
| Mermaid       | flowchart, diagram, sequence | (included)       |
| QR            | qr code, barcode             | (included)       |
| Screenshot    | screenshot, capture          | (included)       |

## Transform Operations

With MCP enabled, transform images:

- `resize` - Scale to specific dimensions
- `blur` - Apply Gaussian blur
- `sharpen` - Sharpen edges
- `grayscale` - Remove color
- `roundCorners` - Add border radius
- `addText` - Overlay text
- `addCaption` - Add caption bar
- `preset` - Apply filters (vintage, vibrant, dramatic, soft)

## Save Destinations

- Local: `./output/image.png`
- S3: `s3://bucket/path/image.png`
- R2: `r2://bucket/path/image.png`
- Tigris: `tigris://bucket/path/image.png`

## Requirements

- Node.js >= 18.0.0
- Claude Code >= 1.0.0

## Documentation

- **[Getting Started](https://floimg.com/docs/claude-code)** - Setup and configuration
- **[Commands](https://floimg.com/docs/claude-code/commands)** - Slash command reference
- **[Agent](https://floimg.com/docs/claude-code/agent)** - Image Architect agent
- **[Skills](https://floimg.com/docs/claude-code/skills)** - Auto-discovery behavior

## Links

- [floimg Website](https://floimg.com)
- [floimg Documentation](https://floimg.com/docs)
- [GitHub Repository](https://github.com/TeamFlojo/floimg)
- [Report Issues](https://github.com/TeamFlojo/floimg/issues)

## License

MIT
