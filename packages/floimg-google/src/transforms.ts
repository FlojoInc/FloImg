import { GoogleGenAI, type Part, type GenerateContentConfig } from "@google/genai";
import type {
  TransformProvider,
  TransformOperationSchema,
  ImageBlob,
  ImageGenerator,
  GeneratorSchema,
  MimeType,
  UsageHooks,
} from "@teamflojo/floimg";
import { enhancePrompt as enhancePromptFn } from "./prompt-enhancer.js";

/**
 * Extended GenerateContentConfig with imageConfig for image generation.
 *
 * The @google/genai SDK types don't include imageConfig yet as it's a newer
 * feature for Gemini's image generation models. This interface extends the
 * base config to add type safety for the imageConfig field.
 *
 * @see https://ai.google.dev/gemini-api/docs/image-generation
 */
interface GeminiImageGenerationConfig extends GenerateContentConfig {
  imageConfig?: {
    aspectRatio?: string;
    imageSize?: string;
  };
}

/**
 * Supported Gemini models for image generation/editing (Nano Banana)
 *
 * - gemini-2.5-flash-image: "Nano Banana" - Fast, high-volume, low-latency
 * - gemini-3-pro-image-preview: "Nano Banana Pro" - Professional quality, better text rendering
 */
const GEMINI_IMAGE_MODELS = ["gemini-2.5-flash-image", "gemini-3-pro-image-preview"] as const;

type GeminiImageModel = (typeof GEMINI_IMAGE_MODELS)[number];

/**
 * Supported aspect ratios for Gemini image generation
 */
const GEMINI_ASPECT_RATIOS = [
  "1:1",
  "2:3",
  "3:2",
  "3:4",
  "4:3",
  "4:5",
  "5:4",
  "9:16",
  "16:9",
  "21:9",
] as const;

type GeminiAspectRatio = (typeof GEMINI_ASPECT_RATIOS)[number];

/**
 * Supported image sizes for Gemini image generation
 * Note: Must use uppercase K (1K, 2K, 4K)
 */
const GEMINI_IMAGE_SIZES = ["1K", "2K", "4K"] as const;

type GeminiImageSize = (typeof GEMINI_IMAGE_SIZES)[number];

/**
 * Map image size to approximate dimensions
 */
function getApproximateDimensionsFromSize(
  size: GeminiImageSize,
  aspectRatio: GeminiAspectRatio = "1:1"
): { width: number; height: number } {
  // Base size from imageSize
  const baseSize = size === "4K" ? 4096 : size === "2K" ? 2048 : 1024;

  // Calculate dimensions from aspect ratio
  const [w, h] = aspectRatio.split(":").map(Number);
  const ratio = w / h;

  if (ratio >= 1) {
    // Landscape or square
    return { width: baseSize, height: Math.round(baseSize / ratio) };
  } else {
    // Portrait
    return { width: Math.round(baseSize * ratio), height: baseSize };
  }
}

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
    prePrompt: {
      type: "string",
      title: "Pre-Prompt",
      description:
        "Instructions prepended to the prompt (useful when receiving dynamic prompts from text nodes)",
      default:
        "Edit this image by incorporating the following concept while preserving the original composition and style:",
    },
    model: {
      type: "string",
      title: "Model",
      description: "Gemini model to use: Nano Banana (fast) or Nano Banana Pro (high quality)",
      enum: [...GEMINI_IMAGE_MODELS],
      default: "gemini-2.5-flash-image",
    },
    aspectRatio: {
      type: "string",
      title: "Aspect Ratio",
      description: "Output image aspect ratio",
      enum: [...GEMINI_ASPECT_RATIOS],
      default: "1:1",
    },
    imageSize: {
      type: "string",
      title: "Image Size",
      description: "Output resolution: 1K (1024px), 2K (2048px), or 4K (4096px)",
      enum: [...GEMINI_IMAGE_SIZES],
      default: "1K",
    },
    groundingWithSearch: {
      type: "boolean",
      title: "Ground with Google Search",
      description: "Enable Google Search grounding for real-time data (weather, stocks, events)",
      default: false,
    },
    enhancePrompt: {
      type: "boolean",
      title: "Enhance Prompt",
      description: "Automatically expand prompt using Google's best practices for better results",
      default: false,
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
  // Accepts additional reference images beyond the primary input
  acceptsReferenceImages: true,
  maxReferenceImages: 13, // 14 total minus the primary input
};

/**
 * Configuration for the Gemini transform provider
 */
export interface GeminiTransformConfig {
  /** Default API key for Google AI / Gemini API */
  apiKey?: string;
  /** Default model to use */
  model?: GeminiImageModel;
  /** Optional usage tracking hooks for cost attribution */
  hooks?: UsageHooks;
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
   * Supports up to 13 additional reference images (14 total including the primary input)
   */
  async function edit(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const {
      prompt,
      prePrompt,
      model = defaultModel,
      aspectRatio = "1:1",
      imageSize = "1K",
      groundingWithSearch = false,
      enhancePrompt = false,
      apiKey: requestApiKey,
      referenceImages,
    } = params as {
      prompt: string;
      prePrompt?: string;
      model?: GeminiImageModel;
      aspectRatio?: GeminiAspectRatio;
      imageSize?: GeminiImageSize;
      groundingWithSearch?: boolean;
      enhancePrompt?: boolean;
      apiKey?: string;
      referenceImages?: ImageBlob[];
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

    // Validate reference images count (max 13 additional, since primary input is 1)
    if (referenceImages && referenceImages.length > 13) {
      throw new Error(
        `Too many reference images: ${referenceImages.length}. Gemini edit supports up to 13 additional reference images (14 total including the primary input).`
      );
    }

    const client = getClient(apiKey);

    // Convert input image to base64
    const base64Image = input.bytes.toString("base64");

    // Optionally enhance the prompt using Google's best practices
    const processedPrompt = enhancePrompt ? enhancePromptFn(prompt, "edit") : prompt;

    // Build full prompt: prePrompt (if set) + processed prompt
    // prePrompt helps guide the model when receiving dynamic prompts from text nodes
    const fullPrompt = prePrompt ? `${prePrompt}\n\n${processedPrompt}` : processedPrompt;

    // Build config with imageConfig for aspect ratio and size
    const genConfig: GeminiImageGenerationConfig = {
      responseModalities: ["TEXT", "IMAGE"],
      imageConfig: {
        aspectRatio,
        imageSize,
      },
    };

    // Add Google Search grounding if enabled
    if (groundingWithSearch) {
      genConfig.tools = [{ googleSearch: {} }];
    }

    // Build parts array: text prompt + primary input image + reference images
    const parts: Part[] = [
      { text: fullPrompt },
      {
        inlineData: {
          mimeType: input.mime,
          data: base64Image,
        },
      },
    ];

    // Add reference images as additional inline data parts
    if (referenceImages && referenceImages.length > 0) {
      for (const refImage of referenceImages) {
        parts.push({
          inlineData: {
            mimeType: refImage.mime,
            data: refImage.bytes.toString("base64"),
          },
        });
      }
    }

    // Call Gemini with image(s) + text prompt
    const response = await client.models.generateContent({
      model,
      contents: [
        {
          role: "user",
          parts,
        },
      ],
      config: genConfig,
    });

    // Extract the generated image from the response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No response from Gemini");
    }

    const responseParts = candidates[0].content?.parts;
    if (!responseParts) {
      throw new Error("No content in Gemini response");
    }

    // Find the image part in the response
    const imagePart = responseParts.find((part) => part.inlineData?.mimeType?.startsWith("image/"));
    if (!imagePart?.inlineData?.data) {
      // Check if there's text explaining why no image was generated
      const textPart = responseParts.find((part) => part.text);
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

    // Get dimensions from imageSize and aspectRatio
    const dimensions = getApproximateDimensionsFromSize(imageSize, aspectRatio);

    // Emit usage event for cost tracking
    if (config.hooks?.onUsage) {
      try {
        await config.hooks.onUsage({
          provider: "google",
          model,
          operation: "transform",
          imageWidth: dimensions.width,
          imageHeight: dimensions.height,
          imageCount: 1,
        });
      } catch (err) {
        console.warn("[floimg-google] Usage hook failed:", err);
      }
    }

    return {
      bytes,
      mime,
      width: dimensions.width,
      height: dimensions.height,
      source: `ai:gemini:${model}`,
      metadata: {
        operation: "edit",
        prompt: fullPrompt,
        userPrompt: prompt,
        prePrompt,
        model,
        aspectRatio,
        imageSize,
        groundingWithSearch,
        enhancePrompt,
        referenceImageCount: referenceImages?.length || 0,
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

// ============================================================================
// Gemini Image Generator (from text prompt only, no input image)
// ============================================================================

/**
 * Schema for the Gemini image generator
 */
export const geminiGenerateSchema: GeneratorSchema = {
  name: "gemini-generate",
  description: "Generate images from text using Gemini's native image generation",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe the image you want to generate",
    },
    prePrompt: {
      type: "string",
      title: "Pre-Prompt",
      description:
        "Instructions prepended to the prompt (useful when receiving dynamic prompts from text nodes)",
      default: "Generate an image based on the following description:",
    },
    model: {
      type: "string",
      title: "Model",
      description: "Gemini model to use: Nano Banana (fast) or Nano Banana Pro (high quality)",
      enum: [...GEMINI_IMAGE_MODELS],
      default: "gemini-2.5-flash-image",
    },
    aspectRatio: {
      type: "string",
      title: "Aspect Ratio",
      description: "Output image aspect ratio",
      enum: [...GEMINI_ASPECT_RATIOS],
      default: "1:1",
    },
    imageSize: {
      type: "string",
      title: "Image Size",
      description: "Output resolution: 1K (1024px), 2K (2048px), or 4K (4096px)",
      enum: [...GEMINI_IMAGE_SIZES],
      default: "1K",
    },
    groundingWithSearch: {
      type: "boolean",
      title: "Ground with Google Search",
      description: "Enable Google Search grounding for real-time data (weather, stocks, events)",
      default: false,
    },
    enhancePrompt: {
      type: "boolean",
      title: "Enhance Prompt",
      description: "Automatically expand prompt using Google's best practices for better results",
      default: false,
    },
    apiKey: {
      type: "string",
      title: "API Key",
      description: "Google AI API key (optional - uses server key if not provided)",
    },
  },
  requiredParameters: ["prompt"],
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "GOOGLE_AI_API_KEY",
  // Accepts reference images via Studio's references handle
  acceptsReferenceImages: true,
  maxReferenceImages: 14,
};

/**
 * Configuration for the Gemini image generator
 */
export interface GeminiGenerateConfig {
  /** Default API key for Google AI / Gemini API */
  apiKey?: string;
  /** Default model to use */
  model?: GeminiImageModel;
  /** Optional usage tracking hooks for cost attribution */
  hooks?: UsageHooks;
}

/**
 * Create a Gemini image generator instance
 *
 * Generates images from text prompts using Gemini's native image generation.
 * Uses the same models as Gemini Edit but without requiring an input image.
 * Supports up to 14 reference images for style transfer and character consistency.
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { geminiGenerate } from '@teamflojo/floimg-google';
 *
 * const floimg = createClient();
 * floimg.registerGenerator(geminiGenerate());
 *
 * // Basic generation
 * const image = await floimg.generate({
 *   generator: 'gemini-generate',
 *   params: {
 *     prompt: 'A steaming espresso cup with dramatic lighting',
 *     apiKey: userApiKey
 *   }
 * });
 *
 * // With reference images (up to 14)
 * const image = await floimg.generate({
 *   generator: 'gemini-generate',
 *   params: {
 *     prompt: 'Generate a new scene in the style of these images',
 *     referenceImages: [styleImage1, styleImage2],
 *   }
 * });
 * ```
 */
export function geminiGenerate(config: GeminiGenerateConfig = {}): ImageGenerator {
  const defaultApiKey = config.apiKey || process.env.GOOGLE_AI_API_KEY;
  const defaultModel = config.model || "gemini-2.5-flash-image";

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
    name: "gemini-generate",
    schema: geminiGenerateSchema,

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        prompt,
        prePrompt,
        model = defaultModel,
        aspectRatio = "1:1",
        imageSize = "1K",
        groundingWithSearch = false,
        enhancePrompt = false,
        apiKey: requestApiKey,
        referenceImages,
      } = params as {
        prompt: string;
        prePrompt?: string;
        model?: GeminiImageModel;
        aspectRatio?: GeminiAspectRatio;
        imageSize?: GeminiImageSize;
        groundingWithSearch?: boolean;
        enhancePrompt?: boolean;
        apiKey?: string;
        referenceImages?: ImageBlob[];
      };

      const apiKey = requestApiKey || defaultApiKey;

      if (!apiKey) {
        throw new Error(
          "Google AI API key is required. Provide apiKey in params or set GOOGLE_AI_API_KEY environment variable."
        );
      }

      if (!prompt && !prePrompt) {
        throw new Error("prompt or prePrompt is required for Gemini image generation");
      }

      // Optionally enhance the prompt using Google's best practices
      const processedPrompt = enhancePrompt ? enhancePromptFn(prompt, "generate") : prompt;

      // Build full prompt: prePrompt (if set) + processed prompt
      // prePrompt helps guide the model when receiving dynamic prompts from text nodes
      // Either can be used alone, or combined together
      const fullPrompt = prePrompt
        ? processedPrompt
          ? `${prePrompt}\n\n${processedPrompt}`
          : prePrompt
        : processedPrompt;

      // Validate reference images count (max 14 per Google docs)
      if (referenceImages && referenceImages.length > 14) {
        throw new Error(
          `Too many reference images: ${referenceImages.length}. Gemini supports up to 14 reference images.`
        );
      }

      const client = getClient(apiKey);

      // Build config with imageConfig for aspect ratio and size
      const genConfig: GeminiImageGenerationConfig = {
        responseModalities: ["TEXT", "IMAGE"],
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      };

      // Add Google Search grounding if enabled
      if (groundingWithSearch) {
        genConfig.tools = [{ googleSearch: {} }];
      }

      // Build parts array: text prompt + reference images (if any)
      const parts: Part[] = [{ text: fullPrompt }];

      // Add reference images as inline data parts
      if (referenceImages && referenceImages.length > 0) {
        for (const refImage of referenceImages) {
          parts.push({
            inlineData: {
              mimeType: refImage.mime,
              data: refImage.bytes.toString("base64"),
            },
          });
        }
      }

      // Call Gemini with text prompt + reference images
      const response = await client.models.generateContent({
        model,
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        config: genConfig,
      });

      // Extract the generated image from the response
      const candidates = response.candidates;
      if (!candidates || candidates.length === 0) {
        throw new Error("No response from Gemini");
      }

      const responseParts = candidates[0].content?.parts;
      if (!responseParts) {
        throw new Error("No content in Gemini response");
      }

      // Find the image part in the response
      const imagePart = responseParts.find((part) =>
        part.inlineData?.mimeType?.startsWith("image/")
      );
      if (!imagePart?.inlineData?.data) {
        const textPart = responseParts.find((part) => part.text);
        if (textPart?.text) {
          throw new Error(`Gemini could not generate the image: ${textPart.text}`);
        }
        throw new Error("No image returned from Gemini");
      }

      // Convert base64 response to Buffer
      const bytes = Buffer.from(imagePart.inlineData.data, "base64");
      const responseMime = imagePart.inlineData.mimeType || "image/png";
      const mime: MimeType = responseMime.includes("jpeg")
        ? "image/jpeg"
        : responseMime.includes("webp")
          ? "image/webp"
          : "image/png";

      // Get dimensions from imageSize and aspectRatio
      const dimensions = getApproximateDimensionsFromSize(imageSize, aspectRatio);

      // Emit usage event for cost tracking
      if (config.hooks?.onUsage) {
        try {
          await config.hooks.onUsage({
            provider: "google",
            model,
            operation: "generate",
            imageWidth: dimensions.width,
            imageHeight: dimensions.height,
            imageCount: 1,
          });
        } catch (err) {
          console.warn("[floimg-google] Usage hook failed:", err);
        }
      }

      return {
        bytes,
        mime,
        width: dimensions.width,
        height: dimensions.height,
        source: `ai:gemini:${model}`,
        metadata: {
          operation: "generate",
          prompt: fullPrompt,
          userPrompt: prompt,
          prePrompt,
          model,
          aspectRatio,
          imageSize,
          groundingWithSearch,
          enhancePrompt,
          referenceImageCount: referenceImages?.length || 0,
        },
      };
    },
  };
}
