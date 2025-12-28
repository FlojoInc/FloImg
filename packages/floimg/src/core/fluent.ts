/**
 * Fluent API for floimg - chainable builder pattern for image workflows
 *
 * @example
 * import { floimg } from '@teamflojo/floimg';
 *
 * // Load, transform, save
 * const result = await floimg
 *   .from('./input.png')
 *   .transform('resize', { width: 800 })
 *   .transform('blur', { sigma: 2 })
 *   .to('./output.png');
 *
 * // Generate and save to cloud
 * const result = await floimg
 *   .generate('openai', { prompt: 'A sunset over mountains' })
 *   .transform('resize', { width: 1920 })
 *   .to('s3://my-bucket/images/sunset.png');
 */

import { readFile } from "fs/promises";
import { resolve } from "path";
import type { FloImg } from "./client.js";
import type {
  ImageBlob,
  DataBlob,
  Pipeline,
  PipelineStep,
  PipelineResult,
  SaveResult,
  MimeType,
} from "./types.js";
import { isImageBlob } from "./types.js";

/** Source for a fluent pipeline - file path, URL, or ImageBlob */
export type FluentSource = string | ImageBlob;

/** MIME type detection from file extension */
const EXT_TO_MIME: Record<string, MimeType> = {
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * Detect MIME type from file path
 */
function detectMimeType(path: string): MimeType {
  const ext = path.toLowerCase().match(/\.[a-z]+$/)?.[0] || "";
  return EXT_TO_MIME[ext] || "image/png";
}

/**
 * Fluent builder for image workflows
 *
 * Accumulates pipeline steps and executes them on terminal methods.
 * Supports loading from files/URLs, generating, transforming, and saving.
 */
export class FluentBuilder {
  private client: FloImg;
  private steps: PipelineStep[] = [];
  private initialVariables: Record<string, ImageBlob | DataBlob> = {};
  private currentVar = "v0";
  private varCounter = 0;
  private _pendingLoad?: string;
  private _pendingLoadVar?: string;

  constructor(client: FloImg) {
    this.client = client;
  }

  /**
   * Start a pipeline from a file path, URL, or ImageBlob
   */
  static from(client: FloImg, source: FluentSource): FluentBuilder {
    const builder = new FluentBuilder(client);
    return builder.loadSource(source);
  }

  /**
   * Start a pipeline by generating an image
   */
  static generate(
    client: FloImg,
    generator: string,
    params?: Record<string, unknown>
  ): FluentBuilder {
    const builder = new FluentBuilder(client);
    const varName = builder.nextVar();

    builder.steps.push({
      kind: "generate",
      generator,
      params: params || {},
      out: varName,
    });

    return builder;
  }

  /**
   * Internal: Load a source into initialVariables
   */
  private loadSource(source: FluentSource): this {
    const varName = this.nextVar();

    if (typeof source === "string") {
      // Will be loaded at execution time
      this._pendingLoad = source;
      this._pendingLoadVar = varName;
    } else {
      // ImageBlob provided directly
      this.initialVariables[varName] = source;
    }

    return this;
  }

  /**
   * Get next variable name
   */
  private nextVar(): string {
    const varName = `v${this.varCounter++}`;
    this.currentVar = varName;
    return varName;
  }

  /**
   * Apply a transform operation to the current image
   */
  transform(op: string, params?: Record<string, unknown>): this {
    const inputVar = this.currentVar;
    const outputVar = this.nextVar();

    this.steps.push({
      kind: "transform",
      op,
      in: inputVar,
      params: params || {},
      out: outputVar,
    });

    return this;
  }

  /**
   * Analyze the current image using AI vision
   */
  analyze(provider: string, params?: Record<string, unknown>): this {
    const inputVar = this.currentVar;
    const outputVar = this.nextVar();

    this.steps.push({
      kind: "vision",
      provider,
      in: inputVar,
      params: params || {},
      out: outputVar,
    });

    return this;
  }

  /**
   * Generate text using AI, optionally using context from previous step
   */
  text(provider: string, params?: Record<string, unknown>): this {
    const inputVar = this.currentVar;
    const outputVar = this.nextVar();

    this.steps.push({
      kind: "text",
      provider,
      in: inputVar,
      params: params || {},
      out: outputVar,
    });

    return this;
  }

  /**
   * Save the result to a destination and execute the pipeline
   */
  async to(destination: string): Promise<SaveResult> {
    const inputVar = this.currentVar;

    this.steps.push({
      kind: "save",
      in: inputVar,
      destination,
    });

    const results = await this.execute();
    const lastResult = results[results.length - 1];

    if (!lastResult || !lastResult.value) {
      throw new Error("Pipeline produced no output");
    }

    return lastResult.value as SaveResult;
  }

  /**
   * Execute the pipeline and return all step results
   */
  async run(): Promise<PipelineResult[]> {
    return this.execute();
  }

  /**
   * Execute the pipeline and return just the final ImageBlob
   */
  async toBlob(): Promise<ImageBlob> {
    const results = await this.execute();
    const lastResult = results[results.length - 1];

    if (!lastResult || !lastResult.value) {
      throw new Error("Pipeline produced no output");
    }

    if (!isImageBlob(lastResult.value)) {
      throw new Error(
        `Expected ImageBlob but got ${typeof lastResult.value}. ` +
          `The last step must produce an image (use transform, not analyze/text).`
      );
    }

    return lastResult.value;
  }

  /**
   * Execute the accumulated pipeline
   */
  private async execute(): Promise<PipelineResult[]> {
    // Handle pending file load
    if (this._pendingLoad && this._pendingLoadVar) {
      const source = this._pendingLoad;
      const varName = this._pendingLoadVar;

      if (source.startsWith("http://") || source.startsWith("https://")) {
        // URL - fetch it
        const response = await fetch(source);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${source}: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const contentType = response.headers.get("content-type") || "image/png";
        const mime = (
          contentType.includes("svg")
            ? "image/svg+xml"
            : contentType.includes("webp")
              ? "image/webp"
              : contentType.includes("jpeg") || contentType.includes("jpg")
                ? "image/jpeg"
                : contentType.includes("avif")
                  ? "image/avif"
                  : "image/png"
        ) as MimeType;

        this.initialVariables[varName] = { bytes: buffer, mime };
      } else {
        // File path - read it
        const fullPath = resolve(process.cwd(), source);
        const bytes = await readFile(fullPath);
        const mime = detectMimeType(source);
        this.initialVariables[varName] = { bytes, mime };
      }
    }

    // Build the pipeline
    const pipeline: Pipeline = {
      name: "fluent-pipeline",
      steps: this.steps,
      initialVariables:
        Object.keys(this.initialVariables).length > 0 ? this.initialVariables : undefined,
    };

    // Execute via client.run()
    return this.client.run(pipeline);
  }
}

/**
 * Create a fluent API facade for a floimg client
 */
export function createFluent(client: FloImg) {
  return {
    /**
     * Start a pipeline from a file path, URL, or ImageBlob
     */
    from(source: FluentSource): FluentBuilder {
      return FluentBuilder.from(client, source);
    },

    /**
     * Start a pipeline by generating an image
     */
    generate(generator: string, params?: Record<string, unknown>): FluentBuilder {
      return FluentBuilder.generate(client, generator, params);
    },
  };
}
