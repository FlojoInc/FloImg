import sharp from "sharp";
import { Resvg } from "@resvg/resvg-js";
import type { TransformProvider, ImageBlob, MimeType } from "../../core/types.js";
import { TransformError } from "../../core/errors.js";

/**
 * Transform provider using Sharp for image manipulation and Resvg for SVG rendering
 */
export class SharpTransformProvider implements TransformProvider {
  name = "sharp";

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
}
