/**
 * Gemini Text and Vision providers for floimg
 *
 * Uses the Google GenAI SDK for text generation and image analysis.
 * Supports structured JSON outputs.
 */

import { GoogleGenAI, type GenerateContentConfig } from "@google/genai";
import type {
  DataBlob,
  ImageBlob,
  TextProvider,
  TextProviderSchema,
  VisionProvider,
  VisionProviderSchema,
  UsageHooks,
} from "@teamflojo/floimg";

// ============================================================================
// Gemini Text Provider
// ============================================================================

/**
 * Supported Gemini models for text generation
 */
const _GEMINI_TEXT_MODELS = ["gemini-2.5-flash", "gemini-3-flash-preview"] as const;

type GeminiTextModel = (typeof _GEMINI_TEXT_MODELS)[number];

export interface GeminiTextConfig {
  /** Google AI API key (defaults to GOOGLE_AI_API_KEY env var) */
  apiKey?: string;
  /** Model to use (default: gemini-2.5-flash) */
  model?: GeminiTextModel;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Temperature for response creativity (0-2) */
  temperature?: number;
  /** Optional usage tracking hooks for cost attribution */
  hooks?: UsageHooks;
}

export interface GeminiTextParams {
  /** The prompt for text generation */
  prompt: string;
  /** Optional system prompt to guide model behavior */
  systemPrompt?: string;
  /** Optional context from previous step (e.g., vision analysis) */
  context?: string;
  /** Output format: text or structured JSON */
  outputFormat?: "text" | "json";
  /** JSON schema for structured output (when outputFormat is "json") */
  jsonSchema?: Record<string, unknown>;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Temperature (0-2) */
  temperature?: number;
  /** Per-request API key override */
  apiKey?: string;
}

/**
 * Schema for the Gemini Text provider
 */
export const geminiTextSchema: TextProviderSchema = {
  name: "gemini-text",
  description: "Generate text using Google's Gemini models with structured output support",
  category: "Cloud",
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
      minimum: 0,
      maximum: 2,
    },
    apiKey: {
      type: "string",
      title: "API Key",
      description: "Your Google AI API key (optional - uses server key if not provided)",
    },
  },
  requiredParameters: ["prompt"],
  requiresApiKey: true,
  outputType: "data",
};

/**
 * Create a Gemini Text provider for text generation
 *
 * Uses Google's Gemini API with structured output support.
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { geminiText } from '@teamflojo/floimg-google';
 *
 * const floimg = createClient();
 * floimg.registerTextProvider(geminiText({ apiKey: process.env.GOOGLE_AI_API_KEY }));
 *
 * const result = await floimg.text({
 *   provider: 'gemini-text',
 *   params: {
 *     prompt: 'Generate 5 creative image prompts for a fantasy landscape',
 *     outputFormat: 'json',
 *   }
 * });
 * ```
 */
export function geminiText(config: GeminiTextConfig = {}): TextProvider {
  // Config API key is optional - user can provide per-request
  const configApiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;

  // Cache clients by API key
  const clientCache = new Map<string, GoogleGenAI>();

  function getClient(apiKey: string): GoogleGenAI {
    let client = clientCache.get(apiKey);
    if (!client) {
      client = new GoogleGenAI({ apiKey });
      clientCache.set(apiKey, client);
    }
    return client;
  }

  return {
    name: "gemini-text",
    schema: geminiTextSchema,

    async generate(params: Record<string, unknown>): Promise<DataBlob> {
      const {
        prompt,
        systemPrompt,
        context,
        outputFormat = "text",
        jsonSchema,
        maxTokens: requestMaxTokens,
        temperature = config.temperature || 0.7,
        apiKey: paramApiKey,
      } = params as Partial<GeminiTextParams>;

      // Use higher default for JSON mode since structured outputs need to be complete
      // Truncated JSON is unusable, so we default to 8192 tokens for JSON vs 1000 for text
      const defaultMaxTokens = outputFormat === "json" ? 8192 : 1000;
      const maxTokens = requestMaxTokens ?? config.maxTokens ?? defaultMaxTokens;

      if (!prompt) {
        throw new Error("prompt is required for Gemini text generation");
      }

      // Use per-request API key if provided, otherwise use config key
      const apiKey = paramApiKey || configApiKey;
      if (!apiKey) {
        throw new Error(
          "Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable, pass apiKey in config, or provide it in params."
        );
      }

      const client = getClient(apiKey);
      const model = config.model || "gemini-2.5-flash";

      // Build the prompt with optional context
      let fullPrompt = prompt;
      if (context) {
        fullPrompt = `Context from previous analysis:\n${context}\n\n${prompt}`;
      }
      if (outputFormat === "json" && !jsonSchema) {
        fullPrompt += "\n\nRespond with valid JSON only.";
      }

      // Build generation config
      const generationConfig: GenerateContentConfig = {
        maxOutputTokens: maxTokens,
        temperature,
      };

      // Add structured output if JSON schema is provided
      if (outputFormat === "json" && jsonSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = jsonSchema;
      } else if (outputFormat === "json") {
        generationConfig.responseMimeType = "application/json";
      }

      const response = await client.models.generateContent({
        model,
        contents: [
          ...(systemPrompt
            ? [{ role: "user" as const, parts: [{ text: `System: ${systemPrompt}` }] }]
            : []),
          { role: "user" as const, parts: [{ text: fullPrompt }] },
        ],
        config: generationConfig,
      });

      // Check for truncation due to token limits
      // When MAX_TOKENS is the finish reason with structured output, the response is often
      // empty or truncated, making the JSON unusable
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        throw new Error(
          `Gemini response was truncated due to token limits (maxTokens: ${maxTokens}). ` +
            `The model could not complete its response within the token budget. ` +
            `Try increasing maxTokens or simplifying your request.`
        );
      }

      const content = response.text || "";

      // Try to parse JSON if requested
      let parsed: Record<string, unknown> | undefined;
      if (outputFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          // Provide more context about why parsing failed
          if (content === "") {
            throw new Error(
              `Gemini returned an empty response for JSON output. ` +
                `This may indicate the model was blocked by safety filters or hit an internal limit.`
            );
          }
          // Check if it looks like truncated JSON (starts with { or [ but doesn't end properly)
          const trimmed = content.trim();
          if (
            (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
            !(trimmed.endsWith("}") || trimmed.endsWith("]"))
          ) {
            throw new Error(
              `Gemini returned truncated JSON that could not be parsed. ` +
                `The response may have been cut off. Try increasing maxTokens or simplifying your request.`
            );
          }
          // Otherwise, it's genuinely malformed JSON - treat as text (existing behavior)
        }
      }

      // Emit usage event for cost tracking (errors logged but don't fail the operation)
      if (config.hooks?.onUsage) {
        try {
          await config.hooks.onUsage({
            provider: "google",
            model,
            operation: "text",
            // Gemini SDK doesn't expose token counts directly
            rawMetadata: {
              temperature,
            },
          });
        } catch (err) {
          console.warn("[floimg-google] Usage hook failed:", err);
        }
      }

      return {
        type: parsed ? "json" : "text",
        content,
        parsed,
        source: `ai:gemini-text:${model}`,
        metadata: {
          model,
          prompt,
          temperature,
        },
      };
    },
  };
}

// ============================================================================
// Gemini Vision Provider
// ============================================================================

/**
 * Supported Gemini models for vision/image analysis
 */
const _GEMINI_VISION_MODELS = ["gemini-2.5-flash", "gemini-3-flash-preview"] as const;

type GeminiVisionModel = (typeof _GEMINI_VISION_MODELS)[number];

export interface GeminiVisionConfig {
  /** Google AI API key (defaults to GOOGLE_AI_API_KEY env var) */
  apiKey?: string;
  /** Model to use (default: gemini-2.5-flash) */
  model?: GeminiVisionModel;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Optional usage tracking hooks for cost attribution */
  hooks?: UsageHooks;
}

export interface GeminiVisionParams {
  /** What to analyze or ask about the image */
  prompt?: string;
  /** Output format: text or structured JSON */
  outputFormat?: "text" | "json";
  /** JSON schema for structured output (when outputFormat is "json") */
  jsonSchema?: Record<string, unknown>;
  /** Maximum tokens in response */
  maxTokens?: number;
  /** Per-request API key override */
  apiKey?: string;
}

/**
 * Schema for the Gemini Vision provider
 */
export const geminiVisionSchema: VisionProviderSchema = {
  name: "gemini-vision",
  description: "Analyze images using Google's Gemini models with structured output support",
  category: "Cloud",
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
    apiKey: {
      type: "string",
      title: "API Key",
      description: "Your Google AI API key (optional - uses server key if not provided)",
    },
  },
  outputFormats: ["text", "json"],
  requiresApiKey: true,
  inputType: "image",
  outputType: "data",
};

/**
 * Create a Gemini Vision provider for image analysis
 *
 * Uses Google's Gemini API with structured output support.
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { geminiVision } from '@teamflojo/floimg-google';
 *
 * const floimg = createClient();
 * floimg.registerVisionProvider(geminiVision({ apiKey: process.env.GOOGLE_AI_API_KEY }));
 *
 * const result = await floimg.vision({
 *   provider: 'gemini-vision',
 *   blob: imageBlob,
 *   params: {
 *     prompt: 'What objects are in this image?',
 *     outputFormat: 'json',
 *   }
 * });
 * ```
 */
export function geminiVision(config: GeminiVisionConfig = {}): VisionProvider {
  // Config API key is optional - user can provide per-request
  const configApiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;

  // Cache clients by API key
  const clientCache = new Map<string, GoogleGenAI>();

  function getClient(apiKey: string): GoogleGenAI {
    let client = clientCache.get(apiKey);
    if (!client) {
      client = new GoogleGenAI({ apiKey });
      clientCache.set(apiKey, client);
    }
    return client;
  }

  return {
    name: "gemini-vision",
    schema: geminiVisionSchema,

    async analyze(input: ImageBlob, params: Record<string, unknown>): Promise<DataBlob> {
      const {
        prompt = "Describe this image in detail.",
        outputFormat = "text",
        jsonSchema,
        maxTokens: requestMaxTokens,
        apiKey: paramApiKey,
      } = params as Partial<GeminiVisionParams>;

      // Use higher default for JSON mode since structured outputs need to be complete
      const defaultMaxTokens = outputFormat === "json" ? 8192 : 1000;
      const maxTokens = requestMaxTokens ?? config.maxTokens ?? defaultMaxTokens;

      // Use per-request API key if provided, otherwise use config key
      const apiKey = paramApiKey || configApiKey;
      if (!apiKey) {
        throw new Error(
          "Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable, pass apiKey in config, or provide it in params."
        );
      }

      const client = getClient(apiKey);
      const model = config.model || "gemini-2.5-flash";

      // Convert image to base64
      const base64Image = input.bytes.toString("base64");

      // Build the prompt
      let fullPrompt = prompt;
      if (outputFormat === "json" && !jsonSchema) {
        fullPrompt += "\n\nRespond with valid JSON only.";
      }

      // Build generation config
      const generationConfig: GenerateContentConfig = {
        maxOutputTokens: maxTokens,
      };

      // Add structured output if JSON schema is provided
      if (outputFormat === "json" && jsonSchema) {
        generationConfig.responseMimeType = "application/json";
        generationConfig.responseSchema = jsonSchema;
      } else if (outputFormat === "json") {
        generationConfig.responseMimeType = "application/json";
      }

      // Build parts array with primary image and any additional images
      const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
        { text: fullPrompt },
        {
          inlineData: {
            mimeType: input.mime,
            data: base64Image,
          },
        },
      ];

      // Add additional images if provided (for multi-image analysis like iterative workflows)
      const additionalImages = (params as Record<string, unknown>)._additionalImages as
        | Array<{ bytes: Buffer; mime: string }>
        | undefined;
      if (additionalImages && Array.isArray(additionalImages)) {
        for (const img of additionalImages) {
          if (img.bytes && img.mime) {
            parts.push({
              inlineData: {
                mimeType: img.mime,
                data: img.bytes.toString("base64"),
              },
            });
          }
        }
      }

      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: generationConfig,
      });

      // Check for truncation due to token limits
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason === "MAX_TOKENS") {
        throw new Error(
          `Gemini response was truncated due to token limits (maxTokens: ${maxTokens}). ` +
            `The model could not complete its response within the token budget. ` +
            `Try increasing maxTokens or simplifying your request.`
        );
      }

      const content = response.text || "";

      // Try to parse JSON if requested
      let parsed: Record<string, unknown> | undefined;
      if (outputFormat === "json") {
        try {
          parsed = JSON.parse(content);
        } catch {
          // Provide more context about why parsing failed
          if (content === "") {
            throw new Error(
              `Gemini returned an empty response for JSON output. ` +
                `This may indicate the model was blocked by safety filters or hit an internal limit.`
            );
          }
          // Check if it looks like truncated JSON
          const trimmed = content.trim();
          if (
            (trimmed.startsWith("{") || trimmed.startsWith("[")) &&
            !(trimmed.endsWith("}") || trimmed.endsWith("]"))
          ) {
            throw new Error(
              `Gemini returned truncated JSON that could not be parsed. ` +
                `The response may have been cut off. Try increasing maxTokens or simplifying your request.`
            );
          }
          // Otherwise, it's genuinely malformed JSON - treat as text
        }
      }

      // Emit usage event for cost tracking (errors logged but don't fail the operation)
      if (config.hooks?.onUsage) {
        try {
          await config.hooks.onUsage({
            provider: "google",
            model,
            operation: "vision",
            // Gemini SDK doesn't expose token counts directly
          });
        } catch (err) {
          console.warn("[floimg-google] Usage hook failed:", err);
        }
      }

      return {
        type: parsed ? "json" : "text",
        content,
        parsed,
        source: `ai:gemini-vision:${model}`,
        metadata: {
          model,
          prompt,
        },
      };
    },
  };
}
