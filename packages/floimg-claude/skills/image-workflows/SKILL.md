---
name: image-workflows
description: Create and execute image workflows using floimg. Use when the user needs to generate charts, diagrams, QR codes, screenshots, or AI images. Also use when combining generation with transforms (resize, caption, blur) or cloud uploads. Trigger words: chart, graph, diagram, flowchart, QR, screenshot, image, picture, photo, illustration, visualization.
allowed-tools: mcp__floimg__generate_image, mcp__floimg__transform_image, mcp__floimg__save_image, mcp__floimg__run_pipeline, mcp__floimg__analyze_image, Bash
---

# Image Workflows Skill

This skill enables you to create and execute image workflows using floimg's universal image engine.

## Architecture: CLI Simple, MCP Complex

floimg uses a hybrid approach:

| Task Type                                   | Method        | Works Immediately? |
| ------------------------------------------- | ------------- | ------------------ |
| Simple (QR, chart, diagram, screenshot)     | CLI via `npx` | Yes                |
| Complex (multi-step, iteration, transforms) | MCP           | After restart      |

## When to Use This Skill

Activate this skill when the user:

- Wants to generate any type of image (chart, diagram, QR, screenshot, AI image)
- Needs to transform images (resize, add caption, apply filters)
- Wants to save images to cloud storage (S3, R2, Tigris)
- Describes a multi-step image workflow

## Simple Tasks (Use CLI)

For one-shot image generation, use the floimg CLI:

```bash
# QR code
npx -y @teamflojo/floimg qr "https://example.com" -o ./qr.png

# Chart
npx -y @teamflojo/floimg chart bar --labels "Q1,Q2,Q3" --values "10,20,30" -o ./chart.png

# Diagram
npx -y @teamflojo/floimg diagram "graph TD; A-->B-->C" -o ./diagram.png

# Screenshot
npx -y @teamflojo/floimg screenshot "https://github.com" -o ./screenshot.png

# AI image (requires OPENAI_API_KEY)
npx -y @teamflojo/floimg generate --generator openai --prompt "..." -o ./image.png
```

These work immediately with no configuration.

## Complex Tasks (Use MCP)

For multi-step workflows, iteration, and transforms, use MCP tools:

### Available MCP Tools

- `generate_image` - Generate with intent-based routing
- `transform_image` - Apply transforms to existing images
- `save_image` - Save to filesystem or cloud
- `run_pipeline` - Execute multi-step workflows
- `analyze_image` - AI vision analysis

### If MCP is not available

For complex workflows, inform the user:
"Multi-step image workflows work best with MCP. Restart Claude Code once to enable the floimg MCP server for session state and iteration."

## Generator Selection Guide

| User Intent                | Generator  | CLI Command                   |
| -------------------------- | ---------- | ----------------------------- |
| Photo/illustration/scene   | openai     | `generate --generator openai` |
| Bar/line/pie chart         | quickchart | `chart TYPE`                  |
| Flowchart/sequence/diagram | mermaid    | `diagram "CODE"`              |
| QR code/barcode            | qr         | `qr "TEXT"`                   |
| Webpage screenshot         | screenshot | `screenshot "URL"`            |

## Workflow Patterns

### Pattern 1: Simple Generation (CLI)

```
User: "Create a bar chart showing Q1: 100, Q2: 150, Q3: 200"

Run: npx -y @teamflojo/floimg chart bar --labels "Q1,Q2,Q3" --values "100,150,200" -o ./chart.png
```

### Pattern 2: Generate and Transform (MCP preferred)

```
User: "Create a QR code for my website and resize it to 500px"

If MCP available:
1. generate_image({ intent: "QR code for https://..." }) → imageId
2. transform_image({ imageId, operation: "resize", params: { width: 500 } })

If no MCP (CLI fallback):
npx -y @teamflojo/floimg qr "https://..." --width 500 -o ./qr.png
```

### Pattern 3: Iterative Refinement (MCP required)

```
User: "Create a hero image for my blog"
→ generate_image(...) → imageId: "img_001"

User: "Make it more vibrant"
→ transform_image({ imageId: "img_001", operation: "modulate", params: { saturation: 1.3 } })

User: "Add a caption"
→ transform_image({ imageId: "img_002", operation: "addCaption", params: { text: "..." } })
```

Session state enables referencing previous images without file paths.

### Pattern 4: Full Pipeline (MCP)

```
User: "Create a hero image, resize for social, add caption, upload to S3"

run_pipeline({
  steps: [
    { generate: { intent: "hero image..." } },
    { transform: { operation: "resize", params: { width: 1200, height: 630 } } },
    { transform: { operation: "addCaption", params: { text: "...", position: "bottom" } } },
    { save: { destination: "s3://bucket/hero.png" } }
  ]
})
```

## Best Practices

1. **Simple tasks → CLI**: Use slash commands (`/floimg:qr`, `/floimg:chart`) for one-shot generation
2. **Complex tasks → MCP**: Multi-step, transforms, iteration benefit from session state
3. **Use imageId for chaining**: Don't pass bytes between MCP tools
4. **Resize last**: Apply quality-degrading transforms before final resize
5. **Choose right format**: SVG for diagrams, PNG for photos, WebP for web

For detailed API reference, see [reference.md](reference.md).
For common workflow examples, see [examples.md](examples.md).
