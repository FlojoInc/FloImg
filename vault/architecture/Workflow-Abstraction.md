# Workflow Abstraction

Technical deep-dive on floimg's generate→transform→save abstraction.

---

## The Three Primitives

Every image workflow in floimg consists of three operations:

```
generate(generator, params) → ImageBlob
transform(blob, operation, params) → ImageBlob
save(blob, destination) → SaveResult
```

### Why These Three?

These primitives emerged from analyzing common image workflows:

| User Intent                                      | Operations                              |
| ------------------------------------------------ | --------------------------------------- |
| "Create a chart"                                 | generate                                |
| "Create a chart and resize it"                   | generate → transform                    |
| "Create a chart and upload to S3"                | generate → save                         |
| "Create a chart, resize it, add caption, upload" | generate → transform → transform → save |
| "Resize an existing image"                       | transform (with input)                  |

Every workflow reduces to combinations of these three operations.

---

## Operation Details

### generate(generator, params) → ImageBlob

Creates an image from structured parameters.

```typescript
const blob = await floimg.generate({
  generator: 'quickchart',  // Which generator to use
  params: {                 // Generator-specific params
    type: 'bar',
    data: { labels: [...], datasets: [...] }
  }
});
```

**Generators are plugins** — each registered generator handles a specific image type:

| Generator    | Creates                  |
| ------------ | ------------------------ |
| `openai`     | AI images from prompts   |
| `quickchart` | Chart.js charts          |
| `mermaid`    | Diagrams                 |
| `qr`         | QR codes                 |
| `screenshot` | Web page captures        |
| `shapes`     | SVG shapes and gradients |

### transform(blob, operation, params) → ImageBlob

Modifies an existing image.

```typescript
const resized = await floimg.transform({
  blob: chartBlob, // Input image
  op: "resize", // Operation name
  params: { width: 800 }, // Operation-specific params
});
```

**Common operations:**

| Operation    | Purpose                         |
| ------------ | ------------------------------- |
| `resize`     | Change dimensions               |
| `convert`    | Change format (PNG, JPEG, WebP) |
| `blur`       | Apply blur filter               |
| `sharpen`    | Increase sharpness              |
| `addCaption` | Add text overlay                |
| `grayscale`  | Convert to grayscale            |

### save(blob, destination) → SaveResult

Persists an image to storage.

```typescript
const result = await floimg.save(blob, "s3://my-bucket/chart.png");
// or
const result = await floimg.save(blob, "./output/chart.png");
```

**Destinations are auto-detected:**

| Prefix            | Storage Provider     |
| ----------------- | -------------------- |
| `s3://`           | AWS S3 or compatible |
| `./` or `/`       | Local filesystem     |
| (future) `gcs://` | Google Cloud Storage |

---

## ImageBlob: The Universal Currency

`ImageBlob` is the common type that flows between operations.

```typescript
interface ImageBlob {
  buffer: Buffer; // Raw image data
  metadata: {
    width: number;
    height: number;
    format: "png" | "jpeg" | "webp" | "svg" | "avif";
    size: number; // bytes
  };
  id?: string; // For session workspace
}
```

**Why a common type?**

- Any generator's output can feed into any transform
- Any transform's output can feed into any other transform
- Any blob can be saved to any destination
- No format conversion needed between operations

---

## Session Workspace (MCP)

When running as an MCP server, floimg uses a session workspace to avoid passing image bytes between tool calls.

```
~/.floimg/mcp-session/
  ├── abc123.png    # Generated chart
  ├── def456.png    # Resized version
  └── ghi789.png    # With caption
```

**How it works:**

1. `generate` returns an `imageId` instead of raw bytes
2. `transform` accepts `imageId` to reference existing images
3. Images persist for the session duration
4. Workspace is cleaned up when session ends

**Why session workspace?**

- MCP has token limits (~25K) — can't pass base64 images
- Avoids encoding/decoding overhead
- Enables efficient operation chaining
- LLM just references IDs, floimg handles data

---

## Plugin Extension Model

Generators and transforms are plugins that extend the core abstraction.

### Generator Plugin Structure

```typescript
import { createGenerator, GeneratorSchema } from "floimg";

const schema: GeneratorSchema = {
  name: "my-generator",
  description: "Creates images from X",
  parameters: {
    width: { type: "number", default: 800, description: "Image width" },
    text: { type: "string", required: true, description: "Content" },
  },
};

export default createGenerator(schema, async (params, ctx) => {
  // Generate image buffer
  const buffer = await generateMyImage(params);

  // Return ImageBlob
  return ctx.createImageFromBuffer(buffer, "output.png");
});
```

### Why Pass-Through Parameters?

Parameters are passed directly to underlying libraries:

```typescript
// floimg-quickchart passes params directly to Chart.js
await floimg.generate({
  generator: "quickchart",
  params: {
    type: "bar", // Chart.js type
    data: {
      /* Chart.js */
    },
    options: {
      /* Chart.js */
    },
  },
});
```

**Benefits:**

- Full power of underlying library
- No abstraction leakage
- Documentation transfers directly
- Users leverage existing knowledge

---

## Workflow Composition

### Fluent API

The fluent API provides a natural chained syntax for building workflows:

```typescript
import { floimg } from "@teamflojo/floimg";

// Load, transform, save
await floimg
  .from("./input.png")
  .transform("resize", { width: 800 })
  .transform("blur", { sigma: 2 })
  .to("./output.png");

// Generate and save to cloud
await floimg
  .generate("openai", { prompt: "A sunset over mountains" })
  .transform("resize", { width: 1920 })
  .to("s3://bucket/sunset.png");

// Get the final image as a blob
const blob = await floimg.from("./photo.jpg").transform("resize", { width: 400 }).toBlob();

// Vision and text chaining
const results = await floimg
  .from("./photo.jpg")
  .analyze("claude-vision", { prompt: "Describe this image" })
  .text("claude-text", { prompt: "Write a haiku based on this" })
  .run();
```

For custom configurations, create your own fluent facade:

```typescript
import createClient, { createFluent } from '@teamflojo/floimg';

const client = createClient();
// Register custom providers...

const myFloimg = createFluent(client);
await myFloimg.generate('custom', {...}).to('./output.png');
```

### Imperative API

Operations compose naturally with async/await for fine-grained control:

```typescript
// Simple pipeline
const chart = await floimg.generate({ generator: 'quickchart', params: {...} });
const resized = await floimg.transform({ blob: chart, op: 'resize', params: { width: 800 } });
await floimg.save(resized, 's3://bucket/chart.png');

// Multiple transforms
let image = await floimg.generate({...});
image = await floimg.transform({ blob: image, op: 'resize', params: {...} });
image = await floimg.transform({ blob: image, op: 'addCaption', params: {...} });
image = await floimg.transform({ blob: image, op: 'convert', params: { format: 'webp' } });
await floimg.save(image, './output.webp');
```

### YAML Pipelines

For declarative workflows:

```yaml
name: Chart to S3
steps:
  - kind: generate
    generator: quickchart
    params:
      type: bar
      data: { labels: [Q1, Q2], datasets: [...] }
    out: chart

  - kind: transform
    in: chart
    op: resize
    params: { width: 800 }
    out: resized

  - kind: save
    in: resized
    destination: s3://bucket/chart.png
```

---

## Error Handling

Each operation can fail. Errors are typed and descriptive:

```typescript
try {
  await floimg.generate({ generator: "unknown", params: {} });
} catch (error) {
  if (error instanceof GeneratorNotFoundError) {
    // Generator not registered
  } else if (error instanceof GeneratorExecutionError) {
    // Generator failed (e.g., invalid params)
  }
}
```

**Error types:**

- `GeneratorNotFoundError` — Unknown generator name
- `GeneratorExecutionError` — Generator failed
- `TransformNotFoundError` — Unknown transform operation
- `TransformExecutionError` — Transform failed
- `SaveError` — Storage operation failed

---

## Related Documents

- [[Why-floimg-Exists]] — The problems this abstraction solves
- [[Design-Principles]] — Philosophy behind these decisions
- [[Plugin-Architecture]] — Creating custom generators and transforms
