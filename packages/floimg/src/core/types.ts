/**
 * Core types for floimg
 *
 * Includes support for:
 * - Image generation (SVG, AI, procedural)
 * - Image transformation (resize, filters, effects)
 * - AI vision/analysis (Claude, GPT-4V, Ollama LLaVA)
 * - AI text generation (prompts, descriptions, code)
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
 * Represents text or structured data output from AI nodes
 * Used for vision analysis, text generation, and prompt creation
 */
export interface DataBlob {
  /** Data type: plain text or structured JSON */
  type: "text" | "json";
  /** Raw string content */
  content: string;
  /** Parsed JSON object (when type is "json") */
  parsed?: Record<string, unknown>;
  /** Source identifier (e.g., "ai:claude-vision", "ai:gpt4-text") */
  source?: string;
  /** Additional metadata about the output */
  metadata?: Record<string, unknown>;
}

/**
 * Union type for node outputs - supports both images and text/JSON data
 */
export type NodeOutput = ImageBlob | DataBlob;

/**
 * Type guard to check if a value is an ImageBlob
 * Works with any input type for flexible narrowing
 */
export function isImageBlob(value: unknown): value is ImageBlob {
  return (
    typeof value === "object" &&
    value !== null &&
    "bytes" in value &&
    "mime" in value
  );
}

/**
 * Type guard to check if a value is a DataBlob
 * Works with any input type for flexible narrowing
 */
export function isDataBlob(value: unknown): value is DataBlob {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    "content" in value &&
    !("bytes" in value)
  );
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
 * Configuration for floimg client
 */
export interface FloimgConfig {
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
  /** Save provider configuration (filesystem, S3, R2, etc.) */
  save?: {
    default?: string;
    fs?: {
      baseDir?: string;
      chmod?: number;
    };
    s3?: {
      bucket?: string;
      region?: string;
      endpoint?: string;
      credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
      };
    };
    r2?: {
      accountId: string;
      accessKeyId: string;
      secretAccessKey: string;
    };
    [providerName: string]: unknown;
  };

  /**
   * AI provider configuration
   * All AI features are optional - floimg works without any AI configured
   */
  ai?: {
    /** Default provider for AI operations when not specified */
    default?: string;

    // Cloud providers (require API keys)
    openai?: {
      apiKey: string;
      /** Enable GPT-4 Vision capabilities */
      enableVision?: boolean;
      /** Enable text generation capabilities */
      enableText?: boolean;
    };
    anthropic?: {
      apiKey: string;
      /** Model to use (default: claude-sonnet-4-20250514) */
      model?: string;
    };
    gemini?: {
      apiKey: string;
      /** Model to use (default: gemini-pro-vision) */
      model?: string;
    };

    // Meta-providers (one key, many models)
    openrouter?: {
      apiKey: string;
      /** Default model when not specified */
      defaultModel?: string;
    };
    together?: {
      apiKey: string;
    };

    // Local providers (no API key needed!)
    ollama?: {
      /** Ollama server URL (default: http://localhost:11434) */
      baseUrl?: string;
      /** Default vision model (default: llava) */
      visionModel?: string;
      /** Default text model (default: llama3) */
      textModel?: string;
    };
    lmstudio?: {
      /** LM Studio server URL (default: http://localhost:1234) */
      baseUrl?: string;
    };

    /** Allow additional providers */
    [providerName: string]: unknown;
  };
}

// =============================================================================
// Schema Types for Capability Discovery
// =============================================================================

/**
 * JSON Schema-compatible type for a single parameter
 */
export interface ParameterSchema {
  /** Parameter data type */
  type: "string" | "number" | "boolean" | "object" | "array";
  /** Human-readable title for UI display */
  title?: string;
  /** Description of what the parameter does */
  description?: string;
  /** Default value */
  default?: unknown;
  /** Allowed values (for string enums) */
  enum?: string[];
  /** Minimum value (for numbers) */
  minimum?: number;
  /** Maximum value (for numbers) */
  maximum?: number;
  /** For object types: nested property schemas */
  properties?: Record<string, ParameterSchema>;
  /** For array types: schema of array items */
  items?: ParameterSchema;
}

/**
 * Schema for an image generator
 */
export interface GeneratorSchema {
  /** Generator identifier (matches ImageGenerator.name) */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Category for UI grouping (e.g., 'Basic', 'AI', 'Utility') */
  category?: string;
  /** Parameter definitions */
  parameters: Record<string, ParameterSchema>;
  /** Names of required parameters */
  requiredParameters?: string[];
}

/**
 * Schema for a transform operation
 */
export interface TransformOperationSchema {
  /** Operation name (e.g., 'resize', 'blur') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Category for UI grouping (e.g., 'Size', 'Filters', 'Text') */
  category?: string;
  /** Parameter definitions */
  parameters: Record<string, ParameterSchema>;
  /** Names of required parameters */
  requiredParameters?: string[];
}

/**
 * Schema for a save provider
 */
export interface SaveProviderSchema {
  /** Provider name (e.g., 'fs', 's3') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** URL protocols this provider handles (e.g., ['s3://', 'r2://']) */
  protocols?: string[];
}

/**
 * Schema for a vision provider (image analysis)
 */
export interface VisionProviderSchema {
  /** Provider name (e.g., 'claude-vision', 'gpt4-vision', 'ollama-llava') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Category for UI grouping (e.g., 'Cloud', 'Local') */
  category?: string;
  /** Parameter definitions */
  parameters: Record<string, ParameterSchema>;
  /** Names of required parameters */
  requiredParameters?: string[];
  /** Supported output formats */
  outputFormats?: ("text" | "json")[];
  /** Whether this provider requires an API key */
  requiresApiKey?: boolean;
}

/**
 * Schema for a text generation provider
 */
export interface TextProviderSchema {
  /** Provider name (e.g., 'claude-text', 'gpt4-text', 'ollama-llama') */
  name: string;
  /** Human-readable description */
  description?: string;
  /** Category for UI grouping (e.g., 'Cloud', 'Local') */
  category?: string;
  /** Parameter definitions */
  parameters: Record<string, ParameterSchema>;
  /** Names of required parameters */
  requiredParameters?: string[];
  /** Supported output formats */
  outputFormats?: ("text" | "json")[];
  /** Whether this provider requires an API key */
  requiresApiKey?: boolean;
}

/**
 * Complete capabilities of a floimg client
 */
export interface ClientCapabilities {
  /** Available image generators */
  generators: GeneratorSchema[];
  /** Available transform operations */
  transforms: TransformOperationSchema[];
  /** Available save providers */
  saveProviders: SaveProviderSchema[];
  /** Available AI vision/analysis providers */
  visionProviders: VisionProviderSchema[];
  /** Available AI text generation providers */
  textProviders: TextProviderSchema[];
}

// =============================================================================
// Provider Interfaces
// =============================================================================

/**
 * Image generator interface - unified for all generation types
 * (SVG, AI, procedural, etc.)
 */
export interface ImageGenerator {
  /** Generator name (e.g., 'shapes', 'openai', 'trianglify') */
  name: string;
  /** Schema describing this generator's parameters */
  schema: GeneratorSchema;
  /** Generate an image from parameters */
  generate(params: Record<string, unknown>): Promise<ImageBlob>;
}

// Legacy type aliases for backwards compatibility
export type SvgProvider = ImageGenerator;
export type AiProvider = ImageGenerator;

/**
 * AI Vision provider interface - analyzes images and outputs text/JSON
 * Used for image description, OCR, object detection, etc.
 */
export interface VisionProvider {
  /** Provider name (e.g., 'claude-vision', 'gpt4-vision', 'ollama-llava') */
  name: string;
  /** Schema describing this provider's parameters */
  schema: VisionProviderSchema;
  /** Analyze an image and return structured output */
  analyze(input: ImageBlob, params: Record<string, unknown>): Promise<DataBlob>;
}

/**
 * AI Text generation provider interface - generates text from prompts
 * Used for prompt generation, descriptions, code, etc.
 */
export interface TextProvider {
  /** Provider name (e.g., 'claude-text', 'gpt4-text', 'ollama-llama') */
  name: string;
  /** Schema describing this provider's parameters */
  schema: TextProviderSchema;
  /**
   * Generate text from a prompt
   * @param params - Generation parameters including prompt and optional context
   */
  generate(params: Record<string, unknown>): Promise<DataBlob>;
}

/**
 * Image transformation provider interface
 */
export interface TransformProvider {
  /** Provider name */
  name: string;
  /** Schemas for all operations this provider supports */
  operationSchemas: Record<string, TransformOperationSchema>;
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

  // Filter operations (optional)
  /** Apply Gaussian blur */
  blur?(input: ImageBlob, sigma?: number): Promise<ImageBlob>;
  /** Sharpen the image */
  sharpen?(input: ImageBlob, opts?: Record<string, unknown>): Promise<ImageBlob>;
  /** Convert to grayscale */
  grayscale?(input: ImageBlob): Promise<ImageBlob>;
  /** Negate/invert colors */
  negate?(input: ImageBlob): Promise<ImageBlob>;
  /** Auto-enhance contrast */
  normalize?(input: ImageBlob): Promise<ImageBlob>;
  /** Apply threshold (pure B&W) */
  threshold?(input: ImageBlob, value?: number): Promise<ImageBlob>;
  /** Adjust brightness, saturation, hue, lightness */
  modulate?(input: ImageBlob, opts: { brightness?: number; saturation?: number; hue?: number; lightness?: number }): Promise<ImageBlob>;
  /** Apply color tint overlay */
  tint?(input: ImageBlob, color: string | { r: number; g: number; b: number }): Promise<ImageBlob>;

  // Border & frame operations (optional)
  /** Add borders to image */
  extend?(input: ImageBlob, opts: { top: number; bottom: number; left: number; right: number; background?: string | { r: number; g: number; b: number; alpha?: number } }): Promise<ImageBlob>;
  /** Extract a region from image */
  extract?(input: ImageBlob, region: { left: number; top: number; width: number; height: number }): Promise<ImageBlob>;
  /** Round corners of image */
  roundCorners?(input: ImageBlob, radius: number): Promise<ImageBlob>;

  // Text operations (optional)
  /** Add text to image */
  addText?(input: ImageBlob, options: Record<string, unknown>): Promise<ImageBlob>;
  /** Add caption bar to image */
  addCaption?(input: ImageBlob, options: Record<string, unknown>): Promise<ImageBlob>;

  // Preset filters (optional)
  /** Apply preset filter */
  preset?(input: ImageBlob, presetName: string): Promise<ImageBlob>;
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
  op:
    | "convert"
    | "resize"
    | "composite"
    | "optimizeSvg"
    | "blur"
    | "sharpen"
    | "grayscale"
    | "negate"
    | "normalize"
    | "threshold"
    | "modulate"
    | "tint"
    | "extend"
    | "extract"
    | "roundCorners"
    | "addText"
    | "addCaption"
    | "preset";
  /** Target MIME type (for convert operation) */
  to?: MimeType;
  /** Additional operation parameters */
  params?: Record<string, unknown>;
}

/**
 * Input for AI vision/analysis operation
 */
export interface VisionInput {
  /** Vision provider name (e.g., 'claude-vision', 'gpt4-vision', 'ollama-llava') */
  provider: string;
  /** Image blob to analyze */
  blob: ImageBlob;
  /** Provider-specific parameters */
  params?: Record<string, unknown>;
}

/**
 * Input for AI text generation operation
 */
export interface TextGenerateInput {
  /** Text provider name (e.g., 'claude-text', 'gpt4-text', 'ollama-llama') */
  provider: string;
  /** Provider-specific parameters (includes prompt, context, etc.) */
  params?: Record<string, unknown>;
}

/**
 * Input for save operation (supports filesystem and cloud)
 */
export interface SaveInput {
  /** Destination path or key */
  path: string;
  /** Save provider name (auto-detected if not specified) */
  provider?: string;
  /** Overwrite existing file (default: true) */
  overwrite?: boolean;
  /** File permissions for filesystem (default: 0o644) */
  chmod?: number;
  /** Custom headers for cloud uploads */
  headers?: Record<string, string>;
  /** Custom metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Result from saving an image
 */
export interface SaveResult {
  /** Provider used ('fs', 's3', 'r2', etc.) */
  provider: string;
  /** Location where saved (file path or URL) */
  location: string;
  /** File size in bytes */
  size: number;
  /** MIME type */
  mime: MimeType;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Save provider interface (unified for filesystem and cloud)
 */
export interface SaveProvider {
  /** Provider name */
  name: string;
  /** Save an image */
  save(input: {
    blob: ImageBlob;
    path: string;
    [key: string]: unknown;
  }): Promise<SaveResult>;
}

/**
 * Input for upload operation
 * @deprecated Use save() instead
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
      op:
        | "convert"
        | "resize"
        | "composite"
        | "optimizeSvg"
        | "blur"
        | "sharpen"
        | "grayscale"
        | "negate"
        | "normalize"
        | "threshold"
        | "modulate"
        | "tint"
        | "extend"
        | "extract"
        | "roundCorners"
        | "addText"
        | "addCaption"
        | "preset";
      in: string;
      params: Record<string, unknown>;
      out: string;
    }
  | {
      kind: "save";
      provider?: string;
      in: string;
      destination: string;
      out?: string;
    }
  | {
      /** AI vision/analysis step - analyzes an image and outputs text/JSON */
      kind: "vision";
      /** Vision provider name (e.g., 'claude-vision', 'ollama-llava') */
      provider: string;
      /** Input variable name (must be an ImageBlob) */
      in: string;
      /** Provider-specific parameters */
      params?: Record<string, unknown>;
      /** Output variable name (will be a DataBlob) */
      out: string;
    }
  | {
      /** AI text generation step - generates text from a prompt */
      kind: "text";
      /** Text provider name (e.g., 'claude-text', 'ollama-llama') */
      provider: string;
      /** Optional input variable name for context (can be DataBlob or string) */
      in?: string;
      /** Provider-specific parameters including prompt */
      params?: Record<string, unknown>;
      /** Output variable name (will be a DataBlob) */
      out: string;
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
  /** Result value (ImageBlob, DataBlob, or SaveResult) */
  value: ImageBlob | DataBlob | SaveResult;
}
