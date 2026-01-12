import type { ImageGenerator, ImageBlob, GeneratorSchema } from "@teamflojo/floimg";
import QRCode from "qrcode";

/**
 * Schema for the QR code generator
 */
export const qrSchema: GeneratorSchema = {
  name: "qr",
  description: "Generate QR codes from text or URLs",
  category: "Utility",
  parameters: {
    text: {
      type: "string",
      title: "Content",
      description: "Text or URL to encode in the QR code",
    },
    errorCorrectionLevel: {
      type: "string",
      title: "Error Correction",
      description: "Error correction level: L (7%), M (15%), Q (25%), H (30%)",
      enum: ["L", "M", "Q", "H"],
      default: "M",
    },
    width: {
      type: "number",
      title: "Width",
      description: "Output width in pixels",
      default: 300,
      minimum: 50,
      maximum: 1000,
    },
    margin: {
      type: "number",
      title: "Margin",
      description: "Quiet zone margin (in modules)",
      default: 4,
      minimum: 0,
      maximum: 20,
    },
    format: {
      type: "string",
      title: "Output Format",
      description: "Output image format",
      enum: ["png", "svg"],
      default: "png",
    },
    version: {
      type: "number",
      title: "QR Version",
      description: "QR code version (1-40, auto if not specified)",
      minimum: 1,
      maximum: 40,
    },
    maskPattern: {
      type: "number",
      title: "Mask Pattern",
      description: "Mask pattern (0-7, auto if not specified)",
      minimum: 0,
      maximum: 7,
    },
    color: {
      type: "object",
      title: "Colors",
      description: "QR code colors for dark and light modules",
      properties: {
        dark: {
          type: "string",
          title: "Dark Color",
          description: "Color for dark modules (hex format)",
          default: "#000000",
        },
        light: {
          type: "string",
          title: "Light Color",
          description: "Color for light modules (hex format)",
          default: "#ffffff",
        },
      },
    },
  },
  requiredParameters: ["text"],
};

/**
 * QR code generator using the qrcode library
 *
 * This generator accepts qrcode library options directly (pass-through pattern).
 * No floimg abstraction - you get full qrcode library capabilities.
 *
 * @see https://github.com/soldair/node-qrcode - qrcode library documentation
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import qr from '@teamflojo/floimg-qr';
 *
 * const floimg = createClient();
 * floimg.registerGenerator(qr());
 *
 * const qrCode = await floimg.generate({
 *   generator: 'qr',
 *   params: {
 *     text: 'https://github.com/FlojoInc/floimg',
 *     errorCorrectionLevel: 'H',
 *     width: 300
 *   }
 * });
 * ```
 */
export interface QRConfig {
  /** Default error correction level */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  /** Default width */
  width?: number;
  /** Default margin */
  margin?: number;
  /** Default color (dark) */
  color?: {
    dark?: string;
    light?: string;
  };
}

export interface QRParams extends Record<string, unknown> {
  /** Text/URL to encode (required) */
  text?: string;
  /** Error correction level: L (7%), M (15%), Q (25%), H (30%) */
  errorCorrectionLevel?: "L" | "M" | "Q" | "H";
  /** Output width in pixels */
  width?: number;
  /** Margin around QR code (in modules) */
  margin?: number;
  /** Colors */
  color?: {
    /** Dark color (default: #000000) */
    dark?: string;
    /** Light color (default: #ffffff) */
    light?: string;
  };
  /** Output format: 'png' | 'svg' */
  format?: "png" | "svg";
  /** QR code version (1-40, auto if not specified) */
  version?: number;
  /** Mask pattern (0-7, auto if not specified) */
  maskPattern?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
  /** Output quality for JPEG (0-1) */
  quality?: number;
}

/**
 * Create a QR code generator instance
 */
export default function qr(config: QRConfig = {}): ImageGenerator {
  const {
    errorCorrectionLevel: defaultErrorLevel = "M",
    width: defaultWidth = 300,
    margin: defaultMargin = 4,
    color: defaultColor = { dark: "#000000", light: "#ffffff" },
  } = config;

  return {
    name: "qr",
    schema: qrSchema,

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        text,
        errorCorrectionLevel = defaultErrorLevel,
        width = defaultWidth,
        margin = defaultMargin,
        color = defaultColor,
        format = "png",
        version,
        maskPattern,
        quality: _quality,
      } = params as QRParams;

      if (!text) {
        throw new Error("QR code 'text' parameter is required");
      }

      // Build qrcode library options (pass-through)
      const baseOptions = {
        errorCorrectionLevel,
        width,
        margin,
        color,
        ...(version && { version }),
        ...(maskPattern !== undefined && { maskPattern }),
      };

      // Generate QR code
      let bytes: Buffer;
      let mime: "image/png" | "image/svg+xml";

      if (format === "svg") {
        // Generate SVG
        const svgString = await QRCode.toString(text, {
          ...baseOptions,
          type: "svg",
        });
        bytes = Buffer.from(svgString, "utf-8");
        mime = "image/svg+xml";
      } else {
        // Generate PNG
        bytes = await QRCode.toBuffer(text, {
          ...baseOptions,
          type: "png",
        });
        mime = "image/png";
      }

      return {
        bytes,
        mime,
        width: width as number,
        height: width as number, // QR codes are square
        source: "qr",
        metadata: {
          text,
          errorCorrectionLevel,
          format,
        },
      };
    },
  };
}

// Also export as named export for convenience
export { qr };
