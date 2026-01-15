import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import type {
  TransformProvider,
  ImageBlob,
  MimeType,
  TransformOperationSchema,
} from "../../core/types.js";
import { TransformError } from "../../core/errors.js";
import { TextRenderer, type TextOptions, type CaptionOptions } from "./text.js";
import { FilterPresets } from "./presets.js";

/**
 * Operation schemas for the Sharp transform provider
 */
export const sharpOperationSchemas: Record<string, TransformOperationSchema> = {
  convert: {
    name: "convert",
    description: "Convert image to a different format",
    category: "Format",
    parameters: {
      to: {
        type: "string",
        title: "Target Format",
        description: "Target image format",
        enum: ["image/png", "image/jpeg", "image/webp", "image/avif"],
      },
    },
    requiredParameters: ["to"],
  },
  resize: {
    name: "resize",
    description: "Resize image dimensions",
    category: "Size",
    parameters: {
      width: {
        type: "number",
        title: "Width",
        description: "Target width in pixels",
        minimum: 1,
        maximum: 4096,
      },
      height: {
        type: "number",
        title: "Height",
        description: "Target height in pixels",
        minimum: 1,
        maximum: 4096,
      },
      fit: {
        type: "string",
        title: "Fit Mode",
        description: "How to fit the image into the target dimensions",
        enum: ["cover", "contain", "fill"],
        default: "cover",
      },
    },
    requiredParameters: [],
  },
  composite: {
    name: "composite",
    description: "Overlay images on top of a base image",
    category: "Composition",
    parameters: {
      overlays: {
        type: "array",
        title: "Overlays",
        description: "Array of images to overlay with their positions",
        items: {
          type: "object",
          properties: {
            left: { type: "number", title: "Left Position" },
            top: { type: "number", title: "Top Position" },
          },
        },
      },
    },
    requiredParameters: ["overlays"],
  },
  blur: {
    name: "blur",
    description: "Apply Gaussian blur to the image",
    category: "Filters",
    parameters: {
      sigma: {
        type: "number",
        title: "Blur Amount",
        description: "Sigma value for Gaussian blur (0.3-1000)",
        default: 3,
        minimum: 0.3,
        maximum: 1000,
      },
    },
    requiredParameters: [],
  },
  sharpen: {
    name: "sharpen",
    description: "Sharpen the image",
    category: "Filters",
    parameters: {
      sigma: {
        type: "number",
        title: "Sigma",
        description: "Sigma value for sharpening",
      },
      m1: {
        type: "number",
        title: "Flat",
        description: "Flat level",
      },
      m2: {
        type: "number",
        title: "Jagged",
        description: "Jagged level",
      },
    },
    requiredParameters: [],
  },
  grayscale: {
    name: "grayscale",
    description: "Convert image to grayscale",
    category: "Filters",
    parameters: {},
    requiredParameters: [],
  },
  negate: {
    name: "negate",
    description: "Invert the colors of the image",
    category: "Filters",
    parameters: {},
    requiredParameters: [],
  },
  normalize: {
    name: "normalize",
    description: "Auto-enhance contrast by stretching luminance",
    category: "Filters",
    parameters: {},
    requiredParameters: [],
  },
  threshold: {
    name: "threshold",
    description: "Convert image to pure black and white",
    category: "Filters",
    parameters: {
      value: {
        type: "number",
        title: "Threshold",
        description: "Threshold value (0-255)",
        default: 128,
        minimum: 0,
        maximum: 255,
      },
    },
    requiredParameters: [],
  },
  modulate: {
    name: "modulate",
    description: "Adjust brightness, saturation, and hue",
    category: "Adjustments",
    parameters: {
      brightness: {
        type: "number",
        title: "Brightness",
        description: "Brightness multiplier (1 = no change)",
        default: 1,
        minimum: 0,
      },
      saturation: {
        type: "number",
        title: "Saturation",
        description: "Saturation multiplier (1 = no change)",
        default: 1,
        minimum: 0,
      },
      hue: {
        type: "number",
        title: "Hue",
        description: "Hue rotation in degrees",
        default: 0,
      },
      lightness: {
        type: "number",
        title: "Lightness",
        description: "Lightness adjustment",
      },
    },
    requiredParameters: [],
  },
  tint: {
    name: "tint",
    description: "Apply a color tint overlay",
    category: "Filters",
    parameters: {
      color: {
        type: "string",
        title: "Tint Color",
        description: "Color to tint the image (hex or named color)",
      },
    },
    requiredParameters: ["color"],
  },
  extend: {
    name: "extend",
    description: "Add borders/padding around the image",
    category: "Size",
    parameters: {
      top: {
        type: "number",
        title: "Top",
        description: "Padding on top in pixels",
        default: 0,
        minimum: 0,
      },
      bottom: {
        type: "number",
        title: "Bottom",
        description: "Padding on bottom in pixels",
        default: 0,
        minimum: 0,
      },
      left: {
        type: "number",
        title: "Left",
        description: "Padding on left in pixels",
        default: 0,
        minimum: 0,
      },
      right: {
        type: "number",
        title: "Right",
        description: "Padding on right in pixels",
        default: 0,
        minimum: 0,
      },
      background: {
        type: "string",
        title: "Background",
        description: "Background color for the padding",
        default: "#000000",
      },
    },
    requiredParameters: [],
  },
  extract: {
    name: "extract",
    description: "Crop a region from the image",
    category: "Size",
    parameters: {
      left: {
        type: "number",
        title: "Left",
        description: "Left edge of crop region",
        minimum: 0,
      },
      top: {
        type: "number",
        title: "Top",
        description: "Top edge of crop region",
        minimum: 0,
      },
      width: {
        type: "number",
        title: "Width",
        description: "Width of crop region",
        minimum: 1,
      },
      height: {
        type: "number",
        title: "Height",
        description: "Height of crop region",
        minimum: 1,
      },
    },
    requiredParameters: ["left", "top", "width", "height"],
  },
  roundCorners: {
    name: "roundCorners",
    description: "Round the corners of the image",
    category: "Effects",
    parameters: {
      radius: {
        type: "number",
        title: "Radius",
        description: "Corner radius in pixels",
        minimum: 0,
      },
    },
    requiredParameters: ["radius"],
  },
  addText: {
    name: "addText",
    description: "Add text overlay to the image",
    category: "Text",
    parameters: {
      text: {
        type: "string",
        title: "Text",
        description: "Text to add to the image",
      },
      x: {
        type: "number",
        title: "X Position",
        description: "Horizontal position",
      },
      y: {
        type: "number",
        title: "Y Position",
        description: "Vertical position",
      },
      fontSize: {
        type: "number",
        title: "Font Size",
        description: "Font size in pixels",
        default: 32,
      },
      color: {
        type: "string",
        title: "Text Color",
        description: "Color of the text",
        default: "#ffffff",
      },
      fontFamily: {
        type: "string",
        title: "Font Family",
        description: "Font family to use",
        default: "sans-serif",
      },
    },
    requiredParameters: ["text"],
  },
  addCaption: {
    name: "addCaption",
    description: "Add a caption bar to the image",
    category: "Text",
    parameters: {
      text: {
        type: "string",
        title: "Caption",
        description: "Caption text",
      },
      position: {
        type: "string",
        title: "Position",
        description: "Where to place the caption",
        enum: ["top", "bottom"],
        default: "bottom",
      },
      fontSize: {
        type: "number",
        title: "Font Size",
        description: "Font size in pixels",
        default: 24,
      },
      backgroundColor: {
        type: "string",
        title: "Background Color",
        description: "Caption bar background color",
        default: "#000000",
      },
      textColor: {
        type: "string",
        title: "Text Color",
        description: "Caption text color",
        default: "#ffffff",
      },
    },
    requiredParameters: ["text"],
  },
  preset: {
    name: "preset",
    description: "Apply a preset filter effect",
    category: "Effects",
    parameters: {
      name: {
        type: "string",
        title: "Preset Name",
        description: "Name of the preset filter to apply",
        enum: ["vintage", "sepia", "cool", "warm", "dramatic", "muted"],
      },
    },
    requiredParameters: ["name"],
  },
};

/**
 * Transform provider using Sharp for image manipulation and Resvg for SVG rendering
 *
 * Implements self-dispatching via the transform() method - the client delegates
 * operation routing to the provider rather than maintaining a central switch statement.
 */
export class SharpTransformProvider implements TransformProvider {
  name = "sharp";
  operationSchemas = sharpOperationSchemas;

  /**
   * Execute a transform operation by name
   * This is the primary entry point for dynamic operation dispatch
   */
  async transform(
    input: ImageBlob,
    op: string,
    params: Record<string, unknown>
  ): Promise<ImageBlob> {
    switch (op) {
      case "convert":
        if (!params.to) {
          throw new TransformError("Convert operation requires 'to' parameter");
        }
        return this.convert(input, params.to as MimeType);

      case "resize":
        return this.resize(input, params as Parameters<typeof this.resize>[1]);

      case "composite":
        return this.composite(input, params.overlays as Parameters<typeof this.composite>[1]);

      case "optimizeSvg":
        return this.optimizeSvg(input);

      case "blur":
        return this.blur(input, params.sigma as number | undefined);

      case "sharpen":
        return this.sharpen(input, params);

      case "grayscale":
        return this.grayscale(input);

      case "negate":
        return this.negate(input);

      case "normalize":
        return this.normalize(input);

      case "threshold":
        return this.threshold(input, params.value as number | undefined);

      case "modulate":
        return this.modulate(input, params as Parameters<typeof this.modulate>[1]);

      case "tint":
        return this.tint(input, params.color as Parameters<typeof this.tint>[1]);

      case "extend":
        return this.extend(input, params as Parameters<typeof this.extend>[1]);

      case "extract":
        return this.extract(input, params as Parameters<typeof this.extract>[1]);

      case "roundCorners":
        return this.roundCorners(input, params.radius as number);

      case "addText":
        return this.addText(input, params);

      case "addCaption":
        return this.addCaption(input, params);

      case "preset":
        return this.preset(input, params.name as string);

      default:
        throw new TransformError(`Unknown operation: ${op}`);
    }
  }

  async convert(input: ImageBlob, to: MimeType): Promise<ImageBlob> {
    try {
      let sharpInstance: sharp.Sharp;

      // If input is SVG, use Resvg to render it to PNG first
      if (input.mime === "image/svg+xml") {
        const resvg = new Resvg(input.bytes, {
          fitTo: {
            mode: "original",
          },
        });

        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();

        // Now we have PNG, continue with Sharp for format conversion
        if (to === "image/png") {
          return {
            bytes: pngBuffer,
            mime: "image/png",
            width: pngData.width,
            height: pngData.height,
            source: input.source,
          };
        }

        sharpInstance = sharp(pngBuffer);
      } else {
        sharpInstance = sharp(input.bytes);
      }

      // Get metadata for width/height
      const metadata = await sharpInstance.metadata();

      // Convert to target format
      let outputBuffer: Buffer;
      switch (to) {
        case "image/png":
          outputBuffer = await sharpInstance.png().toBuffer();
          break;
        case "image/jpeg":
          outputBuffer = await sharpInstance.jpeg({ quality: 90 }).toBuffer();
          break;
        case "image/webp":
          outputBuffer = await sharpInstance.webp({ quality: 90 }).toBuffer();
          break;
        case "image/avif":
          outputBuffer = await sharpInstance.avif({ quality: 90 }).toBuffer();
          break;
        case "image/svg+xml":
          throw new TransformError("Cannot convert raster images to SVG");
        default:
          throw new TransformError(`Unsupported target format: ${to}`);
      }

      return {
        bytes: outputBuffer,
        mime: to,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      if (error instanceof TransformError) {
        throw error;
      }
      throw new TransformError(
        `Failed to convert image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async resize(
    input: ImageBlob,
    opts: {
      width?: number;
      height?: number;
      fit?: "cover" | "contain" | "fill";
    }
  ): Promise<ImageBlob> {
    try {
      let sharpInstance: sharp.Sharp;

      // Handle SVG input
      if (input.mime === "image/svg+xml") {
        const resvg = new Resvg(input.bytes, {
          fitTo: {
            mode: "width",
            value: opts.width || input.width || 1200,
          },
        });

        const pngData = resvg.render();
        const pngBuffer = pngData.asPng();
        sharpInstance = sharp(pngBuffer);
      } else {
        sharpInstance = sharp(input.bytes);
      }

      // Apply resize
      const resized = sharpInstance.resize({
        width: opts.width,
        height: opts.height,
        fit: opts.fit || "cover",
      });

      const outputBuffer = await resized.toBuffer();
      const metadata = await sharp(outputBuffer).metadata();

      return {
        bytes: outputBuffer,
        mime: input.mime === "image/svg+xml" ? "image/png" : input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to resize image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async composite(
    base: ImageBlob,
    overlays: Array<{ blob: ImageBlob; left: number; top: number }>
  ): Promise<ImageBlob> {
    try {
      // Validate base image
      if (!base?.bytes) {
        throw new TransformError("Base image is required for composite operation");
      }

      // Validate all overlays - fail fast if any are invalid (consistent with other transforms)
      const invalidIndices: number[] = [];
      for (let i = 0; i < overlays.length; i++) {
        if (!overlays[i]?.blob?.bytes) {
          invalidIndices.push(i);
        }
      }

      if (invalidIndices.length > 0) {
        throw new TransformError(
          `Overlay image(s) at index ${invalidIndices.join(", ")} missing or invalid`
        );
      }

      // If no overlays, return base unchanged
      if (overlays.length === 0) {
        return base;
      }

      let baseInstance = sharp(base.bytes);

      const compositeInputs = overlays.map((overlay) => ({
        input: overlay.blob.bytes,
        left: overlay.left,
        top: overlay.top,
      }));

      const result = await baseInstance.composite(compositeInputs).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: base.mime,
        width: metadata.width,
        height: metadata.height,
        source: base.source,
      };
    } catch (error) {
      if (error instanceof TransformError) {
        throw error;
      }
      throw new TransformError(
        `Failed to composite images: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async optimizeSvg(svg: ImageBlob): Promise<ImageBlob> {
    if (svg.mime !== "image/svg+xml") {
      throw new TransformError("optimizeSvg only works with SVG images");
    }

    // For MVP, we'll just return the SVG as-is
    // In the future, we could integrate SVGO here
    return svg;
  }

  // ===== Filter Operations =====

  async blur(input: ImageBlob, sigma?: number): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.blur(sigma).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to blur image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async sharpen(input: ImageBlob, opts?: Record<string, unknown>): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = opts
        ? await sharpInstance.sharpen(opts as any).toBuffer()
        : await sharpInstance.sharpen().toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to sharpen image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async grayscale(input: ImageBlob): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.grayscale().toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to convert image to grayscale: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async negate(input: ImageBlob): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.negate().toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to negate image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async normalize(input: ImageBlob): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.normalize().toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to normalize image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async threshold(input: ImageBlob, value?: number): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.threshold(value).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to threshold image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async modulate(
    input: ImageBlob,
    opts: { brightness?: number; saturation?: number; hue?: number; lightness?: number }
  ): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.modulate(opts).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to modulate image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async tint(
    input: ImageBlob,
    color: string | { r: number; g: number; b: number }
  ): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.tint(color).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to tint image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ===== Border & Frame Operations =====

  async extend(
    input: ImageBlob,
    opts: {
      top: number;
      bottom: number;
      left: number;
      right: number;
      background?: string | { r: number; g: number; b: number; alpha?: number };
    }
  ): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.extend(opts).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to extend image: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async extract(
    input: ImageBlob,
    region: { left: number; top: number; width: number; height: number }
  ): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const result = await sharpInstance.extract(region).toBuffer();
      const metadata = await sharp(result).metadata();

      return {
        bytes: result,
        mime: input.mime,
        width: metadata.width,
        height: metadata.height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to extract region: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async roundCorners(input: ImageBlob, radius: number): Promise<ImageBlob> {
    try {
      const sharpInstance = sharp(input.bytes);
      const metadata = await sharpInstance.metadata();
      const width = metadata.width || 100;
      const height = metadata.height || 100;

      // Create SVG mask for rounded corners
      const mask = Buffer.from(
        `<svg width="${width}" height="${height}">
          <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
        </svg>`
      );

      // Apply mask using composite
      const result = await sharpInstance
        .composite([
          {
            input: mask,
            blend: "dest-in",
          },
        ])
        .toBuffer();

      return {
        bytes: result,
        mime: input.mime === "image/svg+xml" ? "image/png" : input.mime,
        width,
        height,
        source: input.source,
      };
    } catch (error) {
      throw new TransformError(
        `Failed to round corners: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // ===== Text Operations =====

  async addText(input: ImageBlob, options: Record<string, unknown>): Promise<ImageBlob> {
    return TextRenderer.addText(input, options as unknown as TextOptions);
  }

  async addCaption(input: ImageBlob, options: Record<string, unknown>): Promise<ImageBlob> {
    return TextRenderer.addCaption(input, options as unknown as CaptionOptions);
  }

  // ===== Preset Filters =====

  async preset(input: ImageBlob, presetName: string): Promise<ImageBlob> {
    return FilterPresets.applyPreset(input, presetName);
  }
}
