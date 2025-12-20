# floimg

> Universal image workflow engine for developers and AI agents

[![npm version](https://img.shields.io/npm/v/@teamflojo/floimg.svg?style=flat)](https://www.npmjs.com/package/@teamflojo/floimg)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**floimg** provides three core operations—generate, transform, save—that work consistently across JavaScript, CLI, YAML, and MCP.

## The Problem

**LLMs are non-deterministic.** Great for creativity, terrible for "resize to exactly 800x600."

**Image libraries are fragmented.** Charts need Chart.js. Diagrams need Mermaid. QR codes need node-qrcode. Each has different APIs with no way to chain them.

**floimg solves both.** Deterministic execution with a unified abstraction. LLMs handle natural language; floimg handles precise execution.

> **[Why floimg Exists →](./vault/Why-floimg-Exists.md)**

## Install

```bash
npm install @teamflojo/floimg

# Add plugins you need
npm install @teamflojo/floimg-quickchart @teamflojo/floimg-mermaid @teamflojo/floimg-qr @teamflojo/floimg-screenshot
```

## Quick Start

```typescript
import createClient from '@teamflojo/floimg';
import qr from '@teamflojo/floimg-qr';

const floimg = createClient();
floimg.registerGenerator(qr());

// Generate → Transform → Save
const qrCode = await floimg.generate({
  generator: 'qr',
  params: { text: 'https://example.com' }
});

await floimg.save(qrCode, './qr.png');
// Or: await floimg.save(qrCode, 's3://bucket/qr.png');
```

## Three Interfaces

### 📚 Library

```typescript
const chart = await floimg.generate({ generator: 'quickchart', params: {...} });
const resized = await floimg.transform({ blob: chart, op: 'resize', params: { width: 800 } });
await floimg.save(resized, 's3://bucket/chart.png');
```

### 💻 CLI

```bash
floimg generate --generator qr --params '{"text":"https://example.com"}' --out qr.png
floimg transform --input image.png --operation resize --params '{"width":800}' --out resized.png
floimg save --in resized.png --out s3://bucket/image.png
```

### 🤖 MCP (AI Agents)

```bash
floimg mcp install  # Generates Claude Code config
```

Then just talk to Claude: *"Create a QR code for example.com"*

## Packages

### Core

| Package | Description | npm |
|---------|-------------|-----|
| [`@teamflojo/floimg`](https://www.npmjs.com/package/@teamflojo/floimg) | Core engine, CLI, MCP server | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg.svg)](https://www.npmjs.com/package/@teamflojo/floimg) |

### Plugins

| Package | Description | npm |
|---------|-------------|-----|
| [`@teamflojo/floimg-quickchart`](https://www.npmjs.com/package/@teamflojo/floimg-quickchart) | Chart.js charts via QuickChart | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-quickchart.svg)](https://www.npmjs.com/package/@teamflojo/floimg-quickchart) |
| [`@teamflojo/floimg-d3`](https://www.npmjs.com/package/@teamflojo/floimg-d3) | D3 data visualizations | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-d3.svg)](https://www.npmjs.com/package/@teamflojo/floimg-d3) |
| [`@teamflojo/floimg-mermaid`](https://www.npmjs.com/package/@teamflojo/floimg-mermaid) | Mermaid diagrams | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-mermaid.svg)](https://www.npmjs.com/package/@teamflojo/floimg-mermaid) |
| [`@teamflojo/floimg-qr`](https://www.npmjs.com/package/@teamflojo/floimg-qr) | QR code generation | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-qr.svg)](https://www.npmjs.com/package/@teamflojo/floimg-qr) |
| [`@teamflojo/floimg-screenshot`](https://www.npmjs.com/package/@teamflojo/floimg-screenshot) | Website screenshots via Playwright | [![npm](https://img.shields.io/npm/v/@teamflojo/floimg-screenshot.svg)](https://www.npmjs.com/package/@teamflojo/floimg-screenshot) |

## Documentation

- **[Why floimg Exists](./vault/Why-floimg-Exists.md)** - The problem and solution
- **[Design Principles](./vault/Design-Principles.md)** - Philosophy
- **[Configuration](./vault/architecture/Configuration.md)** - Setup options
- **[Generator Strategy](./vault/architecture/Generator-Strategy.md)** - How generators work
- **[MCP Architecture](./vault/architecture/MCP-Server-Architecture.md)** - Claude integration
- **[Monorepo Guide](./vault/architecture/Monorepo-Guide.md)** - Development

## Development

```bash
pnpm install && pnpm -r build && pnpm -r test
```

## Contributing

We welcome contributions—more generators, storage backends, tests, docs.

**[Development Guide →](./vault/architecture/Monorepo-Guide.md)**

## License

MIT - Maintained by [Flojo, Inc](https://flojo.io)
