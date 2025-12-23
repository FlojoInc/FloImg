# floimg

> Universal image workflow engine for developers and AI agents

[![npm version](https://img.shields.io/npm/v/@teamflojo/floimg.svg?style=flat)](https://www.npmjs.com/package/@teamflojo/floimg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**floimg** provides three core operations—generate, transform, save—that work consistently across JavaScript, CLI, YAML, and MCP.

## Why floimg?

| Challenge                             | Solution                                    |
| ------------------------------------- | ------------------------------------------- |
| **LLMs are non-deterministic**        | Deterministic execution for precise results |
| **Image libraries are fragmented**    | Unified API across all generators           |
| **AI agents need image capabilities** | MCP integration + Claude Code plugin        |

Generate AI images with DALL-E, create charts with Chart.js, build diagrams with Mermaid, and chain them all together in pipelines—through one consistent interface.

> **[Full Documentation →](https://floimg.com/docs)**

## Features

- **AI Image Generation** - DALL-E and other AI models via unified API
- **Data Visualization** - Charts, graphs, and diagrams
- **Image Processing** - Resize, crop, watermark, filters
- **Pipeline Engine** - Chain operations into reusable workflows
- **Multi-Interface** - SDK, CLI, YAML, and MCP
- **Claude Code Ready** - Native plugin for AI-assisted workflows

## Try It Now (No Install Required)

```bash
# Generate a QR code
npx @teamflojo/floimg qr "https://floimg.com" -o qr.png

# Create a bar chart
npx @teamflojo/floimg chart bar --labels "Q1,Q2,Q3,Q4" --values "10,20,30,40" -o chart.png

# Resize an image
npx @teamflojo/floimg resize photo.jpg 800x600 -o thumbnail.jpg

# Convert format
npx @teamflojo/floimg convert image.png -o image.webp

# Interactive mode - see all options
npx @teamflojo/floimg
```

Plugins auto-install on first use. [See all CLI commands →](https://floimg.com/docs/cli)

## Claude Code Integration

Use floimg directly from Claude Code with the **floimg-claude** plugin:

```bash
npm install -g @teamflojo/floimg-claude
```

Then just talk to Claude:

- _"Create a bar chart showing quarterly revenue"_
- _"Generate a QR code for my website"_
- _"Take a screenshot of github.com"_
- _"Resize this image to 800x600 and add a watermark"_

The plugin includes slash commands, an Image Architect agent, and auto-discovery for image tasks.

> **[Claude Code Documentation →](https://floimg.com/docs/claude-code)**

## Install

```bash
npm install @teamflojo/floimg

# Add generators you need
npm install @teamflojo/floimg-quickchart  # Charts
npm install @teamflojo/floimg-mermaid     # Diagrams
npm install @teamflojo/floimg-qr          # QR codes
npm install @teamflojo/floimg-openai      # AI images (DALL-E)
npm install @teamflojo/floimg-screenshot  # Screenshots
```

## Quick Start

```typescript
import createClient from "@teamflojo/floimg";
import quickchart from "@teamflojo/floimg-quickchart";

const floimg = createClient();
floimg.registerGenerator(quickchart());

// Generate → Transform → Save
const chart = await floimg.generate({
  generator: "quickchart",
  params: {
    type: "bar",
    data: {
      labels: ["Q1", "Q2", "Q3", "Q4"],
      datasets: [{ label: "Revenue", data: [12, 19, 8, 15] }],
    },
  },
});

const resized = await floimg.transform({
  blob: chart,
  op: "resize",
  params: { width: 800 },
});

await floimg.save(resized, "./chart.png");
// Or: await floimg.save(resized, 's3://bucket/chart.png');
```

## Three Interfaces

### SDK (TypeScript/JavaScript)

```typescript
const chart = await floimg.generate({ generator: 'quickchart', params: {...} });
const resized = await floimg.transform({ blob: chart, op: 'resize', params: { width: 800 } });
await floimg.save(resized, 's3://bucket/chart.png');
```

### CLI

```bash
floimg qr "https://example.com" -o qr.png
floimg chart bar --labels "A,B,C" --values "10,20,30" -o chart.png
floimg resize image.png 800x600 -o resized.png
```

### MCP (AI Agents)

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

Then talk to Claude: _"Create a QR code for example.com"_

## Packages

### Core

| Package                                                                              | Description                  | npm                                                                                                                         |
| ------------------------------------------------------------------------------------ | ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| [`@teamflojo/floimg`](https://www.npmjs.com/package/@teamflojo/floimg)               | Core engine, CLI, MCP server | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg.svg)](https://www.npmjs.com/package/@teamflojo/floimg)               |
| [`@teamflojo/floimg-claude`](https://www.npmjs.com/package/@teamflojo/floimg-claude) | Claude Code plugin           | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-claude.svg)](https://www.npmjs.com/package/@teamflojo/floimg-claude) |

### Generators

| Package                                                                                      | Description            | npm                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`@teamflojo/floimg-openai`](https://www.npmjs.com/package/@teamflojo/floimg-openai)         | AI images via DALL-E   | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-openai.svg)](https://www.npmjs.com/package/@teamflojo/floimg-openai)         |
| [`@teamflojo/floimg-quickchart`](https://www.npmjs.com/package/@teamflojo/floimg-quickchart) | Chart.js charts        | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-quickchart.svg)](https://www.npmjs.com/package/@teamflojo/floimg-quickchart) |
| [`@teamflojo/floimg-d3`](https://www.npmjs.com/package/@teamflojo/floimg-d3)                 | D3 visualizations      | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-d3.svg)](https://www.npmjs.com/package/@teamflojo/floimg-d3)                 |
| [`@teamflojo/floimg-mermaid`](https://www.npmjs.com/package/@teamflojo/floimg-mermaid)       | Mermaid diagrams       | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-mermaid.svg)](https://www.npmjs.com/package/@teamflojo/floimg-mermaid)       |
| [`@teamflojo/floimg-qr`](https://www.npmjs.com/package/@teamflojo/floimg-qr)                 | QR codes               | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-qr.svg)](https://www.npmjs.com/package/@teamflojo/floimg-qr)                 |
| [`@teamflojo/floimg-screenshot`](https://www.npmjs.com/package/@teamflojo/floimg-screenshot) | Playwright screenshots | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-screenshot.svg)](https://www.npmjs.com/package/@teamflojo/floimg-screenshot) |

## FloImg Studio

FloImg Studio is a visual workflow builder for floimg. Create image processing pipelines with a drag-and-drop interface.

### Self-Host

```bash
git clone https://github.com/teamflojo/floimg.git
cd floimg/apps/studio
pnpm install && pnpm build && pnpm start
```

See [DEPLOYMENT.md](apps/studio/DEPLOYMENT.md) for Docker and configuration options.

### Hosted Version

A hosted version is available at [studio.floimg.com](https://studio.floimg.com) with authentication, usage tracking, and managed infrastructure.

## Documentation

- **[Getting Started](https://floimg.com/docs/getting-started/quick-start)** - Installation and first steps
- **[SDK Reference](https://floimg.com/docs/sdk/generate)** - TypeScript/JavaScript API
- **[CLI Reference](https://floimg.com/docs/cli)** - Command-line usage
- **[Claude Code](https://floimg.com/docs/claude-code)** - AI agent integration
- **[Plugins](https://floimg.com/docs/plugins/quickchart)** - Generator documentation

## Contributing

We welcome contributions—generators, storage backends, tests, docs.

```bash
pnpm install && pnpm -r build && pnpm -r test
```

See the [Contributing Guide](https://floimg.com/docs/getting-started/concepts) for details.

## License

MIT - Maintained by [Flojo, Inc](https://flojo.io)
