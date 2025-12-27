---
description: Generate an image using floimg (AI images, charts, diagrams, QR codes, screenshots)
allowed-tools: mcp__floimg__generate_image, mcp__floimg__transform_image, mcp__floimg__save_image, Bash
---

# Image Generation

Generate an image based on: "$ARGUMENTS"

## Instructions

### If MCP tools are available (preferred)

Use the floimg MCP tools for full power:

- `generate_image` - Create the image with intent-based routing
- `transform_image` - Apply transforms, iterate on results
- `save_image` - Save to local or cloud storage

This enables:

- Natural language → complex transform sequences
- Iterative refinement ("make it bluer", "add more contrast")
- Session state (reference previous images)

### If MCP is not available

**For simple one-shot generation**, fall back to CLI:

```bash
# AI image (requires OPENAI_API_KEY)
npx -y @teamflojo/floimg generate --generator openai --prompt "DESCRIPTION" -o ./output.png

# Chart
npx -y @teamflojo/floimg chart bar --labels "A,B,C" --values "10,20,30" -o ./chart.png

# Diagram
npx -y @teamflojo/floimg diagram "graph TD; A-->B" -o ./diagram.png

# QR code
npx -y @teamflojo/floimg qr "https://example.com" -o ./qr.png

# Screenshot
npx -y @teamflojo/floimg screenshot "https://example.com" -o ./screenshot.png
```

**For complex workflows** (multi-step transforms, iteration):
Inform the user: "For complex image workflows with transforms and iteration, restart Claude Code to enable the floimg MCP server. This unlocks session state and iterative refinement."

## Generator Routing

When using MCP, the `intent` field routes to the best generator:

| Intent Keywords                     | Generator  | Example                    |
| ----------------------------------- | ---------- | -------------------------- |
| photo, picture, illustration, scene | OpenAI     | "a sunset over mountains"  |
| chart, graph, bar, line, pie        | QuickChart | "bar chart of sales data"  |
| flowchart, diagram, sequence        | Mermaid    | "user auth flow diagram"   |
| QR, qr code                         | QR         | "QR code for https://..."  |
| screenshot, capture, webpage        | Screenshot | "screenshot of github.com" |

## MCP Examples

**AI Image**:

```json
{
  "intent": "a golden retriever in a field at sunset",
  "saveTo": "./dog.png"
}
```

**With transforms** (MCP session state):

```
1. generate_image({ intent: "hero image for tech blog" })
   → imageId: "img_001"
2. transform_image({ imageId: "img_001", operation: "resize", params: { width: 1200 } })
   → imageId: "img_002"
3. transform_image({ imageId: "img_002", operation: "addCaption", params: { text: "Welcome" } })
   → imageId: "img_003"
4. save_image({ imageId: "img_003", destination: "s3://bucket/hero.png" })
```

## Why MCP for Complex Tasks

- **Iteration**: "Make it more vibrant" → transform the same image
- **Session state**: Reference `img_001` without file paths
- **Natural language**: Describe transforms, let floimg figure out the API
- **Chaining**: Generate → resize → caption → save in one conversation

For simple `/floimg:chart` or `/floimg:qr`, use those commands instead (they use CLI directly and work without MCP).
