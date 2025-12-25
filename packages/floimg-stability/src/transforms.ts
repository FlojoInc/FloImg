import type { TransformProvider, TransformOperationSchema, ImageBlob } from "@teamflojo/floimg";

/**
 * Stability AI Edit API response types
 */
interface StabilityEditResponse {
  image: string; // base64 encoded image
  finish_reason: "SUCCESS" | "CONTENT_FILTERED";
  seed: number;
}

interface StabilityErrorResponse {
  id: string;
  name: string;
  message: string;
}

/**
 * Schema for the remove background operation
 */
const removeBackgroundSchema: TransformOperationSchema = {
  name: "removeBackground",
  description: "Remove the background from an image using AI",
  category: "AI",
  parameters: {},
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "STABILITY_API_KEY",
};

/**
 * Schema for the AI upscale operation
 */
const upscaleSchema: TransformOperationSchema = {
  name: "upscale",
  description: "Upscale an image using AI (Creative Upscale)",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Optional prompt to guide the upscaling",
    },
    creativity: {
      type: "number",
      title: "Creativity",
      description: "How creative the upscale should be (0-0.35)",
      default: 0.3,
      minimum: 0,
      maximum: 0.35,
    },
  },
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "STABILITY_API_KEY",
};

/**
 * Schema for the search and replace operation
 */
const searchAndReplaceSchema: TransformOperationSchema = {
  name: "searchAndReplace",
  description: "Find and replace objects in an image using AI",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe what you want to add/change",
    },
    searchPrompt: {
      type: "string",
      title: "Search Prompt",
      description: "Describe what to search for and replace",
    },
  },
  requiredParameters: ["prompt", "searchPrompt"],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "STABILITY_API_KEY",
};

/**
 * Schema for the outpaint operation
 */
const outpaintSchema: TransformOperationSchema = {
  name: "outpaint",
  description: "Extend image boundaries using AI",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe what to generate in the extended areas",
    },
    left: {
      type: "number",
      title: "Left",
      description: "Pixels to extend on the left",
      default: 0,
      minimum: 0,
    },
    right: {
      type: "number",
      title: "Right",
      description: "Pixels to extend on the right",
      default: 0,
      minimum: 0,
    },
    up: {
      type: "number",
      title: "Up",
      description: "Pixels to extend upward",
      default: 0,
      minimum: 0,
    },
    down: {
      type: "number",
      title: "Down",
      description: "Pixels to extend downward",
      default: 0,
      minimum: 0,
    },
    creativity: {
      type: "number",
      title: "Creativity",
      description: "How creative the outpaint should be (0-1)",
      default: 0.5,
      minimum: 0,
      maximum: 1,
    },
  },
  requiredParameters: ["prompt"],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "STABILITY_API_KEY",
};

/**
 * Configuration for the Stability AI transform provider
 */
export interface StabilityTransformConfig {
  /** API key for Stability AI */
  apiKey?: string;
}

/**
 * Create a Stability AI transform provider instance
 *
 * Provides AI-powered image transformations:
 * - removeBackground: Remove image background
 * - upscale: AI-powered upscaling (Creative Upscale)
 * - searchAndReplace: Find and replace objects in images
 * - outpaint: Extend image boundaries
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { stabilityTransform } from '@teamflojo/floimg-stability';
 *
 * const floimg = createClient();
 * floimg.registerTransformProvider(stabilityTransform({
 *   apiKey: process.env.STABILITY_API_KEY
 * }));
 *
 * // Remove background from an image
 * const result = await floimg.transform({
 *   blob: inputImage,
 *   op: 'removeBackground',
 *   provider: 'stability-transform'
 * });
 * ```
 */
export function stabilityTransform(config: StabilityTransformConfig = {}): TransformProvider {
  const apiKey = config.apiKey || process.env.STABILITY_API_KEY;

  if (!apiKey) {
    throw new Error(
      "Stability API key is required. Set STABILITY_API_KEY environment variable or pass apiKey in config."
    );
  }

  const operationSchemas: Record<string, TransformOperationSchema> = {
    removeBackground: removeBackgroundSchema,
    upscale: upscaleSchema,
    searchAndReplace: searchAndReplaceSchema,
    outpaint: outpaintSchema,
  };

  /**
   * Helper to make multipart/form-data requests to Stability API
   */
  async function makeEditRequest(
    endpoint: string,
    formData: FormData
  ): Promise<StabilityEditResponse> {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
      body: formData,
    });

    if (!response.ok) {
      const error = (await response.json()) as StabilityErrorResponse;
      throw new Error(`Stability AI error: ${error.message || response.statusText}`);
    }

    return (await response.json()) as StabilityEditResponse;
  }

  /**
   * Remove background from an image
   */
  async function removeBackground(input: ImageBlob): Promise<ImageBlob> {
    const formData = new FormData();
    formData.append("image", new Blob([input.bytes], { type: input.mime }));
    formData.append("output_format", "png");

    const result = await makeEditRequest(
      "https://api.stability.ai/v2beta/stable-image/edit/remove-background",
      formData
    );

    if (result.finish_reason === "CONTENT_FILTERED") {
      throw new Error("Image was filtered due to content policy violation");
    }

    const bytes = Buffer.from(result.image, "base64");

    return {
      bytes,
      mime: "image/png",
      width: input.width,
      height: input.height,
      source: "ai:stability:removeBackground",
      metadata: {
        operation: "removeBackground",
        seed: result.seed,
      },
    };
  }

  /**
   * AI-powered upscaling using Creative Upscale
   */
  async function upscale(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const { prompt = "", creativity = 0.3 } = params as {
      prompt?: string;
      creativity?: number;
    };

    const formData = new FormData();
    formData.append("image", new Blob([input.bytes], { type: input.mime }));
    formData.append("output_format", "png");

    if (prompt) {
      formData.append("prompt", prompt);
    }
    formData.append("creativity", String(creativity));

    const result = await makeEditRequest(
      "https://api.stability.ai/v2beta/stable-image/upscale/creative",
      formData
    );

    if (result.finish_reason === "CONTENT_FILTERED") {
      throw new Error("Image was filtered due to content policy violation");
    }

    const bytes = Buffer.from(result.image, "base64");

    // Creative Upscale produces 4x resolution
    const newWidth = input.width ? input.width * 4 : undefined;
    const newHeight = input.height ? input.height * 4 : undefined;

    return {
      bytes,
      mime: "image/png",
      width: newWidth,
      height: newHeight,
      source: "ai:stability:upscale",
      metadata: {
        operation: "upscale",
        prompt,
        creativity,
        seed: result.seed,
      },
    };
  }

  /**
   * Find and replace objects in an image
   */
  async function searchAndReplace(
    input: ImageBlob,
    params: Record<string, unknown>
  ): Promise<ImageBlob> {
    const { prompt, searchPrompt } = params as {
      prompt: string;
      searchPrompt: string;
    };

    if (!prompt || !searchPrompt) {
      throw new Error("Both prompt and searchPrompt are required for search and replace");
    }

    const formData = new FormData();
    formData.append("image", new Blob([input.bytes], { type: input.mime }));
    formData.append("prompt", prompt);
    formData.append("search_prompt", searchPrompt);
    formData.append("output_format", "png");

    const result = await makeEditRequest(
      "https://api.stability.ai/v2beta/stable-image/edit/search-and-replace",
      formData
    );

    if (result.finish_reason === "CONTENT_FILTERED") {
      throw new Error("Image was filtered due to content policy violation");
    }

    const bytes = Buffer.from(result.image, "base64");

    return {
      bytes,
      mime: "image/png",
      width: input.width,
      height: input.height,
      source: "ai:stability:searchAndReplace",
      metadata: {
        operation: "searchAndReplace",
        prompt,
        searchPrompt,
        seed: result.seed,
      },
    };
  }

  /**
   * Extend image boundaries
   */
  async function outpaint(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const {
      prompt,
      left = 0,
      right = 0,
      up = 0,
      down = 0,
      creativity = 0.5,
    } = params as {
      prompt: string;
      left?: number;
      right?: number;
      up?: number;
      down?: number;
      creativity?: number;
    };

    if (!prompt) {
      throw new Error("prompt is required for outpaint");
    }

    const formData = new FormData();
    formData.append("image", new Blob([input.bytes], { type: input.mime }));
    formData.append("prompt", prompt);
    formData.append("left", String(left));
    formData.append("right", String(right));
    formData.append("up", String(up));
    formData.append("down", String(down));
    formData.append("creativity", String(creativity));
    formData.append("output_format", "png");

    const result = await makeEditRequest(
      "https://api.stability.ai/v2beta/stable-image/edit/outpaint",
      formData
    );

    if (result.finish_reason === "CONTENT_FILTERED") {
      throw new Error("Image was filtered due to content policy violation");
    }

    const bytes = Buffer.from(result.image, "base64");

    // Calculate new dimensions
    const newWidth = input.width ? input.width + left + right : undefined;
    const newHeight = input.height ? input.height + up + down : undefined;

    return {
      bytes,
      mime: "image/png",
      width: newWidth,
      height: newHeight,
      source: "ai:stability:outpaint",
      metadata: {
        operation: "outpaint",
        prompt,
        left,
        right,
        up,
        down,
        creativity,
        seed: result.seed,
      },
    };
  }

  // Operation dispatch map
  const operations: Record<
    string,
    (input: ImageBlob, params: Record<string, unknown>) => Promise<ImageBlob>
  > = {
    removeBackground: (input) => removeBackground(input),
    upscale: (input, params) => upscale(input, params),
    searchAndReplace: (input, params) => searchAndReplace(input, params),
    outpaint: (input, params) => outpaint(input, params),
  };

  return {
    name: "stability-transform",
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
        "Stability AI transform provider does not support format conversion. Use the sharp provider instead."
      );
    },
  };
}

// Export schemas for capability discovery
export { removeBackgroundSchema, upscaleSchema, searchAndReplaceSchema, outpaintSchema };
