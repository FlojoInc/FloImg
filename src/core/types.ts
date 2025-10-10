/**
 * Core types for imgflo
 */

export type MimeType =
  | "image/svg+xml"
  | "image/png"
  | "image/jpeg"
  | "image/webp"
  | "image/avif";

/**
 * Represents an image as a buffer with metadata
 */
export interface ImageBlob {
  /** Raw image bytes */
  bytes: Buffer;
  /** MIME type of the image */
  mime: MimeType;
  /** Image width in pixels (if known) */
  width?: number;
  /** Image height in pixels (if known) */
  height?: number;
  /** Additional metadata about the image */
  metadata?: Record<string, unknown>;
  /** Source identifier (e.g., "svg:gradient", "ai:openai") */
  source?: string;
}

/**
 * Result from uploading an image to storage
 */
export interface UploadResult {
  /** Storage key/path where the image was uploaded */
  key: string;
  /** Public URL to access the image (if available) */
  url?: string;
  /** ETag or version identifier from the storage provider */
  etag?: string;
  /** Additional metadata from the upload operation */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for imgflo client
 */
export interface ImgfloConfig {
  /** Directory for caching generated images */
  cacheDir?: string;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Image generator configuration */
  generators?: {
    default?: string;
    [generatorName: string]: unknown;
  };
  /** Transform provider configuration */
  transform?: {
    default?: string;
    [providerName: string]: unknown;
  };
  /** Storage provider configuration */
  store?: {
    default?: string;
    [providerName: string]: unknown;
  };

  // Legacy config support
  /** @deprecated Use generators instead */
  svg?: {
    default?: string;
    [providerName: string]: unknown;
  };
  /** @deprecated Use generators instead */
  ai?: {
    default?: string;
    [providerName: string]: unknown;
  };
}

/**
 * Image generator interface - unified for all generation types
 * (SVG, AI, procedural, etc.)
 */
export interface ImageGenerator {
  /** Generator name (e.g., 'shapes', 'openai', 'trianglify') */
  name: string;
  /** Generate an image from parameters */
  generate(params: Record<string, unknown>): Promise<ImageBlob>;
}

// Legacy type aliases for backwards compatibility
export type SvgProvider = ImageGenerator;
export type AiProvider = ImageGenerator;

/**
 * Image transformation provider interface
 */
export interface TransformProvider {
  /** Provider name */
  name: string;
  /** Convert image to a different format */
  convert(input: ImageBlob, to: MimeType): Promise<ImageBlob>;
  /** Resize an image (optional) */
  resize?(
    input: ImageBlob,
    opts: {
      width?: number;
      height?: number;
      fit?: "cover" | "contain" | "fill";
    }
  ): Promise<ImageBlob>;
  /** Composite multiple images together (optional) */
  composite?(
    base: ImageBlob,
    overlays: Array<{
      blob: ImageBlob;
      left: number;
      top: number;
    }>
  ): Promise<ImageBlob>;
  /** Optimize SVG file size (optional) */
  optimizeSvg?(svg: ImageBlob): Promise<ImageBlob>;
}

/**
 * Cloud storage provider interface
 */
export interface StoreProvider {
  /** Provider name */
  name: string;
  /** Upload an image to storage */
  put(input: {
    key: string;
    blob: ImageBlob;
    headers?: Record<string, string>;
  }): Promise<UploadResult>;
  /** Get public URL for a stored image (optional) */
  getUrl?(key: string): Promise<string>;
}

/**
 * Input for generate operation
 */
export interface GenerateInput {
  /** Generator name (e.g., 'shapes', 'openai', 'trianglify') */
  generator: string;
  /** Generator-specific parameters */
  params?: Record<string, unknown>;
}

/**
 * Input for transform operation
 */
export interface TransformInput {
  /** Image blob to transform */
  blob: ImageBlob;
  /** Operation to perform */
  op: "convert" | "resize" | "composite" | "optimizeSvg";
  /** Target MIME type (for convert operation) */
  to?: MimeType;
  /** Additional operation parameters */
  params?: Record<string, unknown>;
}

/**
 * Input for upload operation
 */
export interface UploadInput {
  /** Image blob to upload */
  blob: ImageBlob;
  /** Storage key/path */
  key: string;
  /** Storage provider name (uses default if not specified) */
  provider?: string;
  /** Custom headers to send with upload */
  headers?: Record<string, string>;
}

/**
 * Pipeline step definitions
 */
export type PipelineStep =
  | {
      kind: "generate";
      generator: string;
      params?: Record<string, unknown>;
      out: string;
    }
  | {
      kind: "transform";
      op: "convert" | "resize" | "composite" | "optimizeSvg";
      in: string;
      params: Record<string, unknown>;
      out: string;
    }
  | {
      kind: "upload";
      provider?: string;
      in: string;
      key: string;
      out?: string;
    };

/**
 * Pipeline definition
 */
export interface Pipeline {
  /** Pipeline name */
  name?: string;
  /** Steps to execute */
  steps: PipelineStep[];
  /** Maximum concurrent steps */
  concurrency?: number;
  /** Output directory for intermediate files */
  outDir?: string;
}

/**
 * Result from running a pipeline
 */
export interface PipelineResult {
  /** Step that was executed */
  step: PipelineStep;
  /** Output variable name */
  out: string;
  /** Result value (ImageBlob or UploadResult) */
  value: ImageBlob | UploadResult;
}
