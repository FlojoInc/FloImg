import type { SvgProvider, ImageBlob } from "../../core/types.js";
import { GenerationError } from "../../core/errors.js";

/**
 * Simple SVG shapes provider for generating basic graphics
 */
export class ShapesProvider implements SvgProvider {
  name = "shapes";

  async generate(params: Record<string, unknown>): Promise<ImageBlob> {
    const {
      type = "gradient",
      width = 1200,
      height = 630,
      color1 = "#667eea",
      color2 = "#764ba2",
      ...rest
    } = params;

    let svgContent: string;

    switch (type) {
      case "gradient":
        svgContent = this.generateGradient(
          width as number,
          height as number,
          color1 as string,
          color2 as string
        );
        break;

      case "circle":
        svgContent = this.generateCircle(
          width as number,
          height as number,
          rest.fill as string | undefined
        );
        break;

      case "rectangle":
        svgContent = this.generateRectangle(
          width as number,
          height as number,
          rest.fill as string | undefined,
          rest.rx as number | undefined
        );
        break;

      case "pattern":
        svgContent = this.generatePattern(
          width as number,
          height as number,
          rest.patternType as string | undefined
        );
        break;

      default:
        throw new GenerationError(`Unknown shape type: ${type}`);
    }

    return {
      bytes: Buffer.from(svgContent, "utf-8"),
      mime: "image/svg+xml",
      width: width as number,
      height: height as number,
      source: `svg:shapes:${type}`,
    };
  }

  private generateGradient(
    width: number,
    height: number,
    color1: string,
    color2: string
  ): string {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${color1};stop-opacity:1" />
      <stop offset="100%" style="stop-color:${color2};stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#grad)" />
</svg>`;
  }

  private generateCircle(
    width: number,
    height: number,
    fill: string = "#667eea"
  ): string {
    const radius = Math.min(width, height) / 2 - 10;
    const cx = width / 2;
    const cy = height / 2;

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" />
</svg>`;
  }

  private generateRectangle(
    width: number,
    height: number,
    fill: string = "#764ba2",
    rx: number = 0
  ): string {
    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${width}" height="${height}" fill="${fill}" rx="${rx}" />
</svg>`;
  }

  private generatePattern(
    width: number,
    height: number,
    patternType: string = "dots"
  ): string {
    if (patternType === "dots") {
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <circle cx="20" cy="20" r="3" fill="#667eea" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="#f0f0f0" />
  <rect width="${width}" height="${height}" fill="url(#dots)" />
</svg>`;
    }

    if (patternType === "stripes") {
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="stripes" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
      <rect width="10" height="20" fill="#667eea" />
      <rect x="10" width="10" height="20" fill="#764ba2" />
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#stripes)" />
</svg>`;
    }

    if (patternType === "grid") {
      return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#667eea" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="${width}" height="${height}" fill="#ffffff" />
  <rect width="${width}" height="${height}" fill="url(#grid)" />
</svg>`;
    }

    throw new GenerationError(`Unknown pattern type: ${patternType}`);
  }
}
