import { GoogleGenAI } from "@google/genai";
import type {
  TransformProvider,
  TransformOperationSchema,
  ImageBlob,
  MimeType,
} from "@teamflojo/floimg";

/**
 * Supported Gemini models for image generation/editing (Nano Banana)
 *
 * - gemini-2.5-flash-image: "Nano Banana" - Fast, high-volume, low-latency
 * - gemini-3-pro-image-preview: "Nano Banana Pro" - Professional quality, better text rendering
 */
const GEMINI_IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"] as const;

type GeminiImageModel = (typeof GEMINI_IMAGE_MODELS)[number];

/**
 * Schema for the Gemini image edit operation
 */
export const geminiEditSchema: TransformOperationSchema = {
  name: "edit",
  description: "Edit an image using Gemini's multimodal AI capabilities",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe the edits you want to make to the image",
    },
    model: {
      type: "string",
      title: "Model",
      description: "Gemini model to use: Nano Banana (fast) or Nano Banana Pro (high quality)",
      enum: [...GEMINI_IMAGE_MODELS],
      default: "gemini-2.5-flash-image",
    },
    apiKey: {
      type: "string",
      title: "API Key",
      description: "Google AI API key (optional - uses server key if not provided)",
    },
  },
  requiredParameters: ["prompt"],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "GOOGLE_AI_API_KEY",
};

/**
 * Configuration for the Gemini transform provider
 */
export interface GeminiTransformConfig {
  /** Default API key for Google AI / Gemini API */
  apiKey?: string;
  /** Default model to use */
  model?: GeminiImageModel;
}

/**
 * Create a Gemini transform provider instance
 *
 * Provides AI-powered image editing using Gemini's multimodal capabilities.
 * Users can provide their own API key per-request to enable the feature
 * without requiring server-side key management.
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { geminiTransform } from '@teamflojo/floimg-google';
 *
 * const floimg = createClient();
 * floimg.registerTransformProvider(geminiTransform());
 *
 * // Edit an image with server API key
 * const result = await floimg.transform({
 *   blob: inputImage,
 *   op: 'edit',
 *   provider: 'gemini-transform',
 *   params: {
 *     prompt: 'Make the sky more vibrant and add clouds'
 *   }
 * });
 *
 * // Edit with user-provided API key
 * const result = await floimg.transform({
 *   blob: inputImage,
 *   op: 'edit',
 *   provider: 'gemini-transform',
 *   params: {
 *     prompt: 'Remove the background',
 *     apiKey: userProvidedApiKey  // User's own key
 *   }
 * });
 * ```
 */
export function geminiTransform(config: GeminiTransformConfig = {}): TransformProvider {
  const defaultApiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;
  const defaultModel = config.model || "gemini-2.5-flash-image";

  // Cache clients by API key to avoid recreating for same key
  const clientCache = new Map<string, GoogleGenAI>();

  function getClient(apiKey: string): GoogleGenAI {
    let client = clientCache.get(apiKey);
    if (!client) {
      client = new GoogleGenAI({ apiKey });
      clientCache.set(apiKey, client);
    }
    return client;
  }

  const operationSchemas: Record<string, TransformOperationSchema> = {
    edit: geminiEditSchema,
  };

  /**
   * Edit an image using Gemini's multimodal capabilities
   */
  async function edit(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const {
      prompt,
      model = defaultModel,
      apiKey: requestApiKey,
    } = params as {
      prompt: string;
      model?: GeminiImageModel;
      apiKey?: string;
    };

    // Use request API key if provided, otherwise fall back to default
    const apiKey = requestApiKey || defaultApiKey;

    if (!apiKey) {
      throw new Error(
        "Google AI API key is required. Provide apiKey in params or set GOOGLE_AI_API_KEY environment variable."
      );
    }

    if (!prompt) {
      throw new Error("prompt is required for Gemini image editing");
    }

    const client = getClient(apiKey);

    // Convert input image to base64
    const base64Image = input.bytes.toString("base64");

    // Call Gemini with image + text prompt
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: input.mime,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the generated image from the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini");
    }

    const parts = candidates[0].content?.parts;
    if (!parts) {
      throw new Error("No content in Gemini response");
    }

    // Find the image part in the response
    const imagePart = parts.find((part) => part.inlineData?.mimeType?.startsWith("image/"));
    if (!imagePart?.inlineData?.data) {
      // Check if there's text explaining why no image was generated
      const textPart = parts.find((part) => part.text);
      if (textPart?.text) {
        throw new Error(`Gemini could not edit the image: ${textPart.text}`);
      }
      throw new Error("No image returned from Gemini");
    }

    // Convert base64 response to Buffer
    const bytes = Buffer.from(imagePart.inlineData.data, "base64");
    // Cast mime type - Gemini returns standard image types
    const responseMime = imagePart.inlineData.mimeType || "image/png";
    const mime: MimeType = responseMime.includes("jpeg")
      ? "image/jpeg"
      : responseMime.includes("webp")
        ? "image/webp"
        : "image/png";

    return {
      bytes,
      mime,
      // Gemini doesn't return dimensions, estimate from input or use defaults
      width: input.width || 1024,
      height: input.height || 1024,
      source: `ai:gemini:${model}`,
      metadata: {
        operation: "edit",
        prompt,
        model,
      },
    };
  }

  // Operation dispatch map
  const operations: Record<
    string,
    (input: ImageBlob, params: Record<string, unknown>) => Promise<ImageBlob>
  > = {
    edit: (input, params) => edit(input, params),
  };

  return {
    name: "gemini-transform",
    operationSchemas,

    async transform(
      input: ImageBlob,
      op: string,
      params: Record<string, unknown>
    ): Promise<ImageBlob> {
      const operation = operations[op];
      if (!operation) {
        throw new Error(
          `Unknown operation: ${op}. Supported: ${Object.keys(operations).join(", ")}`
        );
      }
      return operation(input, params);
    },

    // Required by interface but we don't support format conversion
    async convert(): Promise<ImageBlob> {
      throw new Error(
        "Gemini transform provider does not support format conversion. Use the sharp provider instead."
      );
    },
  };
}
