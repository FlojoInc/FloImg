# @teamflojo/floimg-vectorize

Vectorize transform plugin for FloImg — convert raster images (PNG, JPEG, WebP) to SVG vector graphics.

## Installation

```bash
npm install @teamflojo/floimg-vectorize
# or
pnpm add @teamflojo/floimg-vectorize
```

## Usage

```typescript
import createClient from "@teamflojo/floimg";
import { vectorizeTransform } from "@teamflojo/floimg-vectorize";

const floimg = createClient();
floimg.registerTransformProvider(vectorizeTransform());

// Simple usage - convert any raster image to SVG
const svg = await floimg.transform({
  blob: inputImage,
  op: "vectorize",
  provider: "vectorize",
});

// With options
const svg = await floimg.transform({
  blob: inputImage,
  op: "vectorize",
  provider: "vectorize",
  params: {
    colorPrecision: 6, // Colors per channel (1-8)
    filterSpeckle: 4, // Remove artifacts < N pixels
    simplify: "spline", // Path simplification mode
  },
});
```

## Parameters

| Parameter        | Type                            | Default  | Description                                             |
| ---------------- | ------------------------------- | -------- | ------------------------------------------------------- |
| `colorPrecision` | number (1-8)                    | 6        | Colors per channel. Higher values preserve more colors. |
| `filterSpeckle`  | number (0-10)                   | 4        | Remove small artifacts under this pixel size.           |
| `simplify`       | "none" \| "polygon" \| "spline" | "spline" | Path simplification mode.                               |

### Simplify Modes

- **none** — Preserve all detail (largest file size)
- **polygon** — Simplify to straight line segments
- **spline** — Smooth Bézier curves (recommended for most use cases)

## Best Use Cases

✅ **Recommended for:**

- AI-generated logos and icons
- Flat illustrations
- Line art and diagrams
- Text and typography

⚠️ **Not recommended for:**

- Photographs (produces noisy output)
- Complex gradients (quantized to solid colors)
- Images with subtle color transitions

## Example Workflow

Convert an AI-generated logo to a scalable SVG:

```typescript
import createClient from "@teamflojo/floimg";
import openai from "@teamflojo/floimg-openai";
import { vectorizeTransform } from "@teamflojo/floimg-vectorize";

const floimg = createClient();
floimg.registerGenerator(openai({ apiKey: process.env.OPENAI_API_KEY }));
floimg.registerTransformProvider(vectorizeTransform());

// Generate a logo with DALL-E
const logo = await floimg.generate({
  generator: "openai",
  params: {
    prompt: "minimalist coffee shop logo, flat design, white background",
    size: "1024x1024",
  },
});

// Convert to SVG
const vectorLogo = await floimg.transform({
  blob: logo,
  op: "vectorize",
  provider: "vectorize",
});

// Save as SVG
await floimg.save({ blob: vectorLogo, path: "./logo.svg" });
```

## YAML Pipeline

```yaml
steps:
  - kind: generate
    generator: openai
    params:
      prompt: "minimalist logo for a coffee shop"
    out: $logo

  - kind: transform
    op: vectorize
    provider: vectorize
    in: $logo
    params:
      colorPrecision: 6
    out: $vector

  - kind: save
    provider: fs
    in: $vector
    params:
      path: "./logo.svg"
```

## Technical Details

This plugin uses [vtracer](https://github.com/nicholasxjy/vtracer) via [@neplex/vectorizer](https://www.npmjs.com/package/@neplex/vectorizer) for bitmap-to-vector conversion:

- **Full color support** — Not limited to monochrome like Potrace
- **Fast** — Typically 2-7ms per image
- **No external APIs** — Runs entirely offline
- **Layered output** — Produces SVG with proper color layers

## License

MIT
