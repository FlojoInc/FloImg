# How to Use imgflo

imgflo can be used in **three different ways**, depending on your needs:

## 1. 📚 As a Library (Programmatic)

For developers writing TypeScript/JavaScript code.

### Installation

```bash
npm install imgflo
# Install plugins you want
npm install imgflo-qr imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-screenshot
```

### Usage

```typescript
import createClient from 'imgflo';
import qr from 'imgflo-qr';
import quickchart from 'imgflo-quickchart';

// Create client
const imgflo = createClient({
  store: {
    default: 's3',
    s3: {
      bucket: 'my-bucket',
      region: 'us-east-1'
    }
  }
});

// Register plugins
imgflo.registerGenerator(qr());
imgflo.registerGenerator(quickchart());

// Generate a QR code
const qrCode = await imgflo.generate({
  generator: 'qr',
  params: {
    text: 'https://example.com',
    width: 300
  }
});

// Upload to S3
const result = await imgflo.upload({
  blob: qrCode,
  key: 'qr-codes/example.png'
});

console.log(result.url);
```

### When to use this:
- Building applications or services
- Need full programmatic control
- Integrating with existing code
- Want type safety

---

## 2. 💻 As a CLI (Command Line)

For scripts, automation, and quick tasks.

### Installation

```bash
npm install -g imgflo
# Install plugins globally
npm install -g imgflo-qr imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-screenshot
```

### Setup

```bash
# Check what's installed
imgflo plugins

# Interactive configuration
imgflo config init

# Check everything
imgflo doctor
```

### Usage

```bash
# Generate a QR code
imgflo generate --generator qr --params '{"text":"https://example.com","width":300}' --out qr.png

# Generate a chart
imgflo generate --generator quickchart --params '{"type":"bar","data":{"labels":["Q1","Q2"],"datasets":[{"data":[10,20]}]}}' --out chart.png

# Upload to S3
imgflo upload --input qr.png --key qr-codes/example.png

# Transform images
imgflo transform --input image.svg --operation convert --to image/png --out image.png
```

### Environment Variables

Set these in your environment or `.env` file:

```bash
# AWS/S3 (for upload)
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket

# OpenAI (for DALL-E generator)
OPENAI_API_KEY=sk-...
```

### When to use this:
- Quick one-off tasks
- Shell scripts and automation
- CI/CD pipelines
- Testing and debugging

---

## 3. 🤖 As an MCP Server (AI Agents)

For use with Claude Code and other AI assistants.

### Installation

```bash
# Install imgflo and plugins
npm install -g imgflo imgflo-qr imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-screenshot
```

### Setup

```bash
# Generate MCP configuration
imgflo mcp install
```

This will output JSON config like:

```json
{
  "mcpServers": {
    "imgflo": {
      "command": "node",
      "args": ["/path/to/imgflo/dist/mcp/server.js"],
      "env": {
        "OPENAI_API_KEY": "${OPENAI_API_KEY}",
        "AWS_ACCESS_KEY_ID": "${AWS_ACCESS_KEY_ID}",
        "AWS_SECRET_ACCESS_KEY": "${AWS_SECRET_ACCESS_KEY}",
        "AWS_REGION": "${AWS_REGION}",
        "S3_BUCKET": "${S3_BUCKET}"
      }
    }
  }
}
```

### Add to Claude Code

Add the config to your Claude Code MCP configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

Restart Claude Code.

### Usage with Claude

Just talk naturally! The MCP server is smart and routes to the right generator:

> **You**: "Create a QR code for https://example.com"
>
> *Claude uses imgflo MCP → auto-routes to `qr` generator*

> **You**: "Generate a bar chart showing Q1: 10, Q2: 20, Q3: 15"
>
> *Claude uses imgflo MCP → auto-routes to `quickchart` generator*

> **You**: "Take a screenshot of https://example.com"
>
> *Claude uses imgflo MCP → auto-routes to `screenshot` generator*

> **You**: "Create a flowchart: Start → Process → End"
>
> *Claude uses imgflo MCP → auto-routes to `mermaid` generator*

### How Smart Routing Works

The MCP server automatically detects intent:

| Your Request Contains... | Routes To | Description |
|-------------------------|-----------|-------------|
| "QR code", "barcode" | `qr` | QR code generation |
| "screenshot", "capture", "website" | `screenshot` | Website screenshots |
| "flowchart", "diagram", "sequence" | `mermaid` | Mermaid diagrams |
| "chart", "graph", "plot" | `quickchart` or `d3` | Charts (simple → quickchart, custom → d3) |
| "gradient", "shape", "circle" | `shapes` | Simple SVG shapes |
| prompt with AI keywords | `openai` | DALL-E generation |

### Test MCP Server

```bash
# Opens web inspector to manually test tools
imgflo mcp test
```

### When to use this:
- Working with Claude Code or AI assistants
- Want natural language interface
- Don't want to write code
- Need AI to handle complex workflows

---

## Quick Comparison

| Feature | Library | CLI | MCP |
|---------|---------|-----|-----|
| **Interface** | TypeScript/JavaScript | Command line | Natural language |
| **Use Case** | Applications | Scripts | AI workflows |
| **Setup** | `npm install` | `npm install -g` | Config file |
| **Control** | Full programmatic | Manual commands | AI-driven |
| **Best For** | Developers | Automation | AI agents |

---

## Available Generators

### Built-in (Core)

- **shapes** - Simple SVG shapes, gradients, patterns
- **openai** - DALL-E image generation (requires API key)

### Plugins (Optional)

- **quickchart** - Chart.js charts (bar, line, pie, scatter, etc.)
- **d3** - D3 data visualizations (custom, complex)
- **mermaid** - Diagrams (flowcharts, sequence, gantt, class, ER, state)
- **qr** - QR code generation
- **screenshot** - Website screenshots with Playwright

### Installation

```bash
# Install all at once
npm install imgflo-quickchart imgflo-d3 imgflo-mermaid imgflo-qr imgflo-screenshot

# Or individually as needed
npm install imgflo-qr
```

---

## Configuration

### Priority Order

imgflo looks for configuration in this order:

1. **Code** - Config passed to `createClient(config)`
2. **Local file** - `./imgflo.config.ts` or `./.imgflorc.json`
3. **Global file** - `~/.imgflo/config.json`
4. **Environment variables** - `.env` or shell environment

### Example Config Files

#### TypeScript Config (`imgflo.config.ts`)

```typescript
import type { ImgfloConfig } from 'imgflo';

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
} satisfies ImgfloConfig;
```

#### JSON Config (`.imgflorc.json`)

```json
{
  "store": {
    "default": "s3",
    "s3": {
      "bucket": "my-bucket",
      "region": "us-east-1"
    }
  }
}
```

### Interactive Setup

```bash
imgflo config init
```

---

## Security Best Practices

### ✅ DO:
- Store secrets in environment variables or `.env`
- Use `.gitignore` for `.env` files
- Use IAM roles when possible (AWS)
- Set up read-only credentials for MCP

### ❌ DON'T:
- Hardcode API keys in config files
- Commit secrets to git
- Share credentials in MCP config snippets
- Use root/admin credentials

---

## Examples

### Complete Workflow (Library)

```typescript
import createClient from 'imgflo';
import quickchart from 'imgflo-quickchart';
import qr from 'imgflo-qr';

const imgflo = createClient();
imgflo.registerGenerator(quickchart());
imgflo.registerGenerator(qr());

// Generate chart
const chart = await imgflo.generate({
  generator: 'quickchart',
  params: {
    type: 'bar',
    data: { labels: ['Q1', 'Q2'], datasets: [{ data: [10, 20] }] }
  }
});

// Upload
await imgflo.upload({ blob: chart, key: 'reports/chart.png' });

// Generate QR code
const qr = await imgflo.generate({
  generator: 'qr',
  params: { text: 'https://example.com/report' }
});

await imgflo.upload({ blob: qr, key: 'reports/qr.png' });
```

### Complete Workflow (CLI)

```bash
# Generate chart
imgflo generate \
  --generator quickchart \
  --params '{"type":"bar","data":{"labels":["Q1","Q2"],"datasets":[{"data":[10,20]}]}}' \
  --out chart.png

# Upload
imgflo upload --input chart.png --key reports/chart.png

# Generate QR
imgflo generate \
  --generator qr \
  --params '{"text":"https://example.com/report"}' \
  --out qr.png

# Upload
imgflo upload --input qr.png --key reports/qr.png
```

### Complete Workflow (MCP/AI)

Just talk to Claude:

> **You**: "Generate a bar chart for Q1: 10, Q2: 20, upload it to S3 as reports/chart.png, then create a QR code linking to the report and upload that too"

Claude handles everything automatically!

---

## Troubleshooting

### Check Installation

```bash
imgflo doctor
```

Shows:
- Version info
- Configuration status
- Environment variables
- Installed plugins
- Helpful tips

### Common Issues

**Plugins not found:**
```bash
imgflo plugins  # Check what's installed
npm install imgflo-qr  # Install missing plugins
```

**AWS credentials not working:**
```bash
# Set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
export AWS_REGION=us-east-1
export S3_BUCKET=your-bucket
```

**MCP server not connecting:**
```bash
# Test manually
imgflo mcp test

# Check Claude Code config location
imgflo mcp install
```

---

## Documentation

- **Main README**: [README.md](./README.md)
- **Monorepo Guide**: [MONOREPO.md](./MONOREPO.md)
- **Status & Roadmap**: [STATUS.md](./STATUS.md)
- **Plugin Docs**: [packages/*/README.md](./packages/)
- **MCP Guide**: [packages/imgflo/docs/guides/MCP_SERVER.md](./packages/imgflo/docs/guides/MCP_SERVER.md)

---

## Quick Start

### Library
```bash
npm install imgflo imgflo-qr
```
```typescript
import createClient from 'imgflo';
import qr from 'imgflo-qr';
const imgflo = createClient();
imgflo.registerGenerator(qr());
const image = await imgflo.generate({ generator: 'qr', params: { text: 'Hi!' } });
```

### CLI
```bash
npm install -g imgflo
imgflo plugins
imgflo config init
imgflo generate --generator shapes --params '{"type":"gradient"}' --out test.svg
```

### MCP
```bash
npm install -g imgflo imgflo-qr
imgflo mcp install
# Add to Claude Code config, restart
# Talk to Claude: "Create a QR code"
```
