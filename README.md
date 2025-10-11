# imgflo

> Image generation glue for developers and AI agents

[![npm version](https://img.shields.io/npm/v/imgflo.svg?style=flat)](https://www.npmjs.com/package/imgflo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**imgflo** is image generation glue that connects you to charts, diagrams, QR codes, screenshots, and more through a simple API. Use it from **code**, **command line**, or **AI assistants**.

## Three Ways to Use imgflo

### 1. 📚 As a Library (For Developers)

Install and use programmatically:

```bash
npm install imgflo imgflo-qr
```

```typescript
import createClient from 'imgflo';
import qr from 'imgflo-qr';

const imgflo = createClient();
imgflo.registerGenerator(qr());

const qrCode = await imgflo.generate({
  generator: 'qr',
  params: { text: 'https://example.com', width: 300 }
});

await imgflo.upload({ blob: qrCode, key: 'qr.png' });
```

**→ Use when:** Building applications, need programmatic control, want type safety

---

### 2. 💻 As a CLI (For Scripts & Automation)

Install globally and use from terminal:

```bash
npm install -g imgflo imgflo-qr imgflo-quickchart
```

```bash
# See what's available
imgflo plugins

# Generate images
imgflo generate --generator qr --params '{"text":"https://example.com"}' --out qr.png

# Check configuration
imgflo doctor
```

**→ Use when:** Writing scripts, automating tasks, CI/CD pipelines, quick one-offs

---

### 3. 🤖 As an MCP Server (For AI Agents)

Connect to Claude Code:

```bash
npm install -g imgflo imgflo-qr imgflo-quickchart imgflo-d3 imgflo-mermaid
imgflo mcp install  # Generates config
```

Add to Claude Code, then just talk naturally:

> **You:** "Create a QR code for https://example.com"
>
> **Claude:** *Uses imgflo automatically → generates QR code*

> **You:** "Generate a bar chart showing Q1: 10, Q2: 20, Q3: 15"
>
> **Claude:** *Uses imgflo automatically → generates chart*

**→ Use when:** Working with AI assistants, want natural language, no code needed

**[Full MCP Setup Guide →](./packages/imgflo/docs/guides/MCP_SERVER.md)**

---

## What Can imgflo Generate?

| Generator | Description | Example |
|-----------|-------------|---------|
| **shapes** | SVG shapes, gradients, patterns | `{type: 'gradient'}` |
| **openai** | DALL-E AI images | `{prompt: 'sunset'}` |
| **quickchart** | Chart.js charts (bar, line, pie) | `{type: 'bar', data: {...}}` |
| **d3** | Custom data visualizations | `{render: fn, data: [...]}` |
| **mermaid** | Flowcharts, diagrams | `{code: 'graph TD...'}` |
| **qr** | QR codes | `{text: 'https://...'}` |
| **screenshot** | Website captures | `{url: 'https://...'}` |

### Installation

```bash
# Core (includes shapes + openai)
npm install imgflo

# Add plugins you need
npm install imgflo-quickchart  # Charts
npm install imgflo-d3          # Custom visualizations
npm install imgflo-mermaid     # Diagrams
npm install imgflo-qr          # QR codes
npm install imgflo-screenshot  # Screenshots

# Or all at once
npm install imgflo imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-qr imgflo-screenshot
```

---

## Quick Examples

### Generate a Chart

```typescript
import createClient from 'imgflo';
import quickchart from 'imgflo-quickchart';

const imgflo = createClient();
imgflo.registerGenerator(quickchart());

const chart = await imgflo.generate({
  generator: 'quickchart',
  params: {
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Revenue',
        data: [12000, 19000, 15000, 22000]
      }]
    }
  }
});
```

### Generate a QR Code

```typescript
import qr from 'imgflo-qr';

imgflo.registerGenerator(qr());

const qrCode = await imgflo.generate({
  generator: 'qr',
  params: {
    text: 'https://example.com',
    width: 300,
    errorCorrectionLevel: 'H'
  }
});
```

### Generate a Diagram

```typescript
import mermaid from 'imgflo-mermaid';

imgflo.registerGenerator(mermaid());

const diagram = await imgflo.generate({
  generator: 'mermaid',
  params: {
    code: `
      graph TD
        A[Start] --> B[Process]
        B --> C{Decision}
        C -->|Yes| D[End]
        C -->|No| B
    `
  }
});
```

### Take a Screenshot

```typescript
import screenshot from 'imgflo-screenshot';

imgflo.registerGenerator(screenshot());

const site = await imgflo.generate({
  generator: 'screenshot',
  params: {
    url: 'https://example.com',
    width: 1920,
    height: 1080,
    fullPage: true
  }
});
```

---

## Complete Workflow

```typescript
import createClient from 'imgflo';
import quickchart from 'imgflo-quickchart';

const imgflo = createClient({
  store: {
    default: 's3',
    s3: {
      bucket: 'my-images',
      region: 'us-east-1'
    }
  }
});

imgflo.registerGenerator(quickchart());

// 1. Generate
const chart = await imgflo.generate({
  generator: 'quickchart',
  params: { type: 'bar', data: {...} }
});

// 2. Transform (optional)
const png = await imgflo.transform({
  blob: chart,
  op: 'convert',
  to: 'image/png'
});

// 3. Upload
const result = await imgflo.upload({
  blob: png,
  key: 'charts/revenue.png'
});

console.log(result.url); // https://...
```

---

## CLI Usage

```bash
# Check what's installed
imgflo plugins

# Configure storage, credentials
imgflo config init

# Generate images
imgflo generate --generator qr --params '{"text":"Hello"}' --out qr.png
imgflo generate --generator shapes --params '{"type":"gradient"}' --out bg.svg

# Transform images
imgflo transform --input bg.svg --operation convert --to image/png --out bg.png

# Upload to S3
imgflo upload --input qr.png --key images/qr.png

# Check status
imgflo doctor
```

---

## MCP Usage (AI Agents)

### Setup

```bash
# Install globally with plugins
npm install -g imgflo imgflo-qr imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-screenshot

# Generate MCP config
imgflo mcp install
```

Copy the output to your Claude Code config file (location shown in output), then restart Claude.

### Usage

Just talk naturally to Claude:

- "Create a QR code for this URL"
- "Generate a bar chart with this data"
- "Take a screenshot of example.com"
- "Create a flowchart showing the login process"

The MCP server automatically:
- Detects what you want based on your intent
- Routes to the appropriate generator
- Handles generation and returns the image

**[Full MCP Documentation →](./packages/imgflo/docs/guides/MCP_SERVER.md)**

---

## Why imgflo?

### Image Generation Glue

imgflo doesn't reinvent the wheel—it connects you to the best tools:

- **QuickChart** for Chart.js charts
- **D3** for custom visualizations
- **Mermaid** for diagrams
- **QRCode** library for QR codes
- **Playwright** for screenshots
- **OpenAI** for AI images

### Pass-Through Pattern

No abstraction layer—use native library formats:

```typescript
// Pure Chart.js configuration
await imgflo.generate({
  generator: 'quickchart',
  params: {
    type: 'bar',
    data: { /* pure Chart.js */ },
    options: { /* pure Chart.js */ }
  }
});
```

### Plugin Architecture

Only install what you need:

```bash
# Minimal: just shapes and OpenAI
npm install imgflo

# Add charts
npm install imgflo-quickchart

# Add everything
npm install imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-qr imgflo-screenshot
```

---

## Configuration

### Environment Variables

```bash
# AWS S3 (for uploads)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket

# OpenAI (for DALL-E)
OPENAI_API_KEY=sk-...
```

### Config File

Create `imgflo.config.ts` or `.imgflorc.json`:

```typescript
export default {
  store: {
    default: 's3',
    s3: {
      bucket: process.env.S3_BUCKET,
      region: 'us-east-1'
    }
  },
  ai: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  }
};
```

Or use the interactive setup:

```bash
imgflo config init
```

---

## Packages

| Package | Description | Install |
|---------|-------------|---------|
| **imgflo** | Core library (shapes, OpenAI) | `npm install imgflo` |
| **imgflo-quickchart** | Chart.js charts | `npm install imgflo-quickchart` |
| **imgflo-d3** | D3 data visualizations | `npm install imgflo-d3` |
| **imgflo-mermaid** | Mermaid diagrams | `npm install imgflo-mermaid` |
| **imgflo-qr** | QR code generation | `npm install imgflo-qr` |
| **imgflo-screenshot** | Website screenshots | `npm install imgflo-screenshot` |

**[View all plugin docs →](./packages/)**

---

## Documentation

- **[Complete Usage Guide](./docs/USAGE.md)** - All three usage patterns explained
- **[Quick Start](./packages/imgflo/docs/guides/QUICK_START.md)** - Get started fast
- **[MCP Server Guide](./packages/imgflo/docs/guides/MCP_SERVER.md)** - Claude Code integration
- **[Configuration](./packages/imgflo/docs/guides/CONFIGURATION.md)** - Setup and config
- **[S3 Providers](./packages/imgflo/docs/guides/S3_PROVIDERS.md)** - Cloud storage
- **[Architecture](./docs/development/GENERATOR_STRATEGY.md)** - How imgflo works
- **[Monorepo Guide](./MONOREPO.md)** - Contributing and development

---

## Features

### Current

- ✅ **Charts** - QuickChart (Chart.js) and D3
- ✅ **Diagrams** - Mermaid (flowcharts, sequence, gantt, etc.)
- ✅ **QR Codes** - Full qrcode library support
- ✅ **Screenshots** - Playwright browser automation
- ✅ **AI Images** - OpenAI DALL-E 2 & 3
- ✅ **Shapes** - SVG gradients, circles, rectangles, patterns
- ✅ **Transform** - Convert SVG → PNG/JPEG/WebP/AVIF
- ✅ **Upload** - S3, R2, Tigris, filesystem
- ✅ **CLI** - Complete command-line interface
- ✅ **MCP** - Claude Code integration
- ✅ **TypeScript** - Full type safety

### Roadmap

- 🔄 **Satori** - HTML/React to image
- 🔄 **Vega** - Grammar of graphics
- 🔄 **Additional storage** - GCS, Azure Blob

---

## Philosophy

**imgflo is glue, not the engine.**

We orchestrate existing libraries rather than reimplementing them:

1. **Pass-Through Pattern** - Accept native library formats
2. **Minimal Abstraction** - Thin wrappers around existing tools
3. **Opt-In Complexity** - Install only what you need
4. **Full Capabilities** - Never neuter underlying libraries

**[Read the full strategy →](./docs/development/GENERATOR_STRATEGY.md)**

---

## Monorepo Structure

```
imgflo/
├── packages/
│   ├── imgflo/              # Core library
│   ├── imgflo-quickchart/   # Chart.js charts
│   ├── imgflo-d3/           # D3 visualizations
│   ├── imgflo-mermaid/      # Mermaid diagrams
│   ├── imgflo-qr/           # QR codes
│   └── imgflo-screenshot/   # Screenshots
├── docs/                     # Shared documentation
└── examples/                 # Example code
```

---

## Development

```bash
# Install pnpm
npm install -g pnpm

# Install dependencies
pnpm install

# Build all packages
pnpm -r build

# Run tests
pnpm -r test

# Dev mode (watch)
pnpm -r dev
```

---

## Contributing

We welcome contributions! Areas we'd love help with:

- More generators (Satori, Vega, PlantUML)
- Additional storage backends
- Tests and documentation
- Performance improvements

**[Development Guide →](./MONOREPO.md)**

---

## License

MIT © Brett Cooke

---

## Credits

Built with amazing open source tools:

- [Sharp](https://sharp.pixelplumbing.com/) & [Resvg](https://github.com/RazrFalcon/resvg) - Image processing
- [Chart.js](https://www.chartjs.org/) & [QuickChart](https://quickchart.io) - Charts
- [D3](https://d3js.org/) - Data visualizations
- [Mermaid](https://mermaid.js.org/) - Diagrams
- [QRCode](https://github.com/soldair/node-qrcode) - QR generation
- [Playwright](https://playwright.dev) - Browser automation
- [OpenAI](https://openai.com/) - AI images
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - S3 uploads
- [MCP](https://modelcontextprotocol.io) - AI integration

---

**Made for developers and AI agents who need powerful image workflows without the complexity.**
