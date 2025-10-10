# Getting Started with imgflo

Welcome! Let's get imgflo set up and generate your first image.

## Installation

```bash
npm install
npm run build
```

## Test the CLI

### 1. Generate an SVG

```bash
node dist/cli/index.js generate \
  --provider svg \
  --name shapes \
  --params '{"type":"gradient","width":1200,"height":630,"color1":"#667eea","color2":"#764ba2"}' \
  --out my-first-image.svg
```

You should see:
```
Generated image saved to: my-first-image.svg
Format: image/svg+xml
Size: 1200x630
```

### 2. Convert to PNG

```bash
node dist/cli/index.js transform \
  --in my-first-image.svg \
  --op convert \
  --to image/png \
  --out my-first-image.png
```

You should see:
```
Transformed image saved to: my-first-image.png
Format: image/png
```

### 3. Upload to S3 (Optional)

First, set up your AWS credentials:

```bash
export AWS_REGION=us-east-1
export S3_BUCKET=your-bucket-name
```

Then upload:

```bash
node dist/cli/index.js upload \
  --in my-first-image.png \
  --key test/my-first-image.png
```

You should see:
```
Image uploaded successfully!
Key: test/my-first-image.png
URL: https://your-bucket-name.s3.amazonaws.com/test/my-first-image.png
```

## Using as a Library

Create a test file `test.ts`:

```typescript
import createClient from './src/index.js';

const imgflo = createClient({
  verbose: true,
  store: {
    default: 'fs',
    fs: {
      basePath: './output'
    }
  }
});

// Generate a gradient
const svg = await imgflo.generate({
  provider: 'svg',
  name: 'shapes',
  params: {
    type: 'gradient',
    width: 1200,
    height: 630,
    color1: '#667eea',
    color2: '#764ba2'
  }
});

console.log('Generated SVG:', svg.width, 'x', svg.height);

// Convert to PNG
const png = await imgflo.transform({
  blob: svg,
  op: 'convert',
  to: 'image/png'
});

console.log('Converted to PNG');

// Save locally
const result = await imgflo.upload({
  blob: png,
  key: 'gradient.png'
});

console.log('Saved to:', result.url);
```

Run it with:
```bash
npx tsx test.ts
```

## What's Next?

1. **Explore Examples**: Check out the `examples/` directory for more use cases
2. **Read the Spec**: See `imgflo-SPEC.md` for the full architecture
3. **Quick Reference**: Check `QUICK_START.md` for common patterns
4. **Configure S3**: Set up your S3 bucket to enable cloud uploads

## Available Shape Types

Try different shapes:

**Gradient:**
```bash
node dist/cli/index.js generate --provider svg --params '{"type":"gradient","color1":"#ff0080","color2":"#7928ca"}' --out gradient.svg
```

**Circle:**
```bash
node dist/cli/index.js generate --provider svg --params '{"type":"circle","width":500,"height":500,"fill":"#f59e0b"}' --out circle.svg
```

**Pattern (dots):**
```bash
node dist/cli/index.js generate --provider svg --params '{"type":"pattern","patternType":"dots"}' --out dots.svg
```

**Pattern (stripes):**
```bash
node dist/cli/index.js generate --provider svg --params '{"type":"pattern","patternType":"stripes"}' --out stripes.svg
```

**Pattern (grid):**
```bash
node dist/cli/index.js generate --provider svg --params '{"type":"pattern","patternType":"grid"}' --out grid.svg
```

## Troubleshooting

**Check your setup:**
```bash
node dist/cli/index.js doctor
```

**TypeScript errors during build?**
```bash
npm run typecheck
```

**Need to rebuild?**
```bash
npm run build
```

## Support

For issues or questions, please open an issue on GitHub.

Happy image generating!
