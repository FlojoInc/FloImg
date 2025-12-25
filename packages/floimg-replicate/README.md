# @teamflojo/floimg-replicate

Replicate AI model integration for floimg, providing access to popular image processing models.

## Installation

```bash
npm install @teamflojo/floimg-replicate
# or
pnpm add @teamflojo/floimg-replicate
```

## Configuration

Set your Replicate API token:

```bash
export REPLICATE_API_TOKEN=your_token_here
```

Or pass it directly:

```typescript
import { replicateTransform } from "@teamflojo/floimg-replicate";

const transform = replicateTransform({ apiToken: "your_token_here" });
```

## Available Transforms

### Face Restoration (GFPGAN)

Restore and enhance faces in photos:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "faceRestore",
  provider: "replicate-transform",
  params: {
    version: "v1.4", // or "v1.3"
    scale: 2, // upscale factor 1-4
  },
});
```

### Colorization (DeOldify)

Colorize black and white images:

```typescript
const result = await floimg.transform({
  blob: bwImage,
  op: "colorize",
  provider: "replicate-transform",
  params: {
    renderFactor: 35, // quality 7-45
    artistic: false, // use artistic model for more vibrant colors
  },
});
```

### Image Upscaling (Real-ESRGAN)

Upscale images with high quality:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "realEsrgan",
  provider: "replicate-transform",
  params: {
    scale: 4, // 2 or 4
    faceEnhance: false, // enable for photos with faces
  },
});
```

### Text-Guided Editing (FLUX Kontext)

Edit images using natural language:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "fluxEdit",
  provider: "replicate-transform",
  params: {
    prompt: "Make the sky more dramatic with storm clouds",
    aspectRatio: "16:9",
    guidanceScale: 3.5,
    numInferenceSteps: 28,
  },
});
```

## Full Example

```typescript
import { createClient } from "@teamflojo/floimg";
import { replicateTransform } from "@teamflojo/floimg-replicate";

const floimg = createClient();

// Register the Replicate transform provider
floimg.registerTransformProvider(
  replicateTransform({
    apiToken: process.env.REPLICATE_API_TOKEN,
  })
);

// Load an image
const image = await floimg.load("./old-photo.jpg");

// Colorize a B&W photo
const colorized = await floimg.transform({
  blob: image,
  op: "colorize",
  provider: "replicate-transform",
  params: { renderFactor: 40 },
});

// Restore faces
const restored = await floimg.transform({
  blob: colorized,
  op: "faceRestore",
  provider: "replicate-transform",
});

// Save result
await floimg.save(restored, "./restored-photo.png");
```

## License

MIT
