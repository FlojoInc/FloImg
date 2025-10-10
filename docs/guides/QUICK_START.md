# imgflo Quick Start

## For AI Agents (Like Claude Code)

This is the perfect tool when you need to generate images and get shareable URLs quickly.

### The Problem This Solves

When working with tools like Google Slides MCP or creating web content, you often need to:
1. Generate an image
2. Convert it to a web-friendly format
3. Upload it somewhere
4. Get a URL back

All of these steps usually require manual intervention. With imgflo, it's automated.

### Installation

```bash
npm install imgflo
```

Or use it globally as a CLI:

```bash
npm install -g imgflo
```

### Quick Examples

#### Example 1: Generate and Save Locally

```bash
# Generate a gradient SVG
imgflo generate \
  --provider svg \
  --name shapes \
  --params '{"type":"gradient","width":1200,"height":630}' \
  --out gradient.svg

# Convert to PNG
imgflo transform \
  --in gradient.svg \
  --op convert \
  --to image/png \
  --out gradient.png
```

#### Example 2: Upload to S3

First, set up your environment:

```bash
export AWS_REGION=us-east-1
export S3_BUCKET=my-images
```

Then upload:

```bash
imgflo upload \
  --in gradient.png \
  --key images/gradient.png
```

You'll get back a URL like: `https://my-images.s3.amazonaws.com/images/gradient.png`

#### Example 3: Complete Workflow (Generate → Convert → Upload)

```bash
# 1. Generate
imgflo generate --provider svg --params '{"type":"gradient","width":1200,"height":630}' --out temp.svg

# 2. Convert
imgflo transform --in temp.svg --op convert --to image/png --out temp.png

# 3. Upload
imgflo upload --in temp.png --key slides/background.png
```

### Available Shapes

The built-in `shapes` provider supports:

**Gradients:**
```bash
imgflo generate --provider svg --params '{"type":"gradient","width":1200,"height":630,"color1":"#667eea","color2":"#764ba2"}' --out gradient.svg
```

**Circles:**
```bash
imgflo generate --provider svg --params '{"type":"circle","width":500,"height":500,"fill":"#f59e0b"}' --out circle.svg
```

**Rectangles:**
```bash
imgflo generate --provider svg --params '{"type":"rectangle","width":800,"height":600,"fill":"#764ba2","rx":20}' --out rect.svg
```

**Patterns (dots, stripes, grid):**
```bash
imgflo generate --provider svg --params '{"type":"pattern","patternType":"dots","width":800,"height":600}' --out pattern.svg
```

### Using as a Library

```typescript
import createClient from 'imgflo';

const imgflo = createClient({
  store: {
    default: 's3',
    s3: {
      region: 'us-east-1',
      bucket: 'my-images'
    }
  }
});

// Generate → Convert → Upload
const svg = await imgflo.generate({
  provider: 'svg',
  name: 'shapes',
  params: { type: 'gradient', width: 1200, height: 630 }
});

const png = await imgflo.transform({
  blob: svg,
  op: 'convert',
  to: 'image/png'
});

const result = await imgflo.upload({
  blob: png,
  key: 'images/gradient.png'
});

console.log(result.url); // Use this URL in Google Slides, emails, etc.
```

### Google Slides Workflow

When a user asks you to create images for slides:

1. Generate the images with imgflo
2. Upload to S3 to get URLs
3. Use the Google Slides MCP to insert the images

```typescript
// Generate slide backgrounds
const titleBg = await imgflo.generate({
  provider: 'svg',
  params: {
    type: 'gradient',
    width: 1920,
    height: 1080,
    color1: '#6366f1',
    color2: '#8b5cf6'
  }
});

const titlePng = await imgflo.transform({
  blob: titleBg,
  op: 'convert',
  to: 'image/png'
});

const result = await imgflo.upload({
  blob: titlePng,
  key: 'slides/title.png'
});

// Now use result.url with Google Slides MCP
```

### Configuration

Create `imgflo.config.ts` in the project root:

```typescript
import { defineConfig } from 'imgflo/config';

export default defineConfig({
  store: {
    default: 's3',
    s3: {
      region: process.env.AWS_REGION,
      bucket: process.env.S3_BUCKET
    }
  }
});
```

### Environment Variables

```bash
# Required for S3 uploads
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Optional: AWS credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

### Troubleshooting

Check your setup:

```bash
imgflo doctor
```

This will show:
- Current configuration
- Available providers
- Environment variables

### Next Steps

- **Add AI Image Generation**: We'll be adding OpenAI DALL-E support soon
- **More SVG Providers**: Custom shapes, patterns, diagrams
- **Image Optimization**: Automatic compression and optimization
- **MCP Server**: Direct integration with Claude Code

## For Developers

See the [examples](./examples) directory for more detailed usage examples.

### Project Structure

```
imgflo/
├── src/
│   ├── core/           # Core client and types
│   ├── providers/      # Image generation, transformation, and storage providers
│   ├── cli/            # CLI commands
│   └── index.ts        # Main entry point
├── examples/           # Usage examples
└── dist/               # Compiled output
```

### Adding Custom Providers

You can register custom providers:

```typescript
import { Imgflo } from 'imgflo';

const client = new Imgflo();

// Add a custom SVG provider
client.registerProvider('svg', {
  name: 'my-shapes',
  async generate(params) {
    return {
      bytes: Buffer.from('<svg>...</svg>'),
      mime: 'image/svg+xml',
      width: params.width,
      height: params.height
    };
  }
});
```

## Contributing

This is an MVP! We'd love contributions for:
- More SVG generators (charts, diagrams, icons)
- AI image providers (OpenAI, Stability, etc.)
- Additional storage backends (Cloudflare R2, DigitalOcean Spaces)
- Image optimization features
- Better error handling and validation

## License

MIT
