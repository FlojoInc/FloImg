import OpenAI from "openai";
import type {
  ImageGenerator,
  ImageBlob,
  DataBlob,
  GeneratorSchema,
  VisionProvider,
  VisionProviderSchema,
  TextProvider,
  TextProviderSchema,
} from "@teamflojo/floimg";

// ============================================================================
// Image Generator - DALL-E
// ============================================================================

export interface OpenAIConfig {
  apiKey?: string;
  model?: "dall-e-2" | "dall-e-3";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
}

export interface OpenAIGenerateParams {
  prompt: string;
  model?: "dall-e-2" | "dall-e-3";
  size?: "256x256" | "512x512" | "1024x1024" | "1024x1792" | "1792x1024";
  quality?: "standard" | "hd";
  style?: "vivid" | "natural";
  n?: number;
}

/**
 * Schema for the OpenAI DALL-E generator
 */
export const openaiSchema: GeneratorSchema = {
  name: "openai",
  description: "Generate images using OpenAI's DALL-E models",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe the image you want to generate",
    },
    model: {
      type: "string",
      title: "Model",
      description: "DALL-E model to use",
      enum: ["dall-e-2", "dall-e-3"],
      default: "dall-e-3",
    },
    size: {
      type: "string",
      title: "Size",
      description: "Image dimensions",
      enum: ["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024"],
      default: "1024x1024",
    },
    quality: {
      type: "string",
      title: "Quality",
      description: "Image quality (DALL-E 3 only)",
      enum: ["standard", "hd"],
      default: "standard",
    },
    style: {
      type: "string",
      title: "Style",
      description: "Image style (DALL-E 3 only)",
      enum: ["vivid", "natural"],
      default: "vivid",
    },
  },
  requiredParameters: ["prompt"],
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "OPENAI_API_KEY",
};

/**
 * Create an OpenAI DALL-E image generator
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import openai from '@teamflojo/floimg-openai';
 *
 * const floimg = createClient();
 * floimg.registerGenerator(openai({ apiKey: process.env.OPENAI_API_KEY }));
 *
 * const image = await floimg.generate({
 *   generator: 'openai',
 *   params: {
 *     prompt: 'A serene mountain landscape at sunset',
 *     model: 'dall-e-3',
 *     quality: 'hd',
 *   }
 * });
 * ```
 */
export default function openai(config: OpenAIConfig = {}): ImageGenerator {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config."
    );
  }

  const client = new OpenAI({ apiKey });

  return {
    name: "openai",
    schema: openaiSchema,

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        prompt,
        model = config.model || "dall-e-3",
        size = "1024x1024",
        quality = config.quality || "standard",
        style = config.style || "vivid",
        n = 1,
      } = params as Partial<OpenAIGenerateParams>;

      if (!prompt) {
        throw new Error("prompt is required for OpenAI image generation");
      }

      // DALL-E 3 only supports n=1
      if (model === "dall-e-3" && n !== 1) {
        throw new Error("DALL-E 3 only supports generating 1 image at a time (n=1)");
      }

      // DALL-E 3 has specific size constraints
      if (model === "dall-e-3") {
        const validSizes = ["1024x1024", "1024x1792", "1792x1024"];
        if (!validSizes.includes(size)) {
          throw new Error(`DALL-E 3 only supports sizes: ${validSizes.join(", ")}. Got: ${size}`);
        }
      }

      // Generate image
      const response = await client.images.generate({
        model,
        prompt,
        size: size as "1024x1024" | "1792x1024" | "1024x1792",
        quality: model === "dall-e-3" ? quality : undefined,
        style: model === "dall-e-3" ? style : undefined,
        n,
        response_format: "url",
      });

      if (!response.data || response.data.length === 0) {
        throw new Error("No image data returned from OpenAI");
      }

      const imageUrl = response.data[0].url;
      if (!imageUrl) {
        throw new Error("No image URL returned from OpenAI");
      }

      // Download the image
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to download image: ${imageResponse.statusText}`);
      }

      const arrayBuffer = await imageResponse.arrayBuffer();
      const bytes = Buffer.from(arrayBuffer);

      // Parse dimensions from size parameter
      const [width, height] = size.split("x").map(Number);

      return {
        bytes,
        mime: "image/png",
        width,
        height,
        source: `ai:openai:${model}`,
        metadata: {
          prompt,
          model,
          quality,
          style,
          revisedPrompt: response.data[0].revised_prompt,
        },
      };
    },
  };
}

// ============================================================================
// Vision Provider - GPT-4V Image Analysis
// ============================================================================

export interface OpenAIVisionConfig {
  apiKey?: string;
  model?: "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo";
  maxTokens?: number;
}

export interface OpenAIVisionParams {
  prompt?: string;
  outputFormat?: "text" | "json";
  maxTokens?: number;
}

/**
 * Schema for the OpenAI Vision provider
 */
export const openaiVisionSchema: VisionProviderSchema = {
  name: "openai-vision",
  description: "Analyze images using OpenAI's GPT-4 Vision models",
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
    maxTokens: {
      type: "number",
      title: "Max Tokens",
      description: "Maximum tokens in the response",
      default: 1000,
    },
  },
};

/**
 * Create an OpenAI Vision provider for image analysis
 */
export function openaiVision(config: OpenAIVisionConfig = {}): VisionProvider {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config."
    );
  }

  const client = new OpenAI({ apiKey });

  return {
    name: "openai-vision",
    schema: openaiVisionSchema,

    async analyze(input: ImageBlob, params: Record<string, unknown>): Promise<DataBlob> {
      const {
        prompt = "Describe this image in detail.",
        outputFormat = "text",
        maxTokens = config.maxTokens || 1000,
      } = params as Partial<OpenAIVisionParams>;

      const model = config.model || "gpt-4o";

      // Convert image to base64 data URL
      const base64 = input.bytes.toString("base64");
      const dataUrl = `data:${input.mime};base64,${base64}`;

      // Build messages with image
      const systemPrompt =
        outputFormat === "json"
          ? "You are a helpful assistant that analyzes images. Always respond with valid JSON."
          : "You are a helpful assistant that analyzes images.";

      const userPrompt =
        outputFormat === "json"
          ? `${prompt}\n\nRespond with a JSON object containing your analysis.`
          : prompt;

      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: { url: dataUrl, detail: "auto" },
              },
            ],
          },
        ],
      });

      const content = response.choices[0]?.message?.content || "";

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
        source: `ai:openai-vision:${model}`,
        metadata: {
          model,
          prompt,
          usage: response.usage,
        },
      };
    },
  };
}

// ============================================================================
// Text Provider - GPT-4 Text Generation
// ============================================================================

export interface OpenAITextConfig {
  apiKey?: string;
  model?: "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "gpt-3.5-turbo";
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAITextParams {
  prompt: string;
  systemPrompt?: string;
  context?: string;
  outputFormat?: "text" | "json";
  maxTokens?: number;
  temperature?: number;
}

/**
 * Schema for the OpenAI Text provider
 */
export const openaiTextSchema: TextProviderSchema = {
  name: "openai-text",
  description: "Generate text using OpenAI's GPT models",
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
    maxTokens: {
      type: "number",
      title: "Max Tokens",
      description: "Maximum tokens in the response",
      default: 1000,
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
 * Create an OpenAI Text provider for text generation
 */
export function openaiText(config: OpenAITextConfig = {}): TextProvider {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config."
    );
  }

  const client = new OpenAI({ apiKey });

  return {
    name: "openai-text",
    schema: openaiTextSchema,

    async generate(params: Record<string, unknown>): Promise<DataBlob> {
      const {
        prompt,
        systemPrompt,
        context,
        outputFormat = "text",
        maxTokens = config.maxTokens || 1000,
        temperature = config.temperature || 0.7,
      } = params as Partial<OpenAITextParams>;

      if (!prompt) {
        throw new Error("prompt is required for OpenAI text generation");
      }

      const model = config.model || "gpt-4o";

      // Build system message
      let system = systemPrompt || "You are a helpful assistant.";
      if (outputFormat === "json") {
        system += " Always respond with valid JSON.";
      }

      // Build user message with optional context
      let userMessage = prompt;
      if (context) {
        userMessage = `Context from previous analysis:\n${context}\n\n${prompt}`;
      }
      if (outputFormat === "json") {
        userMessage += "\n\nRespond with a JSON object.";
      }

      const response = await client.chat.completions.create({
        model,
        max_tokens: maxTokens,
        temperature,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMessage },
        ],
      });

      const content = response.choices[0]?.message?.content || "";

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
        source: `ai:openai-text:${model}`,
        metadata: {
          model,
          prompt,
          temperature,
          usage: response.usage,
        },
      };
    },
  };
}

// Named export alias for default
export { openai };
