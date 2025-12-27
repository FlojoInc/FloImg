# Glossary

Key terminology for the floimg project. Consistent usage ensures clear communication across code, docs, and discussions.

---

## Product Names

| Term              | Usage                                                                       |
| ----------------- | --------------------------------------------------------------------------- |
| **FloImg**        | The project name. Capital F, capital I. Never "Floimg" or "FloIMG".         |
| **floimg**        | The npm package name (`@teamflojo/floimg`). Lowercase in code/CLI contexts. |
| **FloImg Studio** | The visual workflow builder in `apps/studio/`.                              |

---

## Core Primitives

The three fundamental operations that define floimg:

### Generate

Create an image from a specification. The "source" in a workflow.

```typescript
const image = await floimg.generate({
  generator: 'quickchart',
  params: { type: 'bar', data: {...} }
});
```

### Transform

Modify an existing image. Can be chained multiple times.

```typescript
const resized = await floimg.transform({
  blob: image,
  op: "resize",
  params: { width: 800 },
});
```

### Save

Persist an image to a destination (filesystem, S3, etc.).

```typescript
await floimg.save(resized, "s3://bucket/chart.png");
```

---

## Architecture Terms

### Generator

A plugin that implements `generate()`. Creates images from parameters.

**Examples**: `floimg-quickchart` (charts), `floimg-mermaid` (diagrams), `floimg-qr` (QR codes)

### Transform

An operation that modifies images. Built into core (`@teamflojo/floimg`).

**Examples**: resize, crop, rotate, blur, composite

### Provider

A backend service that powers generators or transforms.

**Examples**: Sharp (image processing), OpenAI (AI generation), Playwright (screenshots)

### Plugin

A package that extends floimg's capabilities. Named `floimg-{name}`.

**Pattern**: Plugins register generators via `floimg.registerGenerator()`.

### ImageBlob

The internal representation of an image flowing through a pipeline. Contains the image buffer and metadata.

### Pipeline / Workflow

A sequence of operations: `generate → transform(s) → save`. The core abstraction.

---

## Key Concepts

### Deterministic vs Probabilistic

**Deterministic**: Same input always produces identical output. Core floimg transforms (resize, crop, blur) are deterministic.

**Probabilistic**: Output may vary between runs. AI image generation is probabilistic.

**Key insight**: floimg bridges both—use AI for creative generation, deterministic transforms for precise editing.

### MCP (Model Context Protocol)

Protocol for exposing floimg as tools to LLM agents. The core package includes an MCP server.

### Workflow Abstraction

The unified `generate → transform → save` pattern that works consistently across all image types and providers.

---

## Directory Structure

| Path                 | Purpose                                            |
| -------------------- | -------------------------------------------------- |
| `packages/floimg/`   | Core library (generate, transform, save, CLI, MCP) |
| `packages/floimg-*/` | Generator plugins                                  |
| `apps/studio/`       | Visual workflow builder                            |
| `vault/`             | Project documentation                              |

---

## Related Documents

- [[Why-floimg-Exists]] - The problems floimg solves
- [[Design-Principles]] - Architectural philosophy
- [[Plugin-Architecture]] - How generators work
- [[Workflow-Abstraction]] - Technical deep-dive
