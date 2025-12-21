# @teamflojo/floimg-ollama

Local AI provider for floimg using [Ollama](https://ollama.ai). Run vision and text models locally with no API key required.

## Features

- **Vision Analysis** - Analyze images with LLaVA or other vision models
- **Text Generation** - Generate text with Llama, Mistral, or other models
- **100% Local** - No API keys, no data leaves your machine
- **Privacy-First** - Perfect for sensitive content

## Prerequisites

1. Install [Ollama](https://ollama.ai)
2. Pull the models you want to use:

```bash
# Vision model
ollama pull llava

# Text model
ollama pull llama3.2
```

## Installation

```bash
npm install @teamflojo/floimg-ollama
```

## Usage

### Vision Analysis

```typescript
import createClient from "@teamflojo/floimg";
import { ollamaVision } from "@teamflojo/floimg-ollama";

const client = createClient();
client.registerVisionProvider(ollamaVision({ model: "llava" }));

const result = await client.analyzeImage({
  provider: "ollama-vision",
  blob: imageBlob,
  params: {
    prompt: "What objects are in this image?",
    outputFormat: "json"
  }
});

console.log(result.content);
```

### Text Generation

```typescript
import createClient from "@teamflojo/floimg";
import { ollamaText } from "@teamflojo/floimg-ollama";

const client = createClient();
client.registerTextProvider(ollamaText({ model: "llama3.2" }));

const result = await client.generateText({
  provider: "ollama-text",
  params: {
    prompt: "Write a creative caption for a sunset photo",
    temperature: 0.8
  }
});

console.log(result.content);
```

### Register Both Providers

```typescript
import createClient from "@teamflojo/floimg";
import ollama from "@teamflojo/floimg-ollama";

const client = createClient();
const [vision, text] = ollama({
  baseUrl: "http://localhost:11434",
  visionModel: "llava",
  textModel: "llama3.2"
});

client.registerVisionProvider(vision);
client.registerTextProvider(text);
```

### In Pipelines

```typescript
await client.run({
  name: "local-image-analysis",
  steps: [
    { kind: "generate", generator: "qr", params: { text: "hello" }, out: "qr" },
    { kind: "vision", in: "qr", provider: "ollama-vision",
      params: { prompt: "What does this QR code contain?" }, out: "analysis" },
    { kind: "text", in: "analysis", provider: "ollama-text",
      params: { prompt: "Summarize this in one sentence" }, out: "summary" }
  ]
});
```

## Configuration

### Vision Provider

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `http://localhost:11434` | Ollama server URL |
| `model` | `llava` | Vision model to use |

### Text Provider

| Option | Default | Description |
|--------|---------|-------------|
| `baseUrl` | `http://localhost:11434` | Ollama server URL |
| `model` | `llama3.2` | Text model to use |

## Supported Models

### Vision Models
- `llava` - LLaVA (default)
- `llava:13b` - LLaVA 13B
- `bakllava` - BakLLaVA

### Text Models
- `llama3.2` - Llama 3.2 (default)
- `llama3.1` - Llama 3.1
- `mistral` - Mistral 7B
- `mixtral` - Mixtral 8x7B
- `codellama` - Code Llama

## License

MIT
