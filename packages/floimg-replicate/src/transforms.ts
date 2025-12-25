import Replicate from "replicate";
import type {
  TransformProvider,
  TransformOperationSchema,
  ImageBlob,
  MimeType,
} from "@teamflojo/floimg";

/**
 * Schema for the face restoration operation using GFPGAN
 */
export const faceRestoreSchema: TransformOperationSchema = {
  name: "faceRestore",
  description: "Restore and enhance faces in photos using GFPGAN",
  category: "AI",
  parameters: {
    version: {
      type: "string",
      title: "Version",
      description: "GFPGAN version to use",
      enum: ["v1.3", "v1.4"],
      default: "v1.4",
    },
    scale: {
      type: "number",
      title: "Scale",
      description: "Upscale factor (1-4)",
      default: 2,
      minimum: 1,
      maximum: 4,
    },
  },
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "REPLICATE_API_TOKEN",
};

/**
 * Schema for the colorization operation using DeOldify
 */
export const colorizeSchema: TransformOperationSchema = {
  name: "colorize",
  description: "Colorize black and white images using DeOldify",
  category: "AI",
  parameters: {
    renderFactor: {
      type: "number",
      title: "Render Factor",
      description: "Quality/speed tradeoff (7-45, higher = better quality but slower)",
      default: 35,
      minimum: 7,
      maximum: 45,
    },
    artistic: {
      type: "boolean",
      title: "Artistic Mode",
      description: "Use artistic colorization model for more vibrant colors",
      default: false,
    },
  },
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "REPLICATE_API_TOKEN",
};

/**
 * Schema for the Real-ESRGAN upscaling operation
 */
export const realEsrganSchema: TransformOperationSchema = {
  name: "realEsrgan",
  description: "Upscale images using Real-ESRGAN",
  category: "AI",
  parameters: {
    scale: {
      type: "number",
      title: "Scale",
      description: "Upscale factor (2 or 4)",
      default: 4,
      minimum: 2,
      maximum: 4,
    },
    faceEnhance: {
      type: "boolean",
      title: "Face Enhancement",
      description: "Enable face enhancement for photos with faces",
      default: false,
    },
  },
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "REPLICATE_API_TOKEN",
};

/**
 * Schema for FLUX Kontext text-guided editing
 */
export const fluxEditSchema: TransformOperationSchema = {
  name: "fluxEdit",
  description: "Edit images using text prompts with FLUX Kontext",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe the desired changes to the image",
    },
    aspectRatio: {
      type: "string",
      title: "Aspect Ratio",
      description: "Output aspect ratio",
      enum: ["1:1", "16:9", "9:16", "4:3", "3:4", "21:9", "9:21"],
      default: "1:1",
    },
    guidanceScale: {
      type: "number",
      title: "Guidance Scale",
      description: "How closely to follow the prompt (1-20)",
      default: 3.5,
      minimum: 1,
      maximum: 20,
    },
    numInferenceSteps: {
      type: "number",
      title: "Inference Steps",
      description: "Number of denoising steps (1-50)",
      default: 28,
      minimum: 1,
      maximum: 50,
    },
    outputFormat: {
      type: "string",
      title: "Output Format",
      description: "Output image format",
      enum: ["webp", "jpg", "png"],
      default: "webp",
    },
    outputQuality: {
      type: "number",
      title: "Output Quality",
      description: "Quality for lossy formats (1-100)",
      default: 80,
      minimum: 1,
      maximum: 100,
    },
  },
  requiredParameters: ["prompt"],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "REPLICATE_API_TOKEN",
};

/**
 * Configuration for the Replicate transform provider
 */
export interface ReplicateTransformConfig {
  /** API token for Replicate */
  apiToken?: string;
}

/**
 * Create a Replicate transform provider instance
 *
 * Provides AI-powered image transformations via Replicate's model hosting:
 * - faceRestore: Restore and enhance faces using GFPGAN
 * - colorize: Colorize B&W images using DeOldify
 * - realEsrgan: Upscale images using Real-ESRGAN
 * - fluxEdit: Text-guided image editing using FLUX Kontext
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { replicateTransform } from '@teamflojo/floimg-replicate';
 *
 * const floimg = createClient();
 * floimg.registerTransformProvider(replicateTransform({
 *   apiToken: process.env.REPLICATE_API_TOKEN
 * }));
 *
 * // Restore faces in a photo
 * const result = await floimg.transform({
 *   blob: inputImage,
 *   op: 'faceRestore',
 *   provider: 'replicate-transform'
 * });
 *
 * // Colorize a B&W photo
 * const colorized = await floimg.transform({
 *   blob: bwImage,
 *   op: 'colorize',
 *   provider: 'replicate-transform'
 * });
 * ```
 */
export function replicateTransform(config: ReplicateTransformConfig = {}): TransformProvider {
  const apiToken = config.apiToken || process.env.REPLICATE_API_TOKEN;

  if (!apiToken) {
    throw new Error(
      "Replicate API token is required. Set REPLICATE_API_TOKEN environment variable or pass apiToken in config."
    );
  }

  const replicate = new Replicate({ auth: apiToken });

  const operationSchemas: Record<string, TransformOperationSchema> = {
    faceRestore: faceRestoreSchema,
    colorize: colorizeSchema,
    realEsrgan: realEsrganSchema,
    fluxEdit: fluxEditSchema,
  };

  /**
   * Convert ImageBlob to data URI for Replicate API
   */
  function toDataUri(input: ImageBlob): string {
    const base64 = input.bytes.toString("base64");
    return `data:${input.mime};base64,${base64}`;
  }

  /**
   * Extract URL from Replicate output
   * Different models return different formats (string, array, object with url)
   */
  function extractUrl(output: unknown): string {
    if (typeof output === "string") {
      return output;
    }
    if (Array.isArray(output) && output.length > 0) {
      // Some models return array of URLs
      return String(output[0]);
    }
    if (output && typeof output === "object" && "url" in output) {
      return String((output as { url: unknown }).url);
    }
    throw new Error(`Unexpected output format from Replicate: ${JSON.stringify(output)}`);
  }

  /**
   * Download result image from URL
   */
  async function downloadResult(url: string): Promise<Buffer> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download result: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  /**
   * Restore faces using GFPGAN
   */
  async function faceRestore(
    input: ImageBlob,
    params: Record<string, unknown>
  ): Promise<ImageBlob> {
    const { version = "v1.4", scale = 2 } = params as {
      version?: "v1.3" | "v1.4";
      scale?: number;
    };

    const modelVersion =
      version === "v1.3"
        ? "9283608cc6b7be6b65a8e44983db012355fde4132009bf99d976b2f0896856a3"
        : "b9a7ffcc3f0a4b20e8e6d5e3aee40d07d1c4a7d7a9b5b7a7b9a9b7a9b7a9b7a9";

    const output = await replicate.run(`tencentarc/gfpgan:${modelVersion}`, {
      input: {
        img: toDataUri(input),
        version: version,
        scale: scale,
      },
    });

    const resultUrl = extractUrl(output);
    const bytes = await downloadResult(resultUrl);

    return {
      bytes,
      mime: "image/png" as MimeType,
      width: input.width ? input.width * scale : undefined,
      height: input.height ? input.height * scale : undefined,
      source: "ai:replicate:faceRestore",
      metadata: {
        operation: "faceRestore",
        model: "tencentarc/gfpgan",
        version,
        scale,
      },
    };
  }

  /**
   * Colorize B&W images using DeOldify
   */
  async function colorize(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const { renderFactor = 35, artistic = false } = params as {
      renderFactor?: number;
      artistic?: boolean;
    };

    const model = artistic ? "arielreplicate/deoldify_artistic" : "arielreplicate/deoldify_image";

    const output = await replicate.run(model, {
      input: {
        input_image: toDataUri(input),
        render_factor: renderFactor,
      },
    });

    const resultUrl = extractUrl(output);
    const bytes = await downloadResult(resultUrl);

    return {
      bytes,
      mime: "image/png" as MimeType,
      width: input.width,
      height: input.height,
      source: "ai:replicate:colorize",
      metadata: {
        operation: "colorize",
        model,
        renderFactor,
        artistic,
      },
    };
  }

  /**
   * Upscale images using Real-ESRGAN
   */
  async function realEsrgan(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const { scale = 4, faceEnhance = false } = params as {
      scale?: 2 | 4;
      faceEnhance?: boolean;
    };

    const output = await replicate.run("nightmareai/real-esrgan", {
      input: {
        image: toDataUri(input),
        scale: scale,
        face_enhance: faceEnhance,
      },
    });

    const resultUrl = extractUrl(output);
    const bytes = await downloadResult(resultUrl);

    return {
      bytes,
      mime: "image/png" as MimeType,
      width: input.width ? input.width * scale : undefined,
      height: input.height ? input.height * scale : undefined,
      source: "ai:replicate:realEsrgan",
      metadata: {
        operation: "realEsrgan",
        model: "nightmareai/real-esrgan",
        scale,
        faceEnhance,
      },
    };
  }

  /**
   * Text-guided image editing using FLUX Kontext
   */
  async function fluxEdit(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const {
      prompt,
      aspectRatio = "1:1",
      guidanceScale = 3.5,
      numInferenceSteps = 28,
      outputFormat = "webp",
      outputQuality = 80,
    } = params as {
      prompt: string;
      aspectRatio?: string;
      guidanceScale?: number;
      numInferenceSteps?: number;
      outputFormat?: "webp" | "jpg" | "png";
      outputQuality?: number;
    };

    if (!prompt) {
      throw new Error("prompt is required for FLUX edit");
    }

    const output = await replicate.run("black-forest-labs/flux-kontext", {
      input: {
        image: toDataUri(input),
        prompt,
        aspect_ratio: aspectRatio,
        guidance_scale: guidanceScale,
        num_inference_steps: numInferenceSteps,
        output_format: outputFormat,
        output_quality: outputQuality,
      },
    });

    const resultUrl = extractUrl(output);
    const bytes = await downloadResult(resultUrl);

    // Determine MIME type from output format
    const mimeMap: Record<string, MimeType> = {
      webp: "image/webp",
      jpg: "image/jpeg",
      png: "image/png",
    };

    return {
      bytes,
      mime: mimeMap[outputFormat] || ("image/webp" as MimeType),
      width: input.width,
      height: input.height,
      source: "ai:replicate:fluxEdit",
      metadata: {
        operation: "fluxEdit",
        model: "black-forest-labs/flux-kontext",
        prompt,
        aspectRatio,
        guidanceScale,
        numInferenceSteps,
      },
    };
  }

  // Operation dispatch map
  const operations: Record<
    string,
    (input: ImageBlob, params: Record<string, unknown>) => Promise<ImageBlob>
  > = {
    faceRestore: (input, params) => faceRestore(input, params),
    colorize: (input, params) => colorize(input, params),
    realEsrgan: (input, params) => realEsrgan(input, params),
    fluxEdit: (input, params) => fluxEdit(input, params),
  };

  return {
    name: "replicate-transform",
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
        "Replicate transform provider does not support format conversion. Use the sharp provider instead."
      );
    },
  };
}
