# imgflo Guide for AI Agents

This guide is specifically for AI agents (like Claude Code) to understand how to use imgflo effectively.

## Overview

imgflo is designed to make image generation and manipulation easy for AI agents. You can:
- Generate images from text descriptions
- Create SVG graphics programmatically
- Convert between formats
- Upload to cloud storage and get URLs

## Decision Tree for Image Generation

When a user asks for an image, choose the right generator:

### 1. **Simple Graphics & Patterns** → Use `shapes` generator

User wants:
- Gradients, solid colors
- Simple geometric shapes (circles, rectangles)
- Patterns (dots, stripes, grids)
- Background images for slides/websites

**Command:**
```bash
imgflo generate --generator shapes --params '{"type":"gradient","width":1200,"height":630}' --out bg.svg
```

**Types available:**
- `"type":"gradient"` - Linear gradient (specify `color1`, `color2`)
- `"type":"circle"` - Solid circle (specify `fill`)
- `"type":"rectangle"` - Rectangle with optional rounded corners (specify `fill`, `rx`)
- `"type":"pattern"` - Repeating patterns (specify `patternType`: "dots", "stripes", or "grid")

### 2. **AI-Generated Images** → Use `openai` generator (when available)

User wants:
- Photos/realistic images
- Illustrations based on descriptions
- Complex scenes
- Artistic images

**Command (future):**
```bash
imgflo generate --generator openai --params '{"prompt":"mountain landscape at sunset"}' --out scene.png
```

### 3. **HTML/JSX → SVG** → Use `satori` generator (future)

User wants:
- Text-based graphics
- Typography-heavy images
- Social media cards
- Custom layouts

## Complete Workflow Examples

### Example 1: Google Slides Background

User: "Create a gradient background for my presentation slide"

**Steps:**
1. Understand requirements (gradient, presentation size = 1920x1080)
2. Generate SVG gradient
3. Convert to PNG (better for slides)
4. Upload to S3 (if configured)
5. Return URL for slides

**Commands:**
```bash
# Generate
imgflo generate --generator shapes --params '{"type":"gradient","width":1920,"height":1080,"color1":"#6366f1","color2":"#8b5cf6"}' --out slide-bg.svg

# Convert
imgflo transform --in slide-bg.svg --op convert --to image/png --out slide-bg.png

# Upload
imgflo upload --in slide-bg.png --key presentations/slide-bg.png
# Returns: https://bucket.s3.amazonaws.com/presentations/slide-bg.png
```

### Example 2: Social Media Graphic

User: "Make an image for Twitter with a blue gradient"

**Steps:**
1. Twitter image size: 1200x675
2. Generate gradient
3. Upload and get URL

**Commands:**
```bash
imgflo generate --generator shapes --params '{"type":"gradient","width":1200,"height":675,"color1":"#1DA1F2","color2":"#0077B5"}' --out twitter.svg
imgflo transform --in twitter.svg --op convert --to image/png --out twitter.png
imgflo upload --in twitter.png --key social/twitter-bg.png
```

### Example 3: Pattern Background

User: "Create a dotted pattern background"

**Commands:**
```bash
imgflo generate --generator shapes --params '{"type":"pattern","patternType":"dots","width":800,"height":600"}' --out pattern.svg
imgflo transform --in pattern.svg --op convert --to image/png --out pattern.png
imgflo upload --in pattern.png --key backgrounds/dots.png
```

## Configuration

### Check if imgflo is configured:
```bash
imgflo doctor
```

### If not configured, help user set it up:
```bash
imgflo config init
```

Or set individual values:
```bash
imgflo config set s3.bucket user-images-bucket
imgflo config set s3.region us-east-1
```

## Generator Selection Logic

```
If user wants:
  - "gradient" or "solid color" → generator: shapes, type: gradient/rectangle
  - "circle" or "dot" → generator: shapes, type: circle
  - "pattern" or "dots" or "stripes" → generator: shapes, type: pattern
  - "realistic" or "photo" or "illustration" → generator: openai (future)
  - Complex description → generator: openai (future)
  - "text on image" or "typography" → generator: satori (future)
```

## Common Parameters

### Shapes Generator

**Gradient:**
```json
{
  "type": "gradient",
  "width": 1200,
  "height": 630,
  "color1": "#667eea",  // Start color
  "color2": "#764ba2"   // End color
}
```

**Circle:**
```json
{
  "type": "circle",
  "width": 500,
  "height": 500,
  "fill": "#f59e0b"
}
```

**Pattern:**
```json
{
  "type": "pattern",
  "patternType": "dots",  // or "stripes", "grid"
  "width": 800,
  "height": 600
}
```

## Image Sizes Reference

- **Google Slides**: 1920x1080 (16:9) or 1280x720
- **Twitter**: 1200x675
- **Facebook**: 1200x630
- **Instagram**: 1080x1080 (square) or 1080x1350 (portrait)
- **LinkedIn**: 1200x627
- **OG Images**: 1200x630

## Error Handling

### If generation fails:
1. Check if generator exists: `imgflo doctor`
2. Verify parameters are valid
3. Try with simpler params first

### If upload fails:
1. Check config: `imgflo config get`
2. Verify S3 bucket exists
3. Check AWS credentials

### If conversion fails:
1. Ensure input file exists
2. Check format is supported
3. Try different target format

## Programmatic Usage (TypeScript)

When using as a library:

```typescript
import createClient from 'imgflo';

const imgflo = createClient();

// Generate
const img = await imgflo.generate({
  generator: 'shapes',
  params: { type: 'gradient', width: 1200, height: 630 }
});

// Transform
const png = await imgflo.transform({
  blob: img,
  op: 'convert',
  to: 'image/png'
});

// Upload
const result = await imgflo.upload({
  blob: png,
  key: 'images/gradient.png'
});

console.log(result.url); // Use this URL!
```

## Tips for AI Agents

1. **Always check configuration first** with `imgflo doctor`
2. **Default to shapes generator** for simple graphics
3. **Use standard image sizes** for social media/presentations
4. **Convert SVG to PNG** before uploading (better compatibility)
5. **Return the URL** to the user for easy use
6. **Handle errors gracefully** and suggest fixes

## Quick Decision Matrix

| User Request | Generator | Type | Output |
|--------------|-----------|------|--------|
| "gradient background" | shapes | gradient | SVG/PNG |
| "solid color" | shapes | rectangle | SVG/PNG |
| "dotted pattern" | shapes | pattern (dots) | SVG/PNG |
| "circle logo" | shapes | circle | SVG/PNG |
| "photo of..." | openai* | - | PNG |
| "illustration of..." | openai* | - | PNG |

*Future feature

## Example Conversation Flow

**User:** "I need a purple gradient for my slide"

**AI Agent (you):**
1. Identify: Need gradient, probably for presentation
2. Generate command:
   ```bash
   imgflo generate --generator shapes --params '{"type":"gradient","width":1920,"height":1080,"color1":"#6b46c1","color2":"#9333ea"}' --out slide.svg
   ```
3. Convert to PNG:
   ```bash
   imgflo transform --in slide.svg --op convert --to image/png --out slide.png
   ```
4. Upload:
   ```bash
   imgflo upload --in slide.png --key slides/purple-gradient.png
   ```
5. Return: "Here's your purple gradient: https://bucket.s3.amazonaws.com/slides/purple-gradient.png"

**User:** "Can you make it more blue?"

**AI Agent:**
1. Adjust colors to more blue
2. Regenerate with new colors (color1: #3b82f6, color2: #6366f1)
3. Same convert/upload process
4. Return new URL

## Remember

- imgflo makes it easy to go from user request → image → URL
- You handle the decisions (which generator, what params)
- imgflo handles the technical parts (generation, conversion, upload)
- Always provide the final URL back to the user
