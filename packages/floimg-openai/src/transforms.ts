import OpenAI, { toFile } from "openai";
import type { ImagesResponse } from "openai/resources/images";
import type { TransformProvider, TransformOperationSchema, ImageBlob } from "@teamflojo/floimg";

/**
 * Schema for the image edit/inpaint operation
 */
export const editSchema: TransformOperationSchema = {
  name: "edit",
  description: "Edit an image using AI (inpainting with optional mask)",
  category: "AI",
  parameters: {
    prompt: {
      type: "string",
      title: "Prompt",
      description: "Describe what to add or change in the image",
    },
    mask: {
      type: "object",
      title: "Mask",
      description:
        "Optional PNG mask (as Buffer) where transparent areas will be edited (DALL-E 2 only)",
    },
    size: {
      type: "string",
      title: "Size",
      description: "Output image dimensions",
      enum: ["256x256", "512x512", "1024x1024"],
      default: "1024x1024",
    },
    n: {
      type: "number",
      title: "Count",
      description: "Number of variations to generate (1-10)",
      default: 1,
      minimum: 1,
      maximum: 10,
    },
  },
  requiredParameters: ["prompt"],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "OPENAI_API_KEY",
};

/**
 * Schema for the image variations operation
 */
export const variationsSchema: TransformOperationSchema = {
  name: "variations",
  description: "Generate variations of an image (DALL-E 2 only)",
  category: "AI",
  parameters: {
    size: {
      type: "string",
      title: "Size",
      description: "Output image dimensions",
      enum: ["256x256", "512x512", "1024x1024"],
      default: "1024x1024",
    },
    n: {
      type: "number",
      title: "Count",
      description: "Number of variations to generate (1-10)",
      default: 1,
      minimum: 1,
      maximum: 10,
    },
  },
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: true,
  requiresApiKey: true,
  apiKeyEnvVar: "OPENAI_API_KEY",
};

/**
 * Configuration for the OpenAI transform provider
 */
export interface OpenAITransformConfig {
  /** API key for OpenAI */
  apiKey?: string;
}

/**
 * Create an OpenAI transform provider instance
 *
 * Provides AI-powered image transformations:
 * - edit: Edit/inpaint images with a text prompt (DALL-E 2)
 * - variations: Generate variations of an image (DALL-E 2)
 *
 * Note: These operations use DALL-E 2 which supports image editing and variations.
 * DALL-E 3 does not support these operations.
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { openaiTransform } from '@teamflojo/floimg-openai';
 *
 * const floimg = createClient();
 * floimg.registerTransformProvider(openaiTransform({
 *   apiKey: process.env.OPENAI_API_KEY
 * }));
 *
 * // Edit an image
 * const result = await floimg.transform({
 *   blob: inputImage,
 *   op: 'edit',
 *   provider: 'openai-transform',
 *   params: {
 *     prompt: 'Add a sunset in the background'
 *   }
 * });
 *
 * // Generate variations
 * const variations = await floimg.transform({
 *   blob: inputImage,
 *   op: 'variations',
 *   provider: 'openai-transform'
 * });
 * ```
 */
export function openaiTransform(config: OpenAITransformConfig = {}): TransformProvider {
  const apiKey = config.apiKey || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is required. Set OPENAI_API_KEY environment variable or pass apiKey in config."
    );
  }

  const client = new OpenAI({ apiKey });

  const operationSchemas: Record<string, TransformOperationSchema> = {
    edit: editSchema,
    variations: variationsSchema,
  };

  /**
   * Edit/inpaint an image using DALL-E 2
   */
  async function edit(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const {
      prompt,
      mask,
      size = "1024x1024",
      n = 1,
    } = params as {
      prompt: string;
      mask?: Buffer;
      size?: "256x256" | "512x512" | "1024x1024";
      n?: number;
    };

    if (!prompt) {
      throw new Error("prompt is required for image editing");
    }

    // Convert input to file format for OpenAI API
    const imageFile = await toFile(input.bytes, "image.png", { type: "image/png" });

    // Build request options
    const requestOptions: Parameters<typeof client.images.edit>[0] = {
      model: "dall-e-2",
      image: imageFile,
      prompt,
      size,
      n,
      response_format: "url",
    };

    // Add mask if provided
    if (mask) {
      requestOptions.mask = await toFile(mask, "mask.png", { type: "image/png" });
    }

    const response = (await client.images.edit(requestOptions)) as ImagesResponse;

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
      source: "ai:openai:edit",
      metadata: {
        operation: "edit",
        prompt,
        model: "dall-e-2",
      },
    };
  }

  /**
   * Generate variations of an image using DALL-E 2
   */
  async function variations(input: ImageBlob, params: Record<string, unknown>): Promise<ImageBlob> {
    const { size = "1024x1024", n = 1 } = params as {
      size?: "256x256" | "512x512" | "1024x1024";
      n?: number;
    };

    // Convert input to file format for OpenAI API
    const imageFile = await toFile(input.bytes, "image.png", { type: "image/png" });

    const response = await client.images.createVariation({
      model: "dall-e-2",
      image: imageFile,
      size,
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
      source: "ai:openai:variations",
      metadata: {
        operation: "variations",
        model: "dall-e-2",
      },
    };
  }

  // Operation dispatch map
  const operations: Record<
    string,
    (input: ImageBlob, params: Record<string, unknown>) => Promise<ImageBlob>
  > = {
    edit: (input, params) => edit(input, params),
    variations: (input, params) => variations(input, params),
  };

  return {
    name: "openai-transform",
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
        "OpenAI transform provider does not support format conversion. Use the sharp provider instead."
      );
    },
  };
}
