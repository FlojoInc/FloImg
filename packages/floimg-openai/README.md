# @teamflojo/floimg-openai

OpenAI integration for floimg, providing DALL-E image generation, GPT-4 Vision analysis, and image transforms.

## Standing on the Shoulders of Giants

This plugin integrates with [OpenAI's DALL-E](https://openai.com/dall-e-3) and [GPT-4 Vision](https://platform.openai.com/docs/guides/vision) APIs. We provide a consistent FloImg interface while exposing the full power of OpenAI's models.

- **Full OpenAI power**: All generation parameters, model options, and features work
- **Native format**: Use OpenAI parameters, not a FloImg abstraction
- **Their docs are your docs**: See [OpenAI API documentation](https://platform.openai.com/docs/api-reference/images)

FloImg orchestrates the workflow (generate → transform → save). OpenAI does what it does best.

## Installation

```bash
npm install @teamflojo/floimg-openai
# or
pnpm add @teamflojo/floimg-openai
```

## Configuration

Set your OpenAI API key:

```bash
export OPENAI_API_KEY=your_key_here
```

Or pass it directly:

```typescript
import openai from "@teamflojo/floimg-openai";

const generator = openai({ apiKey: "your_key_here" });
```

## Features

### Image Generation (DALL-E)

Generate images using DALL-E 2 or DALL-E 3:

```typescript
import { createClient } from "@teamflojo/floimg";
import openai from "@teamflojo/floimg-openai";

const floimg = createClient();
floimg.registerGenerator(openai());

const image = await floimg.generate({
  generator: "openai",
  params: {
    prompt: "A serene mountain landscape at sunset",
    model: "dall-e-3",
    size: "1024x1024",
    quality: "hd",
    style: "vivid",
  },
});
```

**Parameters:**

| Parameter | Type                     | Default     | Description             |
| --------- | ------------------------ | ----------- | ----------------------- |
| prompt    | string                   | (required)  | Image description       |
| model     | "dall-e-2" \| "dall-e-3" | "dall-e-3"  | Model to use            |
| size      | string                   | "1024x1024" | Image dimensions        |
| quality   | "standard" \| "hd"       | "standard"  | Quality (DALL-E 3 only) |
| style     | "vivid" \| "natural"     | "vivid"     | Style (DALL-E 3 only)   |

### Image Transforms

Transform existing images using DALL-E 2:

```typescript
import { openaiTransform } from "@teamflojo/floimg-openai";

floimg.registerTransformProvider(openaiTransform());

// Edit/inpaint an image
const edited = await floimg.transform({
  blob: inputImage,
  op: "edit",
  provider: "openai-transform",
  params: {
    prompt: "Add a sunset in the background",
    size: "1024x1024",
  },
});

// Generate variations
const variation = await floimg.transform({
  blob: inputImage,
  op: "variations",
  provider: "openai-transform",
  params: {
    size: "1024x1024",
  },
});
```

**Available Transforms:**

| Operation  | Description                              |
| ---------- | ---------------------------------------- |
| edit       | Edit/inpaint an image with optional mask |
| variations | Generate variations of an image          |

### Vision Analysis (GPT-4V)

Analyze images using GPT-4 Vision:

```typescript
import { openaiVision } from "@teamflojo/floimg-openai";

floimg.registerVisionProvider(openaiVision());

const analysis = await floimg.analyze({
  blob: inputImage,
  provider: "openai-vision",
  params: {
    prompt: "Describe this image in detail",
    outputFormat: "json",
  },
});
```

### Text Generation (GPT-4)

Generate text for image workflows:

```typescript
import { openaiText } from "@teamflojo/floimg-openai";

floimg.registerTextProvider(openaiText());

const result = await floimg.text({
  provider: "openai-text",
  params: {
    prompt: "Write a caption for this sunset photo",
    context: analysis.content, // From vision analysis
  },
});
```

## License

MIT
