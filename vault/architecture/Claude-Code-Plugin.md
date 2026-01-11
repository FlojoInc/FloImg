# Claude Code Plugin

## Overview

The `@teamflojo/floimg-claude` package provides a Claude Code plugin for floimg. It includes slash commands, an Image Architect agent, and auto-discovery skills that enable AI-assisted image workflows.

The plugin namespace is `/floimg:` - commands are invoked as `/floimg:image`, `/floimg:chart`, etc.

## Architecture: CLI Simple, MCP Complex

The plugin uses a hybrid architecture to balance immediate usability with powerful features:

| Command Type                                                                    | Method      | Works Immediately? |
| ------------------------------------------------------------------------------- | ----------- | ------------------ |
| Simple (`/floimg:qr`, `/floimg:chart`, `/floimg:diagram`, `/floimg:screenshot`) | CLI via npx | Yes                |
| Complex (`/floimg:image`, `/floimg:workflow`)                                   | MCP         | After restart      |

**Why this split?**

- **Simple commands** are one-shot operations. CLI via `npx` works out of the box with zero configuration.
- **Complex commands** benefit from MCP's session state for iterative refinement ("make it bluer"), multi-step transforms, and referencing previous images by ID.

Claude Code limitation: Plugin MCP servers require a restart to initialize. This is why simple commands use CLI instead.

## Installation

```bash
npm install -g @teamflojo/floimg-claude
```

**That's it.** Simple commands work immediately.

For complex workflows (multi-step transforms, iteration), restart Claude Code once to enable the MCP server.

### Development/Testing

Load the plugin directly without installing:

```bash
claude --plugin-dir /path/to/floimg/packages/floimg-claude
```

## Commands

| Command              | Description                              | Method |
| -------------------- | ---------------------------------------- | ------ |
| `/floimg:qr`         | Create QR codes                          | CLI    |
| `/floimg:chart`      | Data visualizations with QuickChart      | CLI    |
| `/floimg:diagram`    | Mermaid diagrams (flowcharts, sequences) | CLI    |
| `/floimg:screenshot` | Capture webpages                         | CLI    |
| `/floimg:image`      | Generate any image with transforms       | MCP    |
| `/floimg:workflow`   | Multi-step pipelines                     | MCP    |

### Simple Commands (CLI)

These run immediately via `npx -y @teamflojo/floimg`:

```
/floimg:qr https://floimg.com
/floimg:chart pie chart: Desktop 60%, Mobile 30%, Tablet 10%
/floimg:diagram user login flow: user -> form -> auth -> dashboard
/floimg:screenshot https://github.com
```

### Complex Commands (MCP)

After restart, these enable powerful workflows:

```
/floimg:workflow Create a hero image, resize to 1200x630, add caption, save to S3
```

Or iterate naturally:

```
User: "Create a hero image for my tech blog"
Claude: [generates image]

User: "Make it more vibrant"
Claude: [transforms the same image]

User: "Add our tagline at the bottom"
Claude: [adds caption]
```

Session state enables referencing previous images without file paths.

## Why MCP for Complex Commands

MCP provides capabilities that CLI cannot:

1. **Session state**: Reference images by ID (`img_001`) across operations
2. **Iteration**: "Make it bluer" transforms the existing result
3. **Natural language**: Describe complex transforms, let floimg plan the API calls
4. **Chaining**: Generate → resize → caption → save in one conversation

For simple one-shot generation, CLI is faster and requires no setup.

## Image Architect Agent

A specialized agent for complex image tasks. Invoke with `@image-architect` or let Claude discover it automatically.

Capabilities:

- Choosing the optimal generator for each task
- Planning multi-step image workflows
- Combining generate + transform + save operations
- Batch processing multiple images

## Auto-Discovery Skill

Claude automatically detects image-related tasks. When you mention any of these, floimg skills activate:

- Charts, graphs, visualizations
- Diagrams, flowcharts, sequences
- QR codes
- Screenshots, captures
- Images, photos, illustrations

Example - just describe what you need:

```
I need a data visualization dashboard with:
- A bar chart of monthly sales
- A pie chart of product categories
- All charts should be 800x600 and saved to ./charts/
```

Claude recognizes this as an image task and uses floimg automatically.

## Configuration

### Environment Variables

```bash
# For AI image generation (DALL-E)
export OPENAI_API_KEY=sk-...

# For cloud storage
export AWS_ACCESS_KEY_ID=...
export AWS_SECRET_ACCESS_KEY=...
export S3_BUCKET=my-bucket
```

### Generator Routing

The `/floimg:image` command (and MCP tools) intelligently route to the appropriate generator:

| Intent Keywords              | Generator     | Example                    |
| ---------------------------- | ------------- | -------------------------- |
| photo, picture, illustration | OpenAI/DALL-E | "a sunset over mountains"  |
| chart, graph, bar, line, pie | QuickChart    | "bar chart of sales data"  |
| flowchart, diagram, sequence | Mermaid       | "user auth flow diagram"   |
| QR, qr code                  | QR            | "QR code for https://..."  |
| screenshot, capture, webpage | Screenshot    | "screenshot of github.com" |

## Architecture

### Plugin Structure

```
packages/floimg-claude/
├── .claude-plugin/
│   └── plugin.json          # Plugin manifest (namespace: "floimg")
├── commands/                 # Slash commands
│   ├── image.md             # MCP - complex image routing
│   ├── workflow.md          # MCP - multi-step pipelines
│   ├── chart.md             # CLI - QuickChart
│   ├── diagram.md           # CLI - Mermaid
│   ├── qr.md                # CLI - QR codes
│   └── screenshot.md        # CLI - webpage capture
├── agents/
│   └── image-architect.md   # Complex task agent
├── skills/
│   └── image-workflows/     # Auto-discovery skill
│       ├── SKILL.md
│       ├── examples.md
│       └── reference.md
└── .mcp.json                # MCP server configuration (uses npx)
```

### How It Works

```
┌─────────────────────────────────────────────────────────┐
│                 floimg-claude Plugin                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Simple Commands          Complex Commands               │
│  (/qr, /chart, /diagram,  (/image, /workflow)           │
│   /screenshot)                                          │
│       │                         │                        │
│       ▼                         ▼                        │
│  ┌─────────┐              ┌──────────┐                  │
│  │   CLI   │              │   MCP    │                  │
│  │  (npx)  │              │ (session)│                  │
│  └────┬────┘              └────┬─────┘                  │
│       │                        │                         │
│       └────────────┬───────────┘                        │
│                    ▼                                     │
│              floimg core                                 │
│         (generate, transform, save)                      │
└─────────────────────────────────────────────────────────┘
```

1. **Simple commands** use Bash to run `npx -y @teamflojo/floimg <command>`. No MCP required.
2. **Complex commands** use MCP tools for session state and iteration.
3. **Both** ultimately use floimg core for image operations.

### MCP Server

The MCP server (enabled after restart) exposes:

- `generate_image` - Create images with intent-based routing
- `transform_image` - Resize, blur, caption, filters
- `save_image` - Save to local or cloud (S3, R2, Tigris)
- `run_pipeline` - Execute multi-step workflows
- `analyze_image` - AI vision analysis

Configuration in `.mcp.json`:

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

---

## Related Documents

- [[MCP-Server-Architecture]] - MCP server implementation details
- [[LLM-Integration]] - How LLMs orchestrate floimg
- [[Plugin-Architecture]] - Generator plugin system
