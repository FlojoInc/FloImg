# @teamflojo/floimg-google

Google AI integration for floimg, providing Gemini image generation, editing, and AI capabilities.

## Standing on the Shoulders of Giants

This plugin integrates with [Google's Gemini](https://ai.google.dev/) multimodal AI. We provide a consistent FloImg interface while exposing the full power of Google's models.

- **Full Gemini power**: Native image generation and editing with all Gemini parameters
- **Native format**: Use Gemini parameters, not a FloImg abstraction
- **Their docs are your docs**: See [Google AI documentation](https://ai.google.dev/gemini-api/docs/imagen)

FloImg orchestrates the workflow (generate -> transform -> save). Gemini does what it does best.

## Installation

```bash
npm install @teamflojo/floimg-google
# or
pnpm add @teamflojo/floimg-google
```

## Configuration

Set your Google AI API key:

```bash
export GOOGLE_AI_API_KEY=your_key_here
```

Or pass it directly:

```typescript
import { geminiGenerate } from "@teamflojo/floimg-google";

const generator = geminiGenerate({ apiKey: "your_key_here" });
```

## Features

### Image Generation (Gemini)

Generate images using Gemini's native image generation:

```typescript
import { createClient } from "@teamflojo/floimg";
import { geminiGenerate } from "@teamflojo/floimg-google";

const floimg = createClient();
floimg.registerGenerator(geminiGenerate());

const image = await floimg.generate({
  generator: "gemini-generate",
  params: {
    prompt: "A serene mountain landscape at sunset",
    aspectRatio: "16:9",
    imageSize: "2K",
  },
});
```

**Parameters:**

| Parameter           | Type                 | Default                  | Description                                       |
| ------------------- | -------------------- | ------------------------ | ------------------------------------------------- |
| prompt              | string               | (required)               | Image description                                 |
| prePrompt           | string               | "Generate an image..."   | Instructions prepended to prompt                  |
| model               | string               | "gemini-2.5-flash-image" | Gemini model to use                               |
| aspectRatio         | string               | "1:1"                    | Output aspect ratio (1:1, 16:9, 9:16, etc.)       |
| imageSize           | "1K" \| "2K" \| "4K" | "1K"                     | Output resolution                                 |
| groundingWithSearch | boolean              | false                    | Enable Google Search grounding for real-time data |
| enhancePrompt       | boolean              | false                    | Auto-enhance prompt using best practices          |
| referenceImages     | ImageBlob[]          | undefined                | Up to 14 reference images for style/consistency   |

### Image Editing (Gemini Transform)

Edit existing images using Gemini's multimodal capabilities:

```typescript
import { geminiTransform } from "@teamflojo/floimg-google";

floimg.registerTransformProvider(geminiTransform());

const edited = await floimg.transform({
  blob: inputImage,
  op: "edit",
  provider: "gemini-transform",
  params: {
    prompt: "Make the sky more vibrant and add clouds",
    enhancePrompt: true,
  },
});
```

**Transform Parameters:**

| Parameter       | Type    | Default   | Description                              |
| --------------- | ------- | --------- | ---------------------------------------- |
| prompt          | string  | (req.)    | Describe the edits to make               |
| prePrompt       | string  | "Edit..." | Instructions prepended to prompt         |
| enhancePrompt   | boolean | false     | Auto-enhance prompt using best practices |
| referenceImages | array   | []        | Up to 13 additional reference images     |

### Prompt Enhancement

The `enhancePrompt` option automatically expands your prompts based on Google's image generation best practices. It detects the type of image you're creating and applies appropriate enhancements.

```typescript
// Without enhancement
const image = await floimg.generate({
  generator: "gemini-generate",
  params: {
    prompt: "photo of a mountain",
  },
});
// Prompt sent: "photo of a mountain"

// With enhancement
const image = await floimg.generate({
  generator: "gemini-generate",
  params: {
    prompt: "photo of a mountain",
    enhancePrompt: true,
  },
});
// Prompt sent: "A photorealistic photo of a mountain. The scene is
// illuminated by soft natural light. Captured with professional
// photography equipment, sharp focus, high detail"
```

**Detected Prompt Types:**

| Type           | Keywords                          | Enhancement Style                   |
| -------------- | --------------------------------- | ----------------------------------- |
| photorealistic | photo, realistic, camera, lens    | Adds lighting, camera details       |
| portrait       | portrait, headshot, face, person  | Photography terms, focus details    |
| landscape      | landscape, mountain, ocean, sky   | Lighting, atmosphere                |
| illustration   | illustration, cartoon, anime, art | Style, color palette                |
| logo           | logo, brand, icon, emblem         | Modern, professional, scalable      |
| product        | product, e-commerce, mockup       | Studio lighting, neutral background |
| minimalist     | minimalist, simple, clean         | Negative space, subtle lighting     |
| edit           | change, modify, remove, add       | Preservation instructions           |

**Using Enhancement Utilities Directly:**

```typescript
import { enhancePrompt, detectPromptType, isPromptDetailed } from "@teamflojo/floimg-google";

// Detect prompt type
const type = detectPromptType("photo of a sunset"); // "photorealistic"

// Check if prompt needs enhancement
const needsEnhancement = !isPromptDetailed("cat"); // true

// Enhance a prompt manually
const enhanced = enhancePrompt("photo of a mountain", "generate");
```

### Vision Analysis (Gemini Vision)

Analyze images using Gemini's multimodal understanding:

```typescript
import { geminiVision } from "@teamflojo/floimg-google";

floimg.registerVisionProvider(geminiVision());

const analysis = await floimg.analyze({
  blob: inputImage,
  provider: "gemini-vision",
  params: {
    prompt: "Describe this image in detail",
  },
});
```

### Text Generation (Gemini Text)

Generate text for image workflows:

```typescript
import { geminiText } from "@teamflojo/floimg-google";

floimg.registerTextProvider(geminiText());

const result = await floimg.text({
  provider: "gemini-text",
  params: {
    prompt: "Write a caption for this sunset photo",
    context: analysis.content,
  },
});
```

## Available Models

| Model                      | Description                                 |
| -------------------------- | ------------------------------------------- |
| gemini-2.5-flash-image     | Fast, high-volume, low-latency (default)    |
| gemini-3-pro-image-preview | Professional quality, better text rendering |

## License

MIT
