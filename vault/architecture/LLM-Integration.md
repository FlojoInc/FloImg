# LLM Integration

How floimg works with Large Language Models.

## Two Integration Modes

floimg integrates with LLMs in two complementary ways:

1. **LLMs as Orchestrators** - Claude/GPT use floimg tools via MCP
2. **LLMs as Providers** - floimg uses LLM APIs for vision/text within workflows

```
┌─────────────────────────────────────────────────────────────┐
│                    Mode 1: LLM as Orchestrator              │
│  ┌────────────┐     MCP Tools      ┌────────────────────┐  │
│  │   Claude   │ ──────────────────>│      floimg        │  │
│  │   GPT-4    │ <──────────────────│  (tool execution)  │  │
│  └────────────┘     Results        └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Mode 2: LLM as Provider                  │
│  ┌────────────┐                    ┌────────────────────┐  │
│  │   floimg   │ ──────────────────>│   OpenAI / Ollama  │  │
│  │  workflow  │ <──────────────────│   Claude / Gemini  │  │
│  └────────────┘   Vision/Text API  └────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Mode 1: LLMs as Orchestrators

### Division of Labor

floimg and LLMs complement each other:

| LLM's Job                    | floimg's Job                 |
| ---------------------------- | ---------------------------- |
| Parse natural language       | Execute structured workflows |
| Extract data from text       | Handle image operations      |
| Choose generators/operations | Return predictable results   |
| Construct workflow steps     | Manage storage               |

## Example Flow

**User to Claude:**

> "Create a bar chart with sales data, resize to 800px, upload to S3"

**Claude processes:**

1. Extracts data: `{labels: [...], values: [...]}`
2. Constructs workflow:
   ```javascript
   run_pipeline({
     steps: [
       { generate: { generator: 'quickchart', params: {...data...} } },
       { transform: { operation: 'resize', params: { width: 800 } } },
       { save: { destination: 's3://bucket/chart.png' } }
     ]
   })
   ```

**floimg executes** and returns the final image URL.

## Workflow Abstraction

floimg provides consistent primitives:

| User Request                    | Workflow                                    | Output                 |
| ------------------------------- | ------------------------------------------- | ---------------------- |
| _"Create a bar chart"_          | `generate(quickchart, {...})`               | Chart.js visualization |
| _"Make a QR code"_              | `generate(qr, {text: url})`                 | Scannable QR code      |
| _"Draw a flowchart, resize it"_ | `generate(mermaid) → transform(resize)`     | Diagram                |
| _"Generate AI image"_           | `generate(openai, {prompt})`                | DALL-E image           |
| _"Screenshot site as PNG"_      | `generate(screenshot) → transform(convert)` | PNG screenshot         |

## What floimg Does NOT Do

floimg is intentionally limited:

- **Does NOT parse natural language** - That's the LLM's job
- **Does NOT extract data** - LLM extracts chart data, colors, etc.
- **Does NOT infer steps** - LLM decides what operations to run
- **Does NOT guess parameters** - Explicit params only

This separation keeps floimg deterministic and predictable.

## MCP Integration

The MCP server (`@teamflojo/floimg-mcp`) exposes floimg to Claude Code:

```bash
npx @teamflojo/floimg-mcp  # Start MCP server
```

Claude can then use natural language:

- "Create a QR code for this URL"
- "Generate a bar chart with this data"
- "Take a screenshot of example.com"

The MCP server routes to the appropriate generator automatically.

**See [[MCP-Server-Architecture]] for technical details.**

---

## Mode 2: LLMs as Providers

floimg can use LLM APIs for vision analysis and text generation within workflows.

### Provider Types

| Provider Type      | Purpose        | Example Use Cases                                 |
| ------------------ | -------------- | ------------------------------------------------- |
| **VisionProvider** | Analyze images | Describe image, extract data, detect objects      |
| **TextProvider**   | Generate text  | Create prompts, write descriptions, format output |

### Supported Providers

| Provider  | Vision        | Text          | Image Gen | Notes                    |
| --------- | ------------- | ------------- | --------- | ------------------------ |
| OpenAI    | GPT-4V        | GPT-4         | DALL-E 3  | Included in core         |
| Anthropic | Claude Vision | Claude        | -         | floimg-anthropic package |
| Ollama    | LLaVA         | Llama/Mistral | -         | floimg-ollama (local)    |
| Google    | Gemini Vision | Gemini        | Imagen    | floimg-gemini package    |

### Data Types

Vision and text nodes output `DataBlob` instead of `ImageBlob`:

```typescript
interface DataBlob {
  type: "text" | "json";
  content: string; // Raw string content
  parsed?: Record<string, unknown>; // Parsed JSON (if type is "json")
  source?: string; // e.g., "ai:openai-vision:gpt-4o"
}
```

### Example: Vision → Text Chain

```typescript
const client = createClient({
  ai: { openai: { apiKey: process.env.OPENAI_API_KEY } }
});

await client.run({
  name: "image-to-prompt",
  steps: [
    { kind: "generate", generator: "quickchart", params: {...}, out: "chart" },
    { kind: "vision", in: "chart", provider: "openai-vision",
      params: { prompt: "Describe this chart" }, out: "description" },
    { kind: "text", in: "description", provider: "openai-text",
      params: { prompt: "Convert this to a DALL-E prompt" }, out: "prompt" }
  ]
});
```

### BYOK (Bring Your Own Key)

AI providers require API keys. floimg never bundles keys:

```typescript
// Via config
const client = createClient({
  ai: {
    openai: { apiKey: "sk-..." },
    anthropic: { apiKey: "sk-ant-..." },
    ollama: { baseUrl: "http://localhost:11434" }, // No key needed
  },
});

// Via environment
// OPENAI_API_KEY, ANTHROPIC_API_KEY, etc.
```

### Local Models (Ollama)

For privacy or offline use, Ollama runs models locally:

```typescript
import { ollamaVision, ollamaText } from "floimg-ollama";

const client = createClient();
client.registerVisionProvider(ollamaVision({ model: "llava" }));
client.registerTextProvider(ollamaText({ model: "llama3" }));
```

No API key, no data leaves your machine.

---

## Implementation Status

| Feature                  | Status  | Location                            |
| ------------------------ | ------- | ----------------------------------- |
| DataBlob type            | Done    | `floimg/src/core/types.ts`          |
| VisionProvider interface | Done    | `floimg/src/core/types.ts`          |
| TextProvider interface   | Done    | `floimg/src/core/types.ts`          |
| analyzeImage() method    | Done    | `floimg/src/core/client.ts`         |
| generateText() method    | Done    | `floimg/src/core/client.ts`         |
| OpenAI Vision (GPT-4V)   | Done    | `floimg/src/providers/ai/openai.ts` |
| OpenAI Text (GPT-4)      | Done    | `floimg/src/providers/ai/openai.ts` |
| floimg-ollama package    | Done    | `packages/floimg-ollama/`           |
| analyze_image MCP tool   | Done    | `floimg-mcp/src/server.ts`          |
| generate_text MCP tool   | Done    | `floimg-mcp/src/server.ts`          |
| floimg-studio VisionNode | Done    | `floimg-studio/packages/frontend/`  |
| floimg-studio TextNode   | Done    | `floimg-studio/packages/frontend/`  |
| floimg-studio AISettings | Done    | `floimg-studio/packages/frontend/`  |
| Anthropic provider       | Planned | `packages/floimg-anthropic/`        |
| Gemini provider          | Planned | `packages/floimg-gemini/`           |

---

## Related Documents

- [[MCP-Server-Architecture]] - MCP implementation details
- [[Workflow-Abstraction]] - The generate/transform/save primitives
- [[Why-floimg-Exists]] - Why deterministic execution matters
- [[Pipeline-Execution-Engine]] - How workflows execute with dependency graphs
