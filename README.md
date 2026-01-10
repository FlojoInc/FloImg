# FloImg

> Composable image workflow engine — any source, any transforms, any destination

[![npm version](https://img.shields.io/npm/v/@teamflojo/floimg.svg?style=flat)](https://www.npmjs.com/package/@teamflojo/floimg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white)](https://discord.gg/ahb9FSGUzb)

**FloImg** unifies image generation, transformation, and delivery into composable pipelines. Whether you're generating AI images, resizing for social media, or building complex multi-step workflows, FloImg handles it through one consistent interface.

## Why FloImg?

### Deterministic Transforms

When you ask ChatGPT to modify an image, DALL-E generates a new image—it doesn't edit pixels. Even AI "editing" like inpainting is probabilistic. "Change the colors" might give you a completely different composition. FloImg applies deterministic transforms: adjust hue mathematically, resize to exact dimensions, add caption at precise position. The image stays intact except for exactly what you requested.

### A Unified API

FloImg models image manipulation as a series of composable steps—each transform takes an image and returns an image. This functional approach consolidates the patchwork of tools and SDKs into one abstraction layer.

The same workflow definition is portable across interfaces:

- **SDK**: Embed in any JS/TS application
- **CLI**: Terminal workflows and CI/CD pipelines
- **Visual builder**: Prototyping and non-technical users
- **MCP**: AI agents and LLM-driven automation

| Workflow Type         | Example                                                           |
| --------------------- | ----------------------------------------------------------------- |
| **AI + Professional** | Generate with DALL-E → resize for OG → add caption → upload to S3 |
| **Purely Creative**   | AI generate → AI refine → AI variations                           |
| **Purely Practical**  | Chart → resize → format convert → CDN                             |

> **[Full Documentation →](https://floimg.com/docs)**

## Features

- **AI Image Generation** - DALL-E and other AI models via unified API
- **Data Visualization** - Charts, graphs, and diagrams
- **Image Processing** - Resize, crop, watermark, filters
- **Pipeline Engine** - Chain operations into reusable workflows
- **Multi-Interface** - SDK, CLI, YAML, and MCP
- **Claude Code Ready** - Native plugin for AI-assisted workflows

## Try It Instantly

```bash
# Resize and convert for social media
npx @teamflojo/floimg resize hero.png 1200x630 -o og-image.png
npx @teamflojo/floimg convert image.png -o image.webp

# Add captions or watermarks
npx @teamflojo/floimg caption image.png "© 2025 Acme Inc" -o watermarked.png

# Generate charts, diagrams, QR codes
npx @teamflojo/floimg chart bar --labels "Q1,Q2,Q3,Q4" --values "10,20,30,40" -o chart.png
npx @teamflojo/floimg qr "https://floimg.com" -o qr.png

# Interactive mode - see all options
npx @teamflojo/floimg
```

[See all CLI commands →](https://floimg.com/docs/cli)

## Claude Code Integration

Use FloImg directly from Claude Code with the **floimg-claude** plugin:

```bash
npm install -g @teamflojo/floimg-claude
```

Then just talk to Claude:

- _"Create a hero image for my blog, resize to 1200x630, and add a caption"_
- _"Generate a product mockup with a subtle watermark"_
- _"Resize this image to 800x600 and upload to S3"_
- _"Create a bar chart of quarterly revenue"_

The plugin includes slash commands, an Image Architect agent, and auto-discovery for image tasks.

> **[Claude Code Documentation →](https://floimg.com/docs/claude-code)**

## Install

```bash
npm install @teamflojo/floimg

# Add generators you need
npm install @teamflojo/floimg-quickchart  # Charts
npm install @teamflojo/floimg-mermaid     # Diagrams
npm install @teamflojo/floimg-qr          # QR codes
npm install @teamflojo/floimg-openai      # DALL-E + GPT-4 Vision
npm install @teamflojo/floimg-stability   # Stability AI (SDXL, SD3) + AI transforms
npm install @teamflojo/floimg-google      # Google Imagen
npm install @teamflojo/floimg-ollama      # Ollama local AI
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

## Fluent API

Chain operations with a clean, fluent syntax:

```typescript
import { floimg } from "@teamflojo/floimg";

// Load → Transform → Save
await floimg
  .from("./input.png")
  .transform("resize", { width: 800 })
  .transform("blur", { sigma: 2 })
  .to("./output.png");

// Generate → Transform → Save to cloud
await floimg
  .generate("openai", { prompt: "A sunset over mountains" })
  .transform("resize", { width: 1920 })
  .to("s3://bucket/sunset.png");

// Get the final image as a blob
const blob = await floimg
  .from("./photo.jpg")
  .transform("resize", { width: 400 })
  .transform("convert", { to: "webp" })
  .toBlob();
```

The fluent API builds pipelines internally and executes them efficiently. For custom configurations, create your own client:

```typescript
import createClient, { createFluent } from "@teamflojo/floimg";
import openai from "@teamflojo/floimg-openai";

const client = createClient();
client.registerGenerator(openai({ apiKey: process.env.OPENAI_API_KEY }));

const myFloimg = createFluent(client);

await myFloimg
  .generate("openai", { prompt: "A forest" })
  .transform("resize", { width: 1200 })
  .to("./forest.png");
```

## Three Interfaces

### SDK (TypeScript/JavaScript)

```typescript
// Fluent API (recommended for chained operations)
await floimg.from('./input.png').transform('resize', { width: 800 }).to('./output.png');

// Imperative API (for fine-grained control)
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

| Package                                                                                      | Description                      | npm                                                                                                                                 |
| -------------------------------------------------------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| [`@teamflojo/floimg-openai`](https://www.npmjs.com/package/@teamflojo/floimg-openai)         | DALL-E image generation + vision | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-openai.svg)](https://www.npmjs.com/package/@teamflojo/floimg-openai)         |
| [`@teamflojo/floimg-stability`](https://www.npmjs.com/package/@teamflojo/floimg-stability)   | Stability AI (SDXL, SD3)         | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-stability.svg)](https://www.npmjs.com/package/@teamflojo/floimg-stability)   |
| [`@teamflojo/floimg-google`](https://www.npmjs.com/package/@teamflojo/floimg-google)         | Google Imagen                    | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-google.svg)](https://www.npmjs.com/package/@teamflojo/floimg-google)         |
| [`@teamflojo/floimg-replicate`](https://www.npmjs.com/package/@teamflojo/floimg-replicate)   | Replicate models (FLUX, GFPGAN)  | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-replicate.svg)](https://www.npmjs.com/package/@teamflojo/floimg-replicate)   |
| [`@teamflojo/floimg-ollama`](https://www.npmjs.com/package/@teamflojo/floimg-ollama)         | Ollama local AI (LLaVA, Llama)   | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-ollama.svg)](https://www.npmjs.com/package/@teamflojo/floimg-ollama)         |
| [`@teamflojo/floimg-quickchart`](https://www.npmjs.com/package/@teamflojo/floimg-quickchart) | Chart.js charts                  | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-quickchart.svg)](https://www.npmjs.com/package/@teamflojo/floimg-quickchart) |
| [`@teamflojo/floimg-d3`](https://www.npmjs.com/package/@teamflojo/floimg-d3)                 | D3 visualizations                | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-d3.svg)](https://www.npmjs.com/package/@teamflojo/floimg-d3)                 |
| [`@teamflojo/floimg-mermaid`](https://www.npmjs.com/package/@teamflojo/floimg-mermaid)       | Mermaid diagrams                 | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-mermaid.svg)](https://www.npmjs.com/package/@teamflojo/floimg-mermaid)       |
| [`@teamflojo/floimg-qr`](https://www.npmjs.com/package/@teamflojo/floimg-qr)                 | QR codes                         | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-qr.svg)](https://www.npmjs.com/package/@teamflojo/floimg-qr)                 |
| [`@teamflojo/floimg-screenshot`](https://www.npmjs.com/package/@teamflojo/floimg-screenshot) | Playwright screenshots           | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-screenshot.svg)](https://www.npmjs.com/package/@teamflojo/floimg-screenshot) |

### AI Transform Providers

In addition to generation, these packages provide AI-powered image transformations:

| Package                       | Transforms                                            |
| ----------------------------- | ----------------------------------------------------- |
| `@teamflojo/floimg-openai`    | edit (inpaint), variations                            |
| `@teamflojo/floimg-stability` | removeBackground, upscale, searchAndReplace, outpaint |
| `@teamflojo/floimg-replicate` | faceRestore, colorize, realEsrgan, fluxEdit           |

```typescript
// Example: Remove background with Stability AI
const noBg = await floimg.transform({
  blob: image,
  op: "removeBackground",
  provider: "stability-transform",
});

// Example: Restore faces with Replicate
const restored = await floimg.transform({
  blob: image,
  op: "faceRestore",
  provider: "replicate-transform",
});
```

### FloImg Studio

| Package                                                                                            | Description                | npm                                                                                                                                       |
| -------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`@teamflojo/floimg-studio-ui`](https://www.npmjs.com/package/@teamflojo/floimg-studio-ui)         | Visual editor components   | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-studio-ui.svg)](https://www.npmjs.com/package/@teamflojo/floimg-studio-ui)         |
| [`@teamflojo/floimg-studio-shared`](https://www.npmjs.com/package/@teamflojo/floimg-studio-shared) | Shared types and utilities | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-studio-shared.svg)](https://www.npmjs.com/package/@teamflojo/floimg-studio-shared) |

## FloImg Studio

FloImg Studio is a visual workflow builder for FloImg. Design image pipelines with a drag-and-drop interface.

### Self-Host

```bash
docker run -d -p 5100:5100 -e OPENAI_API_KEY=sk-... ghcr.io/teamflojo/floimg-studio
```

Access at `http://localhost:5100`. See [apps/studio/DEPLOYMENT.md](./apps/studio/DEPLOYMENT.md) for more options.

### Hosted Version

A hosted version with cloud features is available at [studio.floimg.com](https://studio.floimg.com).

## Documentation

- **[Getting Started](https://floimg.com/docs/getting-started/quick-start)** - Installation and first steps
- **[SDK Reference](https://floimg.com/docs/sdk/generate)** - TypeScript/JavaScript API
- **[CLI Reference](https://floimg.com/docs/cli)** - Command-line usage
- **[Claude Code](https://floimg.com/docs/claude-code)** - AI agent integration
- **[Plugins](https://floimg.com/docs/plugins/quickchart)** - Generator documentation

## Safety & Content Moderation

FloImg Studio includes built-in content moderation to prevent harmful content:

- **Scan Before Save** - All generated images pass through moderation before storage
- **11 Categories** - Violence, hate, harassment, self-harm, sexual content, and more
- **Powered by OpenAI** - Industry-standard moderation API
- **Configurable** - Self-hosted users can disable or customize

Learn more at [floimg.com/safety](https://floimg.com/safety).

## Repository Structure

This is a **monorepo** containing multiple npm packages:

```
packages/
├── floimg/           # Core engine, CLI, MCP server (@teamflojo/floimg)
├── floimg-openai/    # DALL-E + GPT-4 Vision plugin
├── floimg-stability/ # Stability AI plugin
├── floimg-*/         # Other generator/transform plugins
└── floimg-claude/    # Claude Code plugin

apps/
└── studio/           # FloImg Studio visual workflow builder
    ├── frontend/     # React UI (@teamflojo/floimg-studio-ui)
    ├── backend/      # Fastify API server
    └── shared/       # Shared types (@teamflojo/floimg-studio-shared)
```

Each package in `packages/` is published to npm under `@teamflojo/*`. See the [Monorepo Guide](./vault/architecture/Monorepo-Guide.md) for development setup and creating new plugins.

## For Developers

### Quick Setup

```bash
# Verify prerequisites (Node 22+, pnpm 9+)
pnpm verify-setup

# Install and build
pnpm install
pnpm -r build
pnpm -r test
```

### Architecture Docs

- [Monorepo Guide](./vault/architecture/Monorepo-Guide.md) - Project structure and development
- [Plugin Architecture](./vault/architecture/Plugin-Architecture.md) - Creating generators and transforms
- [Development Setup](./vault/community/Development-Setup.md) - Local environment configuration

### Community

- [Contributing Guide](./vault/community/Contributing.md) - How to contribute
- [Code of Conduct](./CODE_OF_CONDUCT.md) - Community standards
- [Security Policy](./SECURITY.md) - Reporting vulnerabilities

## Contributing

We welcome contributions—generators, storage backends, tests, docs.

```bash
pnpm install && pnpm -r build && pnpm -r test
```

See the [Contributing Guide](./vault/community/Contributing.md) for details.

**Join our community:**

- [Discord](https://discord.gg/ahb9FSGUzb) - Chat with the community
- [GitHub Discussions](https://github.com/TeamFlojo/floimg/discussions) - Ask questions, share ideas

## Contributors

<a href="https://github.com/teamflojo/floimg/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=teamflojo/floimg" />
</a>

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=teamflojo/floimg&type=Date)](https://star-history.com/#teamflojo/floimg&Date)

## License

MIT - Maintained by [Flojo, Inc](https://flojo.io)
