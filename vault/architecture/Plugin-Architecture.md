# Plugin Architecture

How the floimg plugin system works.

## Overview

floimg uses a plugin-based architecture where functionality is split across focused packages:

- **floimg** (core) - Base library, CLI
- **floimg-mcp** - MCP server for AI agents
- **floimg-{name}** (plugins) - Specialized generators/transforms

## Plugin Types

### Generators

Create images from parameters (no input image required).

```typescript
import { createGenerator, GeneratorSchema } from "floimg";

const schema: GeneratorSchema = {
  name: "my-generator",
  description: "Creates images from parameters",
  parameters: {
    width: { type: "number", default: 800 },
    height: { type: "number", default: 600 },
    // ...
  },
};

export const myGenerator = createGenerator(schema, async (params, ctx) => {
  // Create image buffer
  const buffer = await createImage(params);
  return ctx.createImageFromBuffer(buffer, "output.png");
});
```

### Transforms

Modify existing images.

```typescript
import { createTransform, TransformSchema } from "floimg";

const schema: TransformSchema = {
  name: "my-transform",
  description: "Transforms input images",
  parameters: {
    intensity: { type: "number", default: 1.0 },
    // ...
  },
};

export const myTransform = createTransform(schema, async (input, params, ctx) => {
  // Transform input image
  const buffer = await transformImage(input.buffer, params);
  return ctx.createImageFromBuffer(buffer, "output.png");
});
```

## Plugin Registration

Plugins are registered with the floimg runtime:

```typescript
import { Imgflo } from "floimg";
import { qrGenerator } from "floimg-qr";
import { mermaidGenerator } from "floimg-mermaid";

const floimg = new Imgflo({
  generators: [qrGenerator, mermaidGenerator],
  transforms: [],
});
```

## Package Structure

Each plugin package follows:

```
packages/floimg-{name}/
├── src/
│   └── index.ts      # Exports generators/transforms
├── package.json      # Peer dep on floimg
├── tsconfig.json
├── README.md
└── vitest.config.ts
```

## Dependencies

- Plugins declare `floimg` as a **peer dependency**
- This allows users to control which floimg version they use
- Plugin functionality is self-contained

## Current Plugins

| Package           | Type      | Description                         |
| ----------------- | --------- | ----------------------------------- |
| floimg-qr         | Generator | QR code generation                  |
| floimg-mermaid    | Generator | Mermaid diagram rendering           |
| floimg-d3         | Generator | D3 visualizations                   |
| floimg-quickchart | Generator | Chart generation via QuickChart     |
| floimg-screenshot | Generator | Web page screenshots via Playwright |

## Creating New Plugins

See [[MONOREPO]] for step-by-step plugin creation guide.

Key considerations:

1. Keep plugins focused on one domain
2. Provide sensible defaults for all parameters
3. Include comprehensive parameter schemas for MCP/AI usage
4. Export both individual generators/transforms and a combined plugin object
