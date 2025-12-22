# @teamflojo/floimg-claude

Claude Code plugin for [floimg](https://floimg.com) - Universal image generation and workflows.

Generate charts, diagrams, QR codes, screenshots, and AI images directly from Claude Code.

> **[Full Documentation →](https://floimg.com/docs/claude-code)**

## Features

### Slash Commands

| Command                     | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| `/floimg-claude:image`      | Generate any image (AI, chart, diagram, QR, screenshot) |
| `/floimg-claude:chart`      | Create data visualizations with QuickChart              |
| `/floimg-claude:diagram`    | Generate Mermaid diagrams (flowcharts, sequences, etc.) |
| `/floimg-claude:qr`         | Create QR codes                                         |
| `/floimg-claude:screenshot` | Capture webpages with Playwright                        |
| `/floimg-claude:workflow`   | Execute multi-step image pipelines                      |

> **[Command Reference →](https://floimg.com/docs/claude-code/commands)**

### Image Architect Agent

A specialized agent for complex image tasks. Expert in:

- Choosing the right generator for each task
- Planning multi-step image workflows
- Optimizing image pipelines

> **[Agent Documentation →](https://floimg.com/docs/claude-code/agent)**

### Auto-Discovery Skill

Claude automatically detects image-related tasks and uses floimg when you mention:

- Charts, graphs, visualizations
- Diagrams, flowcharts, sequences
- QR codes
- Screenshots, captures
- Images, photos, illustrations

> **[Skills Documentation →](https://floimg.com/docs/claude-code/skills)**

## Quick Start

### Option 1: MCP Server (Recommended)

Add to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "floimg": {
      "command": "npx",
      "args": ["-y", "@teamflojo/floimg-claude"]
    }
  }
}
```

### Option 2: Global Install

```bash
npm install -g @teamflojo/floimg-claude

# Install generators you need
npm install -g @teamflojo/floimg-quickchart   # Charts
npm install -g @teamflojo/floimg-mermaid      # Diagrams
npm install -g @teamflojo/floimg-qr           # QR codes
npm install -g @teamflojo/floimg-screenshot   # Screenshots
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

## Usage Examples

### Quick Chart

```
/floimg-claude:chart bar chart showing Q1: $100K, Q2: $150K, Q3: $175K, Q4: $200K
```

### Architecture Diagram

```
/floimg-claude:diagram microservices architecture: frontend -> API gateway -> auth, users, orders services
```

### QR Code

```
/floimg-claude:qr https://floimg.com
```

### Screenshot

```
/floimg-claude:screenshot https://github.com full page
```

### Multi-Step Workflow

```
/floimg-claude:workflow Create a hero image, resize to 1200x630, add caption, save to S3
```

### Natural Language (Auto-Discovery)

Just describe what you need:

```
I need a data visualization dashboard with:
- A bar chart of monthly sales
- A pie chart of product categories
- All charts should be 800x600 and saved to ./charts/
```

## Supported Generators

| Generator     | Triggered By                 | Requires                       |
| ------------- | ---------------------------- | ------------------------------ |
| OpenAI/DALL-E | photo, illustration, scene   | `OPENAI_API_KEY`               |
| QuickChart    | chart, graph, bar, pie       | `@teamflojo/floimg-quickchart` |
| Mermaid       | flowchart, diagram, sequence | `@teamflojo/floimg-mermaid`    |
| QR            | qr code, barcode             | `@teamflojo/floimg-qr`         |
| Screenshot    | screenshot, capture          | `@teamflojo/floimg-screenshot` |

## Transform Operations

After generating, transform images with:

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
- **[Examples](https://floimg.com/docs/mcp/examples)** - Usage examples

## Links

- [floimg Website](https://floimg.com)
- [floimg Documentation](https://floimg.com/docs)
- [GitHub Repository](https://github.com/TeamFlojo/floimg)
- [Report Issues](https://github.com/TeamFlojo/floimg/issues)

## License

MIT
