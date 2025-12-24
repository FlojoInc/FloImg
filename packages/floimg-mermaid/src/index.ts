import type { ImageGenerator, ImageBlob, GeneratorSchema } from "@teamflojo/floimg";
import { run as runMermaid } from "@mermaid-js/mermaid-cli";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Schema for the Mermaid diagram generator
 */
export const mermaidSchema: GeneratorSchema = {
  name: "mermaid",
  description: "Generate diagrams using Mermaid syntax (flowcharts, sequence diagrams, etc.)",
  category: "Diagrams",
  parameters: {
    code: {
      type: "string",
      title: "Mermaid Code",
      description: "Mermaid diagram syntax (e.g., 'graph TD; A-->B')",
    },
    theme: {
      type: "string",
      title: "Theme",
      description: "Diagram color theme",
      enum: ["default", "forest", "dark", "neutral"],
      default: "default",
    },
    backgroundColor: {
      type: "string",
      title: "Background Color",
      description: "Background color (hex or named color)",
      default: "white",
    },
    format: {
      type: "string",
      title: "Output Format",
      description: "Output image format",
      enum: ["svg", "png"],
      default: "svg",
    },
    width: {
      type: "number",
      title: "Width",
      description: "Image width in pixels (for PNG)",
      minimum: 100,
      maximum: 4096,
    },
    height: {
      type: "number",
      title: "Height",
      description: "Image height in pixels (for PNG)",
      minimum: 100,
      maximum: 4096,
    },
  },
  requiredParameters: ["code"],
};

/**
 * Mermaid diagram generator - creates diagrams using Mermaid syntax
 *
 * This generator accepts Mermaid diagram syntax directly (pass-through pattern).
 * No floimg abstraction - you get full Mermaid capabilities.
 *
 * @see https://mermaid.js.org/intro/ - Mermaid documentation
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import mermaid from '@teamflojo/floimg-mermaid';
 *
 * const floimg = createClient();
 * floimg.registerGenerator(mermaid());
 *
 * const diagram = await floimg.generate({
 *   generator: 'mermaid',
 *   params: {
 *     code: `
 *       graph TD
 *         A[Start] --> B[Process]
 *         B --> C[End]
 *     `,
 *     theme: 'dark'
 *   }
 * });
 * ```
 */
export interface MermaidConfig {
  /** Default theme: 'default' | 'forest' | 'dark' | 'neutral' */
  theme?: string;
  /** Default background color */
  backgroundColor?: string;
  /** Output format: 'svg' | 'png' (default: 'svg') */
  format?: "svg" | "png";
  /** Image width (for PNG) */
  width?: number;
  /** Image height (for PNG) */
  height?: number;
}

export interface MermaidParams extends Record<string, unknown> {
  /** Mermaid diagram code (required) */
  code?: string;
  /** Theme override */
  theme?: string;
  /** Background color override */
  backgroundColor?: string;
  /** Format override */
  format?: "svg" | "png";
  /** Width override (for PNG) */
  width?: number;
  /** Height override (for PNG) */
  height?: number;
  /** Mermaid config object (advanced) */
  mermaidConfig?: Record<string, unknown>;
}

/**
 * Create a Mermaid generator instance
 */
export default function mermaid(config: MermaidConfig = {}): ImageGenerator {
  const {
    theme: defaultTheme = "default",
    backgroundColor: defaultBgColor = "white",
    format: defaultFormat = "svg",
    width: defaultWidth,
    height: defaultHeight,
  } = config;

  return {
    name: "mermaid",
    schema: mermaidSchema,

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      const {
        code,
        theme = defaultTheme,
        backgroundColor = defaultBgColor,
        format = defaultFormat,
        width = defaultWidth,
        height = defaultHeight,
        mermaidConfig = {},
      } = params as MermaidParams;

      if (!code) {
        throw new Error("Mermaid 'code' parameter is required");
      }

      // Create temp files
      const tempId = Math.random().toString(36).substring(7);
      const inputFile = join(tmpdir(), `mermaid-${tempId}.mmd`);
      const outputFile = join(tmpdir(), `mermaid-${tempId}.${format}`);

      try {
        // Write Mermaid code to temp file
        await writeFile(inputFile, code, "utf-8");

        // Build Mermaid CLI config
        const cliConfig: Record<string, unknown> = {
          theme,
          backgroundColor,
          ...(width && { width }),
          ...(height && { height }),
          ...mermaidConfig,
        };

        // Run Mermaid CLI
        await runMermaid(
          inputFile,
          outputFile as any, // CLI typing is too strict, we build valid paths
          cliConfig
        );

        // Read output
        const { readFile } = await import("fs/promises");
        const bytes = await readFile(outputFile);

        // Determine MIME type
        const mimeType = format === "png" ? "image/png" : "image/svg+xml";

        return {
          bytes: Buffer.from(bytes),
          mime: mimeType as any,
          ...(width && { width }),
          ...(height && { height }),
          source: "mermaid",
          metadata: {
            theme,
            format,
          },
        };
      } finally {
        // Cleanup temp files
        try {
          await unlink(inputFile);
          await unlink(outputFile);
        } catch {
          // Ignore cleanup errors
        }
      }
    },
  };
}

// Also export as named export for convenience
export { mermaid };
