# imgflo

> Image generation and transformation library designed for AI agents and developers

[![npm version](https://img.shields.io/npm/v/imgflo.svg?style=flat)](https://www.npmjs.com/package/imgflo)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is imgflo?

`imgflo` makes it easy for AI agents (like Claude Code) and developers to generate images, transform them, and upload them to the cloud — all through simple programmatic APIs or CLI commands.

### The Problem

AI agents like Claude Code can easily generate SVGs (because they're code), but the workflow breaks down when you need to:
- Convert SVGs to raster formats (PNG, JPEG, WebP)
- Upload images to S3 or other storage
- Get back shareable URLs for use in presentations, websites, etc.

All of these steps typically require manual intervention.

### The Solution

`imgflo` provides a unified interface for the complete image workflow:

```bash
# Generate gradient → Convert to PNG → Upload to S3 → Get URL
imgflo generate --provider svg --params '{"type":"gradient","width":1200,"height":630}' --out bg.svg
imgflo transform --in bg.svg --op convert --to image/png --out bg.png
imgflo upload --in bg.png --key slides/background.png
# Returns: https://your-bucket.s3.amazonaws.com/slides/background.png
```

Or use it programmatically:

```typescript
import createClient from 'imgflo';

const imgflo = createClient({
  store: {
    default: 's3',
    s3: { region: 'us-east-1', bucket: 'my-images' }
  }
});

// Generate SVG → Convert to PNG → Upload to S3
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
  key: 'slides/background.png'
});

console.log(result.url); // Use in Google Slides, websites, etc.!
```

## Installation

```bash
npm install imgflo
```

Or install globally for CLI use:

```bash
npm install -g imgflo
```

## Quick Start

### Generate Your First Image

```bash
# 1. Install and configure
npm install -g imgflo
imgflo config init  # Set up S3 bucket, region, etc.

# 2. Generate a gradient SVG
imgflo generate \
  --generator shapes \
  --params '{"type":"gradient","width":1200,"height":630,"color1":"#667eea","color2":"#764ba2"}' \
  --out gradient.svg

# 3. Convert to PNG
imgflo transform --in gradient.svg --op convert --to image/png --out gradient.png

# 4. Upload to S3 (uses your saved config)
imgflo upload --in gradient.png --key images/gradient.png
```

### Use in Code

```typescript
import createClient from 'imgflo';

const imgflo = createClient();

// Generate a circle
const svg = await imgflo.generate({
  generator: 'shapes',
  params: {
    type: 'circle',
    width: 500,
    height: 500,
    fill: '#f59e0b'
  }
});

// Convert to PNG
const png = await imgflo.transform({
  blob: svg,
  op: 'convert',
  to: 'image/png'
});

// Upload (uses configured storage)
const result = await imgflo.upload({
  blob: png,
  key: 'circle.png'
});

console.log(`Saved to: ${result.url}`);
```

## Features

### Current Features (MVP v0.1.0)

- ✅ **SVG Generation**: Built-in shapes (gradients, circles, rectangles, patterns)
- ✅ **Image Transformation**: Convert SVG → PNG/JPEG/WebP/AVIF using Sharp + Resvg
- ✅ **Cloud Storage**: Upload to S3 with automatic URL generation
- ✅ **Local Storage**: Save to filesystem
- ✅ **CLI Tool**: Easy command-line interface
- ✅ **TypeScript**: Full type safety and IntelliSense
- ✅ **Extensible**: Plugin architecture for custom providers

### Coming Soon

- 🔄 **AI Image Generation**: OpenAI DALL-E, Stable Diffusion
- 🔄 **More SVG Providers**: Charts, diagrams, Trianglify, Satori
- 🔄 **Image Optimization**: Compression and optimization
- 🔄 **MCP Server**: Direct integration with Claude Code
- 🔄 **Pipeline System**: Declarative YAML/JSON workflows

## Use Cases

### Google Slides Workflow

Perfect for AI agents creating presentation images:

```typescript
// Generate slide backgrounds
const titleBg = await imgflo.generate({
  provider: 'svg',
  params: { type: 'gradient', width: 1920, height: 1080 }
});

const titlePng = await imgflo.transform({
  blob: titleBg,
  op: 'convert',
  to: 'image/png'
});

const result = await imgflo.upload({
  blob: titlePng,
  key: 'slides/title-bg.png'
});

// Use result.url with Google Slides MCP to insert image
```

### Social Media Graphics

Generate and upload social media assets:

```typescript
// Generate OG image
const ogImage = await imgflo.generate({
  provider: 'svg',
  params: { type: 'gradient', width: 1200, height: 630 }
});

// Convert and upload
const png = await imgflo.transform({ blob: ogImage, op: 'convert', to: 'image/png' });
const result = await imgflo.upload({ blob: png, key: 'og/homepage.png' });

// Use result.url in your <meta> tags
```

### Automated Image Pipelines

Build image processing workflows:

```typescript
// Batch process multiple images
const images = await Promise.all(
  ['gradient', 'circle', 'pattern'].map(type =>
    imgflo.generate({ provider: 'svg', params: { type } })
  )
);

// Convert all to PNG
const pngs = await Promise.all(
  images.map(img => imgflo.transform({ blob: img, op: 'convert', to: 'image/png' }))
);

// Upload all to S3
const results = await Promise.all(
  pngs.map((png, i) => imgflo.upload({ blob: png, key: `batch/${i}.png` }))
);
```

## CLI Commands

### `imgflo generate`

Generate an image using SVG or AI providers.

```bash
imgflo generate \
  --provider svg \
  --name shapes \
  --params '{"type":"gradient","width":1200,"height":630}' \
  --out output.svg
```

**Available shapes:**
- `gradient` - Linear gradient
- `circle` - Solid circle
- `rectangle` - Rounded rectangle
- `pattern` - Dots, stripes, or grid patterns

### `imgflo transform`

Transform an image (convert format, resize, etc.).

```bash
imgflo transform \
  --in input.svg \
  --op convert \
  --to image/png \
  --out output.png
```

**Operations:**
- `convert` - Change image format
- `resize` - Resize image
- `composite` - Combine multiple images
- `optimizeSvg` - Optimize SVG file size

### `imgflo upload`

Upload an image to cloud storage.

```bash
imgflo upload \
  --in image.png \
  --key path/to/image.png \
  --provider s3
```

### `imgflo doctor`

Check imgflo configuration and environment.

```bash
imgflo doctor
```

## Configuration

Create `imgflo.config.ts` in your project root:

```typescript
import { defineConfig } from 'imgflo/config';

export default defineConfig({
  verbose: true,
  cacheDir: '.imgflo',

  store: {
    default: 's3',
    s3: {
      region: process.env.AWS_REGION || 'us-east-1',
      bucket: process.env.S3_BUCKET,
    },
    fs: {
      basePath: './output',
      baseUrl: 'https://example.com/images'
    }
  },

  // Future: AI provider configuration
  ai: {
    default: 'openai',
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    }
  }
});
```

## Environment Variables

```bash
# AWS Configuration for S3 uploads
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Optional: AWS credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Future: OpenAI API key for AI image generation
OPENAI_API_KEY=sk-...
```

## Documentation

- **[Quick Start Guide](./QUICK_START.md)** - Fast reference for common tasks
- **[Getting Started](./GETTING_STARTED.md)** - Step-by-step tutorial
- **[Project Status](./STATUS.md)** - Current status and roadmap
- **[Full Specification](./imgflo-SPEC.md)** - Complete architecture details
- **[Examples](./examples/)** - Code examples and use cases

## Architecture

imgflo uses a provider-based architecture:

- **SVG Providers**: Generate SVG images from parameters
- **AI Providers**: Generate images using AI models (coming soon)
- **Transform Providers**: Convert and manipulate images
- **Store Providers**: Upload images to storage

Each provider is pluggable and extensible.

## Extending imgflo

Add custom providers:

```typescript
import { Imgflo } from 'imgflo';

const client = new Imgflo();

// Register custom SVG provider
client.registerProvider('svg', {
  name: 'my-generator',
  async generate(params) {
    return {
      bytes: Buffer.from('<svg>...</svg>'),
      mime: 'image/svg+xml',
      width: params.width,
      height: params.height
    };
  }
});

// Use it
const image = await client.generate({
  provider: 'svg',
  name: 'my-generator',
  params: { width: 800, height: 600 }
});
```

## Contributing

We welcome contributions! This is an MVP and there's lots to build:

- More SVG generators (charts, diagrams, icons)
- AI image providers (OpenAI, Stability AI, etc.)
- Additional storage backends (Cloudflare R2, DigitalOcean Spaces)
- Image optimization features
- Better error handling and validation
- Tests and documentation

## License

MIT

## Credits

Built with:
- [Sharp](https://sharp.pixelplumbing.com/) - High-performance image processing
- [Resvg](https://github.com/RazrFalcon/resvg) - SVG rendering
- [AWS SDK](https://aws.amazon.com/sdk-for-javascript/) - S3 uploads
- [Commander.js](https://github.com/tj/commander.js) - CLI framework

---

**Made for AI agents and developers who need simple, powerful image workflows.**
