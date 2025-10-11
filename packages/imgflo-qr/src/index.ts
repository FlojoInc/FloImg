import type { ImageGenerator, ImageBlob } from "imgflo";
import QRCode from "qrcode";

/**
 * QR code generator using the qrcode library
 *
 * This generator accepts qrcode library options directly (pass-through pattern).
 * No imgflo abstraction - you get full qrcode library capabilities.
 *
 * @see https://github.com/soldair/node-qrcode - qrcode library documentation
 *
 * @example
 * ```typescript
 * import createClient from 'imgflo';
 * import qr from 'imgflo-qr';
 *
 * const imgflo = createClient();
 * imgflo.registerGenerator(qr());
 *
 * const qrCode = await imgflo.generate({
 *   generator: 'qr',
 *   params: {
 *     text: 'https://github.com/bcooke/imgflo',
 *     errorCorrectionLevel: 'H',
 *     width: 300
 *   }
 * });
 * ```
 */
export interface QRConfig {
  /** Default error correction level */
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
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
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
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
  format?: 'png' | 'svg';
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
    errorCorrectionLevel: defaultErrorLevel = 'M',
    width: defaultWidth = 300,
    margin: defaultMargin = 4,
    color: defaultColor = { dark: '#000000', light: '#ffffff' },
  } = config;

  return {
    name: "qr",

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        text,
        errorCorrectionLevel = defaultErrorLevel,
        width = defaultWidth,
        margin = defaultMargin,
        color = defaultColor,
        format = 'png',
        version,
        maskPattern,
        quality,
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
      let mime: 'image/png' | 'image/svg+xml';

      if (format === 'svg') {
        // Generate SVG
        const svgString = await QRCode.toString(text, {
          ...baseOptions,
          type: 'svg',
        });
        bytes = Buffer.from(svgString, 'utf-8');
        mime = 'image/svg+xml';
      } else {
        // Generate PNG
        bytes = await QRCode.toBuffer(text, {
          ...baseOptions,
          type: 'png',
        });
        mime = 'image/png';
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
