# 🧠 Painterly — Image Generation & Transformation Library (Spec)

A TypeScript library + CLI for generating, transforming, and uploading images programmatically. Designed for creative code (SVG, patterns) and AI image generation, with a modular pipeline and plugin architecture.

---

## Overview

**Goals**

- One API for:
  - **Generate**: SVG patterns (code) or AI images (OpenAI, Stability, etc.)
  - **Transform**: Resize, convert formats (SVG → PNG/JPEG/WebP/AVIF), composite
  - **Store**: Upload to S3 or other storage backends
- Works as both **importable library** and **CLI**
- **Pipeline** oriented: compose steps declaratively or via code
- Extensible via providers/plugins

**Tech Stack**

- TypeScript, Node 18+
- Modular providers (SVG, AI, Transform, Store)
- ESM + CJS builds
- Type-safe APIs with clear provider interfaces

---

## Directory Structure

```
/src
  /core
    client.ts
    types.ts
    pipeline.ts
    errors.ts
    logger.ts
    cache.ts
  /providers
    /svg
    /ai
    /transform
    /store
  /cli
    index.ts
    commands/
      generate.ts
      transform.ts
      upload.ts
      run.ts
  /plugins
    index.ts
    examples/
  /utils
    file.ts
    mime.ts
    hash.ts
  index.ts
/config
  schema.json
```

---

## Core Types

### ImageBlob

```ts
export type MimeType =
  | "image/svg+xml"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif";

export interface ImageBlob {
  bytes: Buffer;
  mime: MimeType;
  width?: number;
  height?: number;
  metadata?: Record<string, unknown>;
  source?: string; // e.g., "svg:trianglify"
}
```

---

## Client API

```ts
export interface PainterlyConfig {
  cacheDir?: string;
  verbose?: boolean;
  svg?: { default?: string; [name: string]: unknown };
  ai?: { default?: string; [name: string]: unknown };
  transform?: { default?: string; [name: string]: unknown };
  store?: { default?: string; [name: string]: unknown };
}

export default class Painterly {
  constructor(cfg?: PainterlyConfig);

  generate(input: GenerateInput): Promise<ImageBlob>;
  transform(input: TransformInput): Promise<ImageBlob>;
  upload(input: UploadInput): Promise<UploadResult>;
  run(pipeline: Pipeline): Promise<PipelineResult[]>;

  providers: {
    svg: Record<string, SvgProvider>;
    ai: Record<string, AiProvider>;
    transform: Record<string, TransformProvider>;
    store: Record<string, StoreProvider>;
  };
}
```

---

## Provider Interfaces

```ts
export interface SvgProvider {
  name: string;
  generate(params: Record<string, unknown>): Promise<ImageBlob>;
}

export interface AiProvider {
  name: string;
  generate(params: {
    prompt: string;
    size?: `${number}x${number}`;
    style?: string;
    seed?: number;
    format?: "png"|"jpeg"|"webp";
  }): Promise<ImageBlob>;
}

export interface TransformProvider {
  name: string;
  convert(input: ImageBlob, to: MimeType): Promise<ImageBlob>;
  resize?(input: ImageBlob, opts: { width?: number; height?: number; fit?: "cover"|"contain"|"fill" }): Promise<ImageBlob>;
  composite?(base: ImageBlob, overlays: Array<{ blob: ImageBlob; left: number; top: number }>): Promise<ImageBlob>;
  optimizeSvg?(svg: ImageBlob): Promise<ImageBlob>;
}

export interface StoreProvider {
  name: string;
  put(input: { key: string; blob: ImageBlob; headers?: Record<string,string> }): Promise<UploadResult>;
  getUrl?(key: string): Promise<string>;
}

export interface UploadResult {
  key: string;
  url?: string;
  etag?: string;
}
```

---

## Pipelines

Pipelines are declarative JSON/YAML or TS objects describing generation and transformation steps.

```ts
export type Step =
  | { kind: "generate"; provider: "svg"|"ai"; name?: string; params: Record<string, unknown>; out: string }
  | { kind: "transform"; op: "convert"|"resize"|"composite"|"optimizeSvg"; in: string; params: Record<string, unknown>; out: string }
  | { kind: "upload"; provider?: string; in: string; key: string; out?: string };

export interface Pipeline {
  name?: string;
  steps: Step[];
  concurrency?: number;
  outDir?: string;
}
```

---

## Built-in Providers

### SVG

- `trianglify`: low-poly patterns
- `satori`: HTML/JSX → SVG
- `shapes`: procedural geometry (stripes, noise, etc.)

### AI

- `openai`: GPT image generation
- `stability`: Stable Diffusion

### Transform

- `sharp+resvg`: convert, resize, composite, optimize SVG

### Store

- `s3`: S3 bucket upload (multipart)
- `fs`: local filesystem

---

## Configuration

`painterly.config.ts`:

```ts
import { defineConfig } from "painterly/config";

export default defineConfig({
  cacheDir: ".painterly",
  verbose: true,
  ai: { default: "openai", openai: { apiKey: process.env.OPENAI_API_KEY } },
  svg: { default: "trianglify" },
  transform: { default: "sharp+resvg" },
  store: { default: "s3", s3: { region: "us-east-1", bucket: "my-bucket" } },
});
```

---

## Usage Examples

### Library API

**SVG → PNG → Upload**

```ts
import Painterly from "painterly";

const p = new Painterly({
  store: { default: "s3", s3: { region: "us-east-1", bucket: "assets" } },
});

const svg = await p.generate({
  provider: "svg",
  name: "trianglify",
  params: { width: 1600, height: 900 },
});

const png = await p.transform({ in: svg, op: "convert", to: "image/png" });
const res = await p.upload({ key: "generated/pattern.png", blob: png });
console.log(res.url);
```

---

### AI → JPEG → Upload

```ts
const img = await p.generate({
  provider: "ai",
  name: "openai",
  params: { prompt: "flat illustration of a cozy coding desk", size: "1024x1024" },
});

const jpg = await p.transform({ in: img, op: "convert", to: "image/jpeg" });
await p.upload({ key: "generated/ai/desk.jpg", blob: jpg });
```

---

### Pipeline Example

```ts
await p.run({
  name: "og-card",
  steps: [
    { kind: "generate", provider: "svg", name: "satori", params: { width: 1200, height: 630, html: "<div>Hello Flojo</div>" }, out: "og_svg" },
    { kind: "transform", op: "convert", in: "og_svg", params: { to: "image/png" }, out: "og_png" },
    { kind: "upload", in: "og_png", key: "og/hello.png" }
  ]
});
```

---

## CLI

Installed as `painterly`.

```
painterly generate [--provider svg|ai] [--name trianglify|openai] --params ./params.json --out out.png
painterly transform --in in.svg --op convert --to image/png --out out.png
painterly upload --in out.png --key generated/out.png [--store s3]
painterly run --pipeline ./pipeline.yml
painterly doctor
```

### Example Pipeline (YAML)

```yaml
name: banner
steps:
  - kind: generate
    provider: svg
    name: trianglify
    params: { width: 1600, height: 900, cellSize: 75 }
    out: bg
  - kind: transform
    op: convert
    in: bg
    params: { to: image/png }
    out: bg_png
  - kind: upload
    in: bg_png
    key: banners/bg.png
```

---

## Caching

- Content hashes for deterministic caching
- `.painterly/` cache dir by default
- CLI supports `--force` to bypass cache

---

## Extensibility

Custom providers can be registered at runtime or shipped as `painterly-plugin-*` packages.

```ts
p.providers.svg["my-noise"] = {
  name: "my-noise",
  async generate(params) {
    return { bytes: Buffer.from("<svg>...</svg>"), mime: "image/svg+xml" };
  },
};
```

---

## Security & Deployment

- Prefer env vars or instance roles for credentials
- Generate pre-signed URLs for browser uploads
- Sanitize HTML inputs for Satori
- Guard against decompression bombs and oversized images

---

## Testing

- Unit tests for each provider
- Snapshot tests for small images
- E2E: pipeline runs + S3 verification
- Mock S3 with local FS provider in dev

---

## Roadmap

- Worker mode (`painterly worker --concurrency 4`)
- Spritesheet/atlas helpers
- Text layout + font loading
- CDN helper utilities

---

## Implementation Checklist

- [ ] Core types + client
- [ ] SVG providers (trianglify, satori)
- [ ] AI provider (OpenAI)
- [ ] Transform (sharp + resvg)
- [ ] Store (S3 + fs)
- [ ] CLI commands
- [ ] Cache + hashing
- [ ] Documentation & examples
