---
description: Execute a multi-step image workflow (generate, transform, save pipeline)
allowed-tools: mcp__floimg__generate_image, mcp__floimg__transform_image, mcp__floimg__save_image, mcp__floimg__run_pipeline, Bash
---

# Image Workflow

Execute a multi-step image workflow: "$ARGUMENTS"

## Instructions

### If MCP tools are available (preferred)

Use `run_pipeline` for efficient multi-step execution:

```json
{
  "steps": [
    { "generate": { "intent": "...", "params": {...} } },
    { "transform": { "operation": "resize", "params": { "width": 800 } } },
    { "transform": { "operation": "addCaption", "params": { "text": "...", "position": "bottom" } } },
    { "save": { "destination": "s3://bucket/output.png" } }
  ]
}
```

Or chain individual tools for more control:

1. `generate_image` → returns `imageId`
2. `transform_image` with `imageId` → returns new `imageId`
3. `save_image` with final `imageId`

### If MCP is not available

Inform the user: **"Multi-step workflows work best with MCP for session state and iteration. Restart Claude Code to enable the floimg MCP server."**

For simple sequential operations, CLI can work but requires temp files:

```bash
# Step 1: Generate
npx -y @teamflojo/floimg generate --generator openai --prompt "hero image" -o /tmp/step1.png

# Step 2: Transform
npx -y @teamflojo/floimg resize /tmp/step1.png 1200x630 -o /tmp/step2.png

# Step 3: Save to cloud
npx -y @teamflojo/floimg save /tmp/step2.png s3://bucket/hero.png
```

## Transform Operations

| Operation      | Description   | Key Params                                |
| -------------- | ------------- | ----------------------------------------- |
| `resize`       | Scale image   | `width`, `height`, `fit`                  |
| `convert`      | Change format | `to` (png, jpeg, webp)                    |
| `blur`         | Gaussian blur | `sigma` (0.3-1000)                        |
| `sharpen`      | Sharpen edges | `sigma`                                   |
| `grayscale`    | Remove color  | -                                         |
| `modulate`     | Adjust colors | `brightness`, `saturation`, `hue`         |
| `roundCorners` | Border radius | `radius`                                  |
| `addText`      | Overlay text  | `text`, `x`, `y`, `size`, `color`         |
| `addCaption`   | Caption bar   | `text`, `position`, `background`          |
| `preset`       | Apply filter  | `name` (vintage, vibrant, dramatic, soft) |

## Common Workflow Patterns

### Social Media Ready (MCP)

```json
{
  "steps": [
    { "generate": { "intent": "hero image for tech blog..." } },
    { "transform": { "operation": "resize", "params": { "width": 1200, "height": 630 } } },
    {
      "transform": {
        "operation": "addCaption",
        "params": { "text": "My Blog Title", "position": "bottom" }
      }
    },
    { "save": { "destination": "s3://assets/og-image.png" } }
  ]
}
```

### Thumbnail Generation (MCP)

```json
{
  "steps": [
    { "generate": { "intent": "product photo..." } },
    {
      "transform": {
        "operation": "resize",
        "params": { "width": 200, "height": 200, "fit": "cover" }
      }
    },
    { "transform": { "operation": "roundCorners", "params": { "radius": 10 } } },
    { "save": { "destination": "./thumbnails/product.png" } }
  ]
}
```

### Iterative Refinement (MCP session state)

```
User: "Create a hero image for my AI startup"
→ generate_image(...) → imageId: "img_001"

User: "Make it more vibrant"
→ transform_image({ imageId: "img_001", operation: "modulate", params: { saturation: 1.3 } })
→ imageId: "img_002"

User: "Add our tagline at the bottom"
→ transform_image({ imageId: "img_002", operation: "addCaption", params: { text: "AI for Everyone" } })
→ imageId: "img_003"

User: "Perfect, save it"
→ save_image({ imageId: "img_003", destination: "./hero.png" })
```

## Save Destinations

| Format | Example                               |
| ------ | ------------------------------------- |
| Local  | `./output/image.png`                  |
| S3     | `s3://bucket-name/path/image.png`     |
| R2     | `r2://bucket-name/path/image.png`     |
| Tigris | `tigris://bucket-name/path/image.png` |

## Why MCP for Workflows

- **Session state**: `imageId` references without file juggling
- **Iteration**: Refine results without re-generating
- **Efficiency**: Images stay in memory between transforms
- **Natural language**: Describe what you want, floimg plans the steps

For simple one-shot commands, use `/floimg:chart`, `/floimg:qr`, etc. (they work without MCP).
