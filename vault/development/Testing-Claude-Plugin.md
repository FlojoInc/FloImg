# Testing the floimg-claude Plugin

This guide covers testing all components of the `@teamflojo/floimg-claude` Claude Code plugin. Use it to verify functionality during development or after installation.

## Prerequisites

### Loading the Plugin for Testing

**Option 1: From npm (production testing)**

```bash
npm install -g @teamflojo/floimg-claude
```

**Option 2: From local development (development testing)**

```bash
# From the floimg monorepo root
claude --plugin-dir ./packages/floimg-claude
```

### Environment Variables

| Variable                | Required For     | Description                   |
| ----------------------- | ---------------- | ----------------------------- |
| `OPENAI_API_KEY`        | AI generation    | DALL-E image generation       |
| `STABILITY_API_KEY`     | AI transforms    | Background removal, upscaling |
| `REPLICATE_API_TOKEN`   | Face restoration | Replicate models              |
| `AWS_ACCESS_KEY_ID`     | S3 storage       | Cloud uploads                 |
| `AWS_SECRET_ACCESS_KEY` | S3 storage       | Cloud uploads                 |
| `S3_BUCKET`             | S3 storage       | Default bucket                |

**Minimal testing**: No API keys required for simple generators (QR, chart, diagram, screenshot).

### When MCP Restart Is Required

The plugin uses a hybrid architecture:

- **CLI commands** (simple): Work immediately, no restart needed
- **MCP tools** (complex): Require Claude Code restart once to enable session state

After first install, restart Claude Code to enable MCP features.

---

## Quick Smoke Test (5 minutes)

Run these commands to verify each component works:

| Component  | Test Command                               | Expected                       |
| ---------- | ------------------------------------------ | ------------------------------ |
| QR         | `/floimg:qr https://floimg.com`            | Creates qr.png                 |
| Chart      | `/floimg:chart bar chart A=10 B=20 C=30`   | Creates chart.png              |
| Diagram    | `/floimg:diagram graph TD; A-->B-->C`      | Creates diagram.png            |
| Screenshot | `/floimg:screenshot https://github.com`    | Creates screenshot.png         |
| Skill      | "Create a pie chart of market share"       | Triggers image-workflows skill |
| Agent      | "Create a hero image with social variants" | Spawns image-architect agent   |

---

## Command Tests

### `/floimg:qr`

**Purpose**: Generate QR codes via CLI.

#### Test: Basic QR Code

```
/floimg:qr https://floimg.com
```

**Expected**: Creates `qr.png` in current directory with scannable QR code.
**Verify**: Scan with phone camera, should open floimg.com.

#### Test: Custom Output Path

```
/floimg:qr https://example.com -o ./output/my-qr.png
```

**Expected**: Creates file at specified path.

#### Test: Error Correction Levels

```
/floimg:qr https://floimg.com --error-correction H
```

**Expected**: QR code with high error correction (more redundancy).

#### Common Failures

- **Plugin not loaded**: Check `claude --plugin-dir` path
- **Missing output directory**: Parent directory must exist

---

### `/floimg:chart`

**Purpose**: Generate data visualizations via QuickChart.

#### Test: Bar Chart

```
/floimg:chart bar chart: Q1=10 Q2=20 Q3=30 Q4=40
```

**Expected**: Creates `chart.png` with bar visualization.

#### Test: Pie Chart

```
/floimg:chart pie chart: Desktop 60% Mobile 30% Tablet 10%
```

**Expected**: Creates pie chart with labeled segments.

#### Test: Line Chart with Custom Output

```
/floimg:chart line chart of revenue: Jan=100 Feb=150 Mar=200 -o revenue.png
```

**Expected**: Creates line chart at specified path.

#### Common Failures

- **Invalid data format**: Ensure key=value or key:value pairs
- **Unsupported chart type**: Stick to bar, pie, line, doughnut

---

### `/floimg:diagram`

**Purpose**: Generate Mermaid diagrams.

#### Test: Flowchart (Inline)

```
/floimg:diagram graph TD; A-->B; B-->C; C-->D
```

**Expected**: Creates `diagram.png` with flowchart.

#### Test: Sequence Diagram

```
/floimg:diagram sequenceDiagram; Alice->>Bob: Hello; Bob->>Alice: Hi
```

**Expected**: Creates sequence diagram.

#### Test: From File

```
/floimg:diagram --file ./my-diagram.mmd -o output.svg --format svg
```

**Expected**: Reads Mermaid code from file, outputs SVG.

#### Test: Theme Options

```
/floimg:diagram graph LR; A-->B --theme dark
```

**Expected**: Dark-themed diagram.

#### Common Failures

- **Invalid Mermaid syntax**: Use inline semicolons for compact syntax
- **Plugin auto-install prompt**: Accept to install @teamflojo/floimg-mermaid

---

### `/floimg:screenshot`

**Purpose**: Capture webpage screenshots.

#### Test: Basic Screenshot

```
/floimg:screenshot https://github.com
```

**Expected**: Creates `screenshot.png` of GitHub homepage.

#### Test: Custom Dimensions

```
/floimg:screenshot https://floimg.com -w 1200 -h 800
```

**Expected**: Screenshot at specified dimensions.

#### Test: Mobile Viewport

```
/floimg:screenshot https://floimg.com -w 375 -h 667
```

**Expected**: Mobile-sized screenshot.

#### Common Failures

- **URL not accessible**: Ensure URL is reachable
- **Timeout on complex pages**: Some SPAs take time to load

---

### `/floimg:image`

**Purpose**: Generate AI images with optional transforms.

#### Test: Basic Generation (Requires OPENAI_API_KEY)

```
/floimg:image a sunset over mountains, photorealistic
```

**Expected**: Generates image via DALL-E.

#### Test: Generation with Transforms (Requires MCP)

```
/floimg:image a hero banner for a tech blog, resize to 1200x630
```

**Expected**: Generates image, then resizes to specified dimensions.

#### Test: Without API Key

```
/floimg:image a landscape photo
```

**Expected**: Error message about missing OPENAI_API_KEY.

---

## Skill Tests

The `image-workflows` skill auto-detects image-related requests.

### Test: Trigger Word Detection

| User Request                            | Should Trigger? |
| --------------------------------------- | --------------- |
| "Create a bar chart of sales data"      | Yes             |
| "I need a flowchart for the login flow" | Yes             |
| "Generate a QR code for my website"     | Yes             |
| "Take a screenshot of the homepage"     | Yes             |
| "Make a hero image for my blog"         | Yes             |
| "What's the weather today?"             | No              |
| "Help me write a function"              | No              |

#### Test: Natural Language Chart

```
I need a chart showing our quarterly revenue: Q1 was $10M, Q2 was $15M, Q3 was $12M, Q4 was $20M
```

**Expected**: Skill activates, generates chart with labeled data.

#### Test: Natural Language Diagram

```
Create a flowchart showing: user logs in, system validates, if valid go to dashboard, if invalid show error
```

**Expected**: Skill activates, generates Mermaid flowchart.

---

## Agent Tests

The `image-architect` agent handles complex image workflows.

### Test: Generator Selection

| Request                                  | Expected Generator |
| ---------------------------------------- | ------------------ |
| "Create a photo of a mountain landscape" | OpenAI/DALL-E      |
| "Make a bar chart of our metrics"        | QuickChart         |
| "Create an architecture diagram"         | Mermaid            |
| "Generate a QR code for our app"         | QR                 |
| "Take a screenshot of our competitor"    | Screenshot         |

#### Test: Workflow Planning

```
Create a hero image for my tech blog, resize it for social media, add a caption, and save to S3
```

**Expected**: Agent plans multi-step workflow:

1. Generate with DALL-E
2. Resize to social dimensions
3. Add caption text
4. Save to S3 bucket

#### Test: Social Media Variants

```
Create a product mockup and prepare versions for Twitter, Facebook, and Instagram
```

**Expected**: Agent generates image and plans three resize operations:

- 800x418 (Twitter)
- 1200x630 (Facebook/OG)
- 1080x1080 (Instagram)

---

## MCP Integration Tests

These tests require MCP to be enabled (restart Claude Code after plugin install).

### Test: Session State Persistence

**Step 1**: Generate an image

```
Create a hero image of a futuristic city
```

**Expected**: Image generated, assigned imageId (e.g., `img_001`).

**Step 2**: Transform without re-generation

```
Make it more vibrant
```

**Expected**: Adjusts saturation on existing image (same composition), not a new generation.

**Step 3**: Chain another transform

```
Now add a caption: "Welcome to the Future"
```

**Expected**: Adds caption to the already-adjusted image.

**Verify**: Final image should be the original composition with increased saturation AND caption overlay.

### Test: Transform Chaining

```
Generate a landscape photo, make it grayscale, add rounded corners, resize to 800x600
```

**Expected**: Single image with all three transforms applied in sequence.

### Test: Pipeline Execution

```
/floimg:workflow Generate product photo, remove background, resize to 500x500, save as product-hero.png
```

**Expected**: Atomic pipeline execution with all steps.

---

## End-to-End Workflows

### Workflow: Social Media Asset Pipeline

**Scenario**: Create assets for a product launch.

```
Create a product launch image with these variants:
- Hero banner 1200x630 for website
- Twitter card 800x418
- Instagram post 1080x1080
- Thumbnail 400x400
Add "New Product Launch" caption to each
```

**Expected**:

1. Single AI generation
2. Four resize operations
3. Four caption additions
4. Four output files

### Workflow: Iterative Refinement

**Scenario**: Refine an image through conversation.

```
User: Create a hero image for my AI startup
Claude: [generates image]

User: Make it bluer
Claude: [adjusts hue on same image]

User: Add our tagline "AI for Everyone"
Claude: [adds caption]

User: Resize for LinkedIn banner (1128x191)
Claude: [resizes]

User: Save it
Claude: [saves to local file]
```

**Verify**: Each step modifies the same base image, not re-generating.

### Workflow: Batch Processing

```
Create three different chart styles showing the same data (revenue: Q1=10, Q2=20, Q3=30):
1. Bar chart
2. Line chart
3. Pie chart
Save each to ./charts/
```

**Expected**: Three separate chart files in the charts directory.

---

## Troubleshooting

### Plugin Not Loading

**Symptom**: `/floimg:*` commands not recognized.

**Solutions**:

1. Verify plugin path: `claude --plugin-dir ./packages/floimg-claude`
2. Check plugin structure has `package.json` with `claudePlugin` field
3. Try npm global install: `npm install -g @teamflojo/floimg-claude`

### MCP Tools Not Available

**Symptom**: Session state not persisting, transforms don't chain.

**Solutions**:

1. Restart Claude Code after plugin install
2. Check MCP config in Claude Code settings
3. Verify floimg MCP server is running

### Missing API Keys

**Symptom**: AI generation fails with authentication error.

**Solutions**:

1. Set `OPENAI_API_KEY` environment variable
2. For AI transforms, also set `STABILITY_API_KEY`
3. Restart Claude Code after setting env vars

### Chart/Diagram Generation Fails

**Symptom**: QuickChart or Mermaid errors.

**Solutions**:

1. Check data format (key=value pairs for charts)
2. Validate Mermaid syntax (use semicolons for inline)
3. Accept plugin auto-install prompts

### Screenshot Fails

**Symptom**: Screenshot command errors or times out.

**Solutions**:

1. Ensure URL is publicly accessible
2. Try without JavaScript-heavy sites first
3. Accept @teamflojo/floimg-screenshot auto-install

---

## Success Checklist

Use this checklist to verify full plugin functionality:

- [ ] `/floimg:qr` generates scannable QR code
- [ ] `/floimg:chart` creates data visualization
- [ ] `/floimg:diagram` renders Mermaid diagram
- [ ] `/floimg:screenshot` captures webpage
- [ ] `/floimg:image` generates AI image (with API key)
- [ ] Skill auto-detects image-related requests
- [ ] Agent plans complex workflows
- [ ] MCP session state persists across messages
- [ ] Transform chaining works without re-generation
- [ ] Pipeline execution completes atomically
