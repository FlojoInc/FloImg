import type { TransformProvider, TransformOperationSchema, ImageBlob } from "@teamflojo/floimg";
import {
  vectorize as vtracerVectorize,
  ColorMode,
  Hierarchical,
  PathSimplifyMode,
} from "@neplex/vectorizer";

/**
 * Simplify mode options for user-facing API
 */
export type SimplifyMode = "none" | "polygon" | "spline";

/**
 * Configuration for the vectorize transform
 */
export interface VectorizeConfig {
  /**
   * Colors per channel (1-8). Higher = more colors in output SVG.
   * @default 6
   */
  colorPrecision?: number;

  /**
   * Remove artifacts smaller than N pixels.
   * @default 4
   */
  filterSpeckle?: number;

  /**
   * Path simplification mode.
   * - "none": No simplification (preserves all detail)
   * - "polygon": Simplify to straight line segments
   * - "spline": Smooth curves (recommended)
   * @default "spline"
   */
  simplify?: SimplifyMode;
}

/**
 * Schema for the vectorize operation
 */
const vectorizeSchema: TransformOperationSchema = {
  name: "vectorize",
  description: "Convert raster image (PNG, JPEG, WebP) to SVG vector graphics",
  category: "Format",
  parameters: {
    colorPrecision: {
      type: "number",
      title: "Color Precision",
      description: "Colors per channel (1-8). Higher values preserve more colors.",
      default: 6,
      minimum: 1,
      maximum: 8,
    },
    filterSpeckle: {
      type: "number",
      title: "Filter Speckle",
      description: "Remove small artifacts under this pixel size.",
      default: 4,
      minimum: 0,
      maximum: 10,
    },
    simplify: {
      type: "string",
      title: "Simplify Mode",
      description:
        "Path simplification: none (preserve detail), polygon (straight lines), spline (smooth curves).",
      default: "spline",
      enum: ["none", "polygon", "spline"],
    },
  },
  requiredParameters: [],
  inputType: "image",
  outputType: "image",
  isAI: false,
  requiresApiKey: false,
};

/**
 * Map user-friendly simplify modes to vtracer PathSimplifyMode
 */
function getSimplifyMode(mode: SimplifyMode): PathSimplifyMode {
  switch (mode) {
    case "none":
      return PathSimplifyMode.None;
    case "polygon":
      return PathSimplifyMode.Polygon;
    case "spline":
    default:
      return PathSimplifyMode.Spline;
  }
}

/**
 * Create a vectorize transform provider
 *
 * Converts raster images (PNG, JPEG, WebP) to SVG vector graphics using
 * the vtracer library. Best suited for:
 * - Logos and icons
 * - Flat illustrations
 * - AI-generated images for professional use
 *
 * Not recommended for:
 * - Photographs (produces noisy output)
 * - Complex gradients (quantized to solid colors)
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import { vectorizeTransform } from '@teamflojo/floimg-vectorize';
 *
 * const floimg = createClient();
 * floimg.registerTransformProvider(vectorizeTransform());
 *
 * // Simple usage
 * const svg = await floimg.transform({
 *   blob: inputImage,
 *   op: 'vectorize',
 *   provider: 'vectorize'
 * });
 *
 * // With options
 * const svg = await floimg.transform({
 *   blob: inputImage,
 *   op: 'vectorize',
 *   provider: 'vectorize',
 *   params: {
 *     colorPrecision: 6,
 *     filterSpeckle: 4,
 *     simplify: 'spline'
 *   }
 * });
 * ```
 */
export function vectorizeTransform(): TransformProvider {
  const operationSchemas: Record<string, TransformOperationSchema> = {
    vectorize: vectorizeSchema,
  };

  return {
    name: "vectorize",
    operationSchemas,

    async transform(
      input: ImageBlob,
      op: string,
      params: Record<string, unknown>
    ): Promise<ImageBlob> {
      if (op !== "vectorize") {
        throw new Error(`Unknown operation: ${op}. Supported: vectorize`);
      }

      const {
        colorPrecision = 6,
        filterSpeckle = 4,
        simplify = "spline",
      } = params as VectorizeConfig;

      // Convert input bytes to Buffer for vtracer
      const inputBuffer = Buffer.from(input.bytes);

      // Run vectorization with optimized defaults from spike testing
      const svgString = await vtracerVectorize(inputBuffer, {
        colorMode: ColorMode.Color,
        colorPrecision,
        filterSpeckle,
        spliceThreshold: 45,
        cornerThreshold: 60,
        hierarchical: Hierarchical.Stacked,
        mode: getSimplifyMode(simplify as SimplifyMode),
        layerDifference: 5,
        lengthThreshold: 4,
        maxIterations: 10,
        pathPrecision: 3,
      });

      // Convert SVG string to bytes
      const svgBytes = Buffer.from(svgString, "utf-8");

      return {
        bytes: svgBytes,
        mime: "image/svg+xml",
        width: input.width,
        height: input.height,
        source: "transform:vectorize",
        metadata: {
          operation: "vectorize",
          colorPrecision,
          filterSpeckle,
          simplify,
        },
      };
    },

    async convert(): Promise<ImageBlob> {
      throw new Error(
        "Vectorize transform provider does not support format conversion. Use the sharp provider instead."
      );
    },
  };
}

// Export schema for capability discovery
export { vectorizeSchema };
