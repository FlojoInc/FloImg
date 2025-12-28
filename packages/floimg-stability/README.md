# @teamflojo/floimg-stability

Stability AI integration for floimg, providing Stable Diffusion image generation and AI-powered transforms.

## Standing on the Shoulders of Giants

This plugin integrates with [Stability AI](https://stability.ai/) and their Stable Diffusion models. We provide a consistent FloImg interface while exposing the full power of Stability's generation and editing capabilities.

- **Full Stability power**: All generation, editing, and upscaling features work
- **Native format**: Use Stability API parameters directly
- **Their docs are your docs**: See [Stability AI documentation](https://platform.stability.ai/docs/api-reference)

FloImg orchestrates the workflow (generate → transform → save). Stability AI does what it does best.

## Installation

```bash
npm install @teamflojo/floimg-stability
# or
pnpm add @teamflojo/floimg-stability
```

## Configuration

Set your Stability AI API key:

```bash
export STABILITY_API_KEY=your_key_here
```

Or pass it directly:

```typescript
import stability from "@teamflojo/floimg-stability";

const generator = stability({ apiKey: "your_key_here" });
```

## Features

### Image Generation (SDXL / SD3)

Generate images using Stable Diffusion models:

```typescript
import { createClient } from "@teamflojo/floimg";
import stability from "@teamflojo/floimg-stability";

const floimg = createClient();
floimg.registerGenerator(stability());

const image = await floimg.generate({
  generator: "stability",
  params: {
    prompt: "A majestic lion in the savanna",
    negativePrompt: "blurry, low quality",
    model: "sd3-large",
    size: "1024x1024",
    stylePreset: "photographic",
  },
});
```

**Parameters:**

| Parameter      | Type   | Default     | Description                              |
| -------------- | ------ | ----------- | ---------------------------------------- |
| prompt         | string | (required)  | Image description                        |
| negativePrompt | string | -           | What to avoid                            |
| model          | string | "sd3-large" | Model variant                            |
| size           | string | "1024x1024" | Image dimensions                         |
| stylePreset    | string | -           | Style preset (photographic, anime, etc.) |
| cfgScale       | number | 7           | Prompt adherence (1-35)                  |
| steps          | number | 30          | Inference steps                          |
| seed           | number | -           | Reproducibility seed                     |

### Image Transforms

AI-powered image transformations:

```typescript
import { stabilityTransform } from "@teamflojo/floimg-stability";

floimg.registerTransformProvider(stabilityTransform());
```

**Available Transforms:**

#### Remove Background

Remove the background from an image:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "removeBackground",
  provider: "stability-transform",
});
```

#### Upscale (Creative Upscale)

AI-powered 4x upscaling:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "upscale",
  provider: "stability-transform",
  params: {
    prompt: "high quality, detailed", // Optional guidance
    creativity: 0.3, // 0-0.35
  },
});
```

#### Search and Replace

Find and replace objects in an image:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "searchAndReplace",
  provider: "stability-transform",
  params: {
    prompt: "a golden retriever",
    searchPrompt: "the dog",
  },
});
```

#### Outpaint

Extend image boundaries:

```typescript
const result = await floimg.transform({
  blob: inputImage,
  op: "outpaint",
  provider: "stability-transform",
  params: {
    prompt: "continue the landscape",
    left: 100,
    right: 100,
    up: 0,
    down: 50,
    creativity: 0.5,
  },
});
```

## Transform Summary

| Operation        | Description              | Required Params      |
| ---------------- | ------------------------ | -------------------- |
| removeBackground | Remove image background  | -                    |
| upscale          | 4x AI upscaling          | -                    |
| searchAndReplace | Find and replace objects | prompt, searchPrompt |
| outpaint         | Extend image boundaries  | prompt               |

## License

MIT
