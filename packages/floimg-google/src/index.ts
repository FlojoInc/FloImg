import { GoogleGenAI, type GenerateImagesConfig } from "@google/genai";
import type { ImageGenerator, ImageBlob, GeneratorSchema } from "@teamflojo/floimg";

/**
 * Supported Imagen models
 */
const IMAGEN_MODELS = [
  "imagen-4.0-fast-generate-001",
  "imagen-4.0-generate-001",
  "imagen-4.0-ultra-generate-001",
  "imagen-3.0-generate-002",
] as const;

type ImagenModel = (typeof IMAGEN_MODELS)[number];

/**
 * Supported aspect ratios
 */
const ASPECT_RATIOS = ["1:1", "3:4", "4:3", "9:16", "16:9"] as const;

type AspectRatio = (typeof ASPECT_RATIOS)[number];

/**
 * Schema for the Google Imagen generator
 */
export const googleImagenSchema: GeneratorSchema = {
  name: "google-imagen",
  description: "Generate images using Google's Imagen models via the Gemini API",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe the image you want to generate (max 480 tokens)",
    },
    model: {
      type: "string",
      title: "Model",
      description: "Imagen model variant",
      enum: [...IMAGEN_MODELS],
      default: "imagen-4.0-generate-001",
    },
    aspectRatio: {
      type: "string",
      title: "Aspect Ratio",
      description: "Image aspect ratio",
      enum: [...ASPECT_RATIOS],
      default: "1:1",
    },
    numberOfImages: {
      type: "number",
      title: "Number of Images",
      description: "Number of images to generate (1-4)",
      default: 1,
      minimum: 1,
      maximum: 4,
    },
  },
  requiredParameters: ["prompt"],
  // AI metadata
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "GOOGLE_AI_API_KEY",
};

/**
 * Configuration for the Google Imagen generator
 */
export interface GoogleImagenConfig {
  /** API key for Google AI / Gemini API */
  apiKey?: string;
  /** Default model to use */
  model?: ImagenModel;
  /** Default aspect ratio */
  aspectRatio?: AspectRatio;
}

/**
 * Parameters for image generation
 */
export interface GoogleImagenParams extends Record<string, unknown> {
  /** Text prompt describing the desired image */
  prompt?: string;
  /** Imagen model to use */
  model?: ImagenModel;
  /** Image aspect ratio */
  aspectRatio?: AspectRatio;
  /** Number of images to generate (1-4) */
  numberOfImages?: number;
}

/**
 * Map aspect ratio to approximate dimensions
 */
function getApproximateDimensions(aspectRatio: AspectRatio): { width: number; height: number } {
  switch (aspectRatio) {
    case "1:1":
      return { width: 1024, height: 1024 };
    case "3:4":
      return { width: 768, height: 1024 };
    case "4:3":
      return { width: 1024, height: 768 };
    case "9:16":
      return { width: 576, height: 1024 };
    case "16:9":
      return { width: 1024, height: 576 };
    default:
      return { width: 1024, height: 1024 };
  }
}

/**
 * Create a Google Imagen image generator instance
 *
 * Generates images using Google's Imagen models via the Gemini API.
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import googleImagen from '@teamflojo/floimg-google';
 *
 * const floimg = createClient();
 * floimg.registerGenerator(googleImagen({ apiKey: process.env.GOOGLE_AI_API_KEY }));
 *
 * const image = await floimg.generate({
 *   generator: 'google-imagen',
 *   params: {
 *     prompt: 'A serene mountain landscape at sunset',
 *     model: 'imagen-4.0-generate-001',
 *     aspectRatio: '16:9',
 *   }
 * });
 * ```
 */
export default function googleImagen(config: GoogleImagenConfig = {}): ImageGenerator {
  const {
    apiKey = process.env.GOOGLE_AI_API_KEY,
    model: defaultModel = "imagen-4.0-generate-001",
    aspectRatio: defaultAspectRatio = "1:1",
  } = config;

  if (!apiKey) {
    throw new Error(
      "Google AI API key is required. Set GOOGLE_AI_API_KEY environment variable or pass apiKey in config."
    );
  }

  const client = new GoogleGenAI({ apiKey });

  return {
    name: "google-imagen",
    schema: googleImagenSchema,

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        prompt,
        model = defaultModel,
        aspectRatio = defaultAspectRatio,
        numberOfImages = 1,
      } = params as GoogleImagenParams;

      if (!prompt) {
        throw new Error("prompt is required for Google Imagen image generation");
      }

      // Validate number of images
      if (numberOfImages < 1 || numberOfImages > 4) {
        throw new Error("numberOfImages must be between 1 and 4");
      }

      // Build generation config
      const imageConfig: GenerateImagesConfig = {
        numberOfImages,
        aspectRatio,
      };

      // Generate image using Imagen
      const response = await client.models.generateImages({
        model,
        prompt,
        config: imageConfig,
      });

      if (!response.generatedImages || response.generatedImages.length === 0) {
        throw new Error("No image data returned from Google Imagen");
      }

      const generatedImage = response.generatedImages[0];

      if (!generatedImage.image?.imageBytes) {
        throw new Error("No image bytes returned from Google Imagen");
      }

      // Convert base64 to Buffer
      const bytes = Buffer.from(generatedImage.image.imageBytes, "base64");

      // Get approximate dimensions from aspect ratio
      const dimensions = getApproximateDimensions(aspectRatio);

      return {
        bytes,
        mime: "image/png",
        width: dimensions.width,
        height: dimensions.height,
        source: `ai:google-imagen:${model}`,
        metadata: {
          prompt,
          model,
          aspectRatio,
        },
      };
    },
  };
}

// Named export for convenience
export { googleImagen };
