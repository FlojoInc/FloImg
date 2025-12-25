import type { ImageGenerator, ImageBlob, GeneratorSchema } from "@teamflojo/floimg";

/**
 * Stability AI API response types
 */
interface StabilityArtifact {
  base64: string;
  finishReason: "SUCCESS" | "CONTENT_FILTERED" | "ERROR";
  seed: number;
}

interface StabilityResponse {
  artifacts: StabilityArtifact[];
}

interface StabilityErrorResponse {
  id: string;
  name: string;
  message: string;
}

/**
 * Supported SDXL resolutions (width x height)
 */
const SDXL_RESOLUTIONS = [
  "1024x1024",
  "1152x896",
  "896x1152",
  "1216x832",
  "832x1216",
  "1344x768",
  "768x1344",
  "1536x640",
  "640x1536",
] as const;

/**
 * Available style presets
 */
const STYLE_PRESETS = [
  "3d-model",
  "analog-film",
  "anime",
  "cinematic",
  "comic-book",
  "digital-art",
  "enhance",
  "fantasy-art",
  "isometric",
  "line-art",
  "low-poly",
  "modeling-compound",
  "neon-punk",
  "origami",
  "photographic",
  "pixel-art",
  "tile-texture",
] as const;

/**
 * Schema for the Stability AI generator
 */
export const stabilitySchema: GeneratorSchema = {
  name: "stability",
  description: "Generate images using Stability AI's SDXL and SD3 models",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe the image you want to generate",
    },
    negativePrompt: {
      type: "string",
      title: "Negative Prompt",
      description: "Describe what you don't want in the image",
    },
    model: {
      type: "string",
      title: "Model",
      description: "Stability AI model to use",
      enum: ["sdxl-1.0", "sd3", "sd3-turbo"],
      default: "sdxl-1.0",
    },
    size: {
      type: "string",
      title: "Size",
      description: "Image dimensions",
      enum: [...SDXL_RESOLUTIONS],
      default: "1024x1024",
    },
    stylePreset: {
      type: "string",
      title: "Style",
      description: "Visual style preset",
      enum: [...STYLE_PRESETS],
    },
    cfgScale: {
      type: "number",
      title: "CFG Scale",
      description: "How closely to follow the prompt (5-15 recommended)",
      default: 7,
      minimum: 0,
      maximum: 35,
    },
    steps: {
      type: "number",
      title: "Steps",
      description: "Number of diffusion steps (more = higher quality, slower)",
      default: 30,
      minimum: 10,
      maximum: 50,
    },
    seed: {
      type: "number",
      title: "Seed",
      description: "Random seed for reproducibility",
    },
  },
  requiredParameters: ["prompt"],
  // AI metadata
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "STABILITY_API_KEY",
};

/**
 * Configuration for the Stability AI generator
 */
export interface StabilityConfig {
  /** API key for Stability AI */
  apiKey?: string;
  /** Default model to use */
  model?: "sdxl-1.0" | "sd3" | "sd3-turbo";
  /** Default style preset */
  stylePreset?: (typeof STYLE_PRESETS)[number];
  /** Default CFG scale */
  cfgScale?: number;
  /** Default number of steps */
  steps?: number;
}

/**
 * Parameters for image generation
 */
export interface StabilityParams extends Record<string, unknown> {
  /** Text prompt describing the desired image */
  prompt?: string;
  /** Text describing what to avoid in the image */
  negativePrompt?: string;
  /** Model to use */
  model?: "sdxl-1.0" | "sd3" | "sd3-turbo";
  /** Image dimensions (e.g., "1024x1024") */
  size?: (typeof SDXL_RESOLUTIONS)[number];
  /** Visual style preset */
  stylePreset?: (typeof STYLE_PRESETS)[number];
  /** Guidance scale (how closely to follow prompt) */
  cfgScale?: number;
  /** Number of diffusion steps */
  steps?: number;
  /** Random seed for reproducibility */
  seed?: number;
}

/**
 * Get the engine ID for a model
 */
function getEngineId(model: string): string {
  switch (model) {
    case "sd3":
      return "stable-diffusion-v3";
    case "sd3-turbo":
      return "stable-diffusion-v3-turbo";
    case "sdxl-1.0":
    default:
      return "stable-diffusion-xl-1024-v1-0";
  }
}

/**
 * Create a Stability AI image generator instance
 *
 * Generates images using Stability AI's Stable Diffusion models (SDXL, SD3).
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import stability from '@teamflojo/floimg-stability';
 *
 * const floimg = createClient();
 * floimg.registerGenerator(stability({ apiKey: process.env.STABILITY_API_KEY }));
 *
 * const image = await floimg.generate({
 *   generator: 'stability',
 *   params: {
 *     prompt: 'A serene mountain landscape at sunset',
 *     model: 'sdxl-1.0',
 *     stylePreset: 'photographic',
 *     size: '1024x1024',
 *   }
 * });
 * ```
 */
export default function stability(config: StabilityConfig = {}): ImageGenerator {
  const {
    apiKey = process.env.STABILITY_API_KEY,
    model: defaultModel = "sdxl-1.0",
    stylePreset: defaultStylePreset,
    cfgScale: defaultCfgScale = 7,
    steps: defaultSteps = 30,
  } = config;

  if (!apiKey) {
    throw new Error(
      "Stability API key is required. Set STABILITY_API_KEY environment variable or pass apiKey in config."
    );
  }

  return {
    name: "stability",
    schema: stabilitySchema,

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        prompt,
        negativePrompt,
        model = defaultModel,
        size = "1024x1024",
        stylePreset = defaultStylePreset,
        cfgScale = defaultCfgScale,
        steps = defaultSteps,
        seed,
      } = params as StabilityParams;

      if (!prompt) {
        throw new Error("prompt is required for Stability AI image generation");
      }

      // Parse dimensions
      const [width, height] = size.split("x").map(Number);

      // Build request body
      const textPrompts = [
        { text: prompt, weight: 1 },
        ...(negativePrompt ? [{ text: negativePrompt, weight: -1 }] : []),
      ];

      const body: Record<string, unknown> = {
        text_prompts: textPrompts,
        cfg_scale: cfgScale,
        width,
        height,
        steps,
        samples: 1,
      };

      if (stylePreset) {
        body.style_preset = stylePreset;
      }

      if (seed !== undefined) {
        body.seed = seed;
      }

      // Get engine ID
      const engineId = getEngineId(model);
      const url = `https://api.stability.ai/v1/generation/${engineId}/text-to-image`;

      // Make API request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const error = (await response.json()) as StabilityErrorResponse;
        throw new Error(`Stability AI error: ${error.message || response.statusText}`);
      }

      const data = (await response.json()) as StabilityResponse;

      if (!data.artifacts || data.artifacts.length === 0) {
        throw new Error("No image data returned from Stability AI");
      }

      const artifact = data.artifacts[0];

      if (artifact.finishReason === "CONTENT_FILTERED") {
        throw new Error("Image was filtered due to content policy violation");
      }

      if (artifact.finishReason === "ERROR") {
        throw new Error("An error occurred during image generation");
      }

      // Convert base64 to Buffer
      const bytes = Buffer.from(artifact.base64, "base64");

      return {
        bytes,
        mime: "image/png",
        width,
        height,
        source: `ai:stability:${model}`,
        metadata: {
          prompt,
          negativePrompt,
          model,
          stylePreset,
          cfgScale,
          steps,
          seed: artifact.seed,
        },
      };
    },
  };
}

// Named export for convenience
export { stability };

// Export transform provider
export {
  stabilityTransform,
  removeBackgroundSchema,
  upscaleSchema,
  searchAndReplaceSchema,
  outpaintSchema,
  type StabilityTransformConfig,
} from "./transforms.js";
