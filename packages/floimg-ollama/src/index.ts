import { Ollama } from "ollama";
import type {
  VisionProvider,
  VisionProviderSchema,
  TextProvider,
  TextProviderSchema,
  ImageBlob,
  DataBlob,
} from "@teamflojo/floimg";

// ============================================================================
// Configuration
// ============================================================================

export interface OllamaConfig {
  /** Ollama server URL (default: http://localhost:11434) */
  baseUrl?: string;
}

export interface OllamaVisionConfig extends OllamaConfig {
  /** Vision model to use (default: llava) */
  model?: string;
}

export interface OllamaTextConfig extends OllamaConfig {
  /** Text model to use (default: llama3.2) */
  model?: string;
}

// ============================================================================
// Vision Provider - LLaVA Image Analysis
// ============================================================================

export interface OllamaVisionParams {
  prompt?: string;
  outputFormat?: "text" | "json";
}

/**
 * Schema for the Ollama Vision provider
 */
export const ollamaVisionSchema: VisionProviderSchema = {
  name: "ollama-vision",
  description: "Analyze images locally using Ollama with LLaVA or similar vision models",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "What to analyze or ask about the image",
      default: "Describe this image in detail.",
    },
    outputFormat: {
      type: "string",
      title: "Output Format",
      description: "Response format: plain text or structured JSON",
      enum: ["text", "json"],
      default: "text",
    },
  },
};

/**
 * Ollama Vision provider for local image analysis
 *
 * Uses LLaVA or other vision-capable models running locally via Ollama.
 * No API key required - runs entirely on your machine.
 *
 * @example
 * ```typescript
 * import { ollamaVision } from "@teamflojo/floimg-ollama";
 *
 * const client = createClient();
 * client.registerVisionProvider(ollamaVision({ model: "llava" }));
 *
 * const result = await client.analyzeImage({
 *   provider: "ollama-vision",
 *   blob: imageBlob,
 *   params: { prompt: "What objects are in this image?" }
 * });
 * ```
 */
export function ollamaVision(config: OllamaVisionConfig = {}): VisionProvider {
  const { baseUrl = "http://localhost:11434", model = "llava" } = config;

  const client = new Ollama({ host: baseUrl });

  return {
    name: "ollama-vision",
    schema: ollamaVisionSchema,

    async analyze(
      input: ImageBlob,
      params: Record<string, unknown>
    ): Promise<DataBlob> {
      const {
        prompt = "Describe this image in detail.",
        outputFormat = "text",
      } = params as Partial<OllamaVisionParams>;

      // Convert image to base64
      const base64 = input.bytes.toString("base64");

      // Build prompt for JSON output if requested
      const userPrompt =
        outputFormat === "json"
          ? `${prompt}\n\nRespond with a valid JSON object containing your analysis.`
          : prompt;

      const response = await client.chat({
        model,
        messages: [
          {
            role: "user",
            content: userPrompt,
            images: [base64],
          },
        ],
      });

      const content = response.message.content;

      // Try to parse JSON if requested
      let parsed: Record<string, unknown> | undefined;
      if (outputFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          // If JSON parsing fails, treat as text
        }
      }

      return {
        type: parsed ? "json" : "text",
        content,
        parsed,
        source: `ai:ollama-vision:${model}`,
        metadata: {
          model,
          prompt,
          localExecution: true,
        },
      };
    },
  };
}

// ============================================================================
// Text Provider - Llama/Mistral Text Generation
// ============================================================================

export interface OllamaTextParams {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  outputFormat?: "text" | "json";
  temperature?: number;
}

/**
 * Schema for the Ollama Text provider
 */
export const ollamaTextSchema: TextProviderSchema = {
  name: "ollama-text",
  description: "Generate text locally using Ollama with Llama, Mistral, or other models",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "The prompt for text generation",
    },
    systemPrompt: {
      type: "string",
      title: "System Prompt",
      description: "Optional system prompt to guide the model's behavior",
    },
    context: {
      type: "string",
      title: "Context",
      description: "Optional context from a previous step (e.g., vision analysis)",
    },
    outputFormat: {
      type: "string",
      title: "Output Format",
      description: "Response format: plain text or structured JSON",
      enum: ["text", "json"],
      default: "text",
    },
    temperature: {
      type: "number",
      title: "Temperature",
      description: "Creativity level (0-2)",
      default: 0.7,
    },
  },
  requiredParameters: ["prompt"],
};

/**
 * Ollama Text provider for local text generation
 *
 * Uses Llama, Mistral, or other text models running locally via Ollama.
 * No API key required - runs entirely on your machine.
 *
 * @example
 * ```typescript
 * import { ollamaText } from "@teamflojo/floimg-ollama";
 *
 * const client = createClient();
 * client.registerTextProvider(ollamaText({ model: "llama3.2" }));
 *
 * const result = await client.generateText({
 *   provider: "ollama-text",
 *   params: {
 *     prompt: "Write a creative description for this image",
 *     context: "A serene mountain lake at sunset"
 *   }
 * });
 * ```
 */
export function ollamaText(config: OllamaTextConfig = {}): TextProvider {
  const { baseUrl = "http://localhost:11434", model = "llama3.2" } = config;

  const client = new Ollama({ host: baseUrl });

  return {
    name: "ollama-text",
    schema: ollamaTextSchema,

    async generate(params: Record<string, unknown>): Promise<DataBlob> {
      const {
        prompt,
        systemPrompt,
        context,
        outputFormat = "text",
        temperature = 0.7,
      } = params as Partial<OllamaTextParams>;

      if (!prompt) {
        throw new Error("prompt is required for Ollama text generation");
      }

      // Build messages
      const messages: Array<{ role: "system" | "user"; content: string }> = [];

      // Add system prompt if provided
      if (systemPrompt) {
        let system = systemPrompt;
        if (outputFormat === "json") {
          system += " Always respond with valid JSON.";
        }
        messages.push({ role: "system", content: system });
      } else if (outputFormat === "json") {
        messages.push({
          role: "system",
          content: "You are a helpful assistant. Always respond with valid JSON.",
        });
      }

      // Build user message with optional context
      let userMessage = prompt;
      if (context) {
        userMessage = `Context from previous analysis:\n${context}\n\n${prompt}`;
      }
      if (outputFormat === "json") {
        userMessage += "\n\nRespond with a JSON object.";
      }
      messages.push({ role: "user", content: userMessage });

      const response = await client.chat({
        model,
        messages,
        options: {
          temperature,
        },
      });

      const content = response.message.content;

      // Try to parse JSON if requested
      let parsed: Record<string, unknown> | undefined;
      if (outputFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          // If JSON parsing fails, treat as text
        }
      }

      return {
        type: parsed ? "json" : "text",
        content,
        parsed,
        source: `ai:ollama-text:${model}`,
        metadata: {
          model,
          prompt,
          temperature,
          localExecution: true,
        },
      };
    },
  };
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Create both vision and text providers with shared config
 *
 * @example
 * ```typescript
 * import ollama from "@teamflojo/floimg-ollama";
 *
 * const providers = ollama({ baseUrl: "http://localhost:11434" });
 * providers.forEach(p => {
 *   if ('analyze' in p) client.registerVisionProvider(p);
 *   else client.registerTextProvider(p);
 * });
 * ```
 */
export default function ollama(
  config: OllamaConfig & { visionModel?: string; textModel?: string } = {}
): [VisionProvider, TextProvider] {
  const { baseUrl, visionModel, textModel } = config;

  return [
    ollamaVision({ baseUrl, model: visionModel }),
    ollamaText({ baseUrl, model: textModel }),
  ];
}

export { ollama };
