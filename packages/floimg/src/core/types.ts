/**
 * Core types for floimg
 *
 * Includes support for:
 * - Image generation (SVG, AI, procedural)
 * - Image transformation (resize, filters, effects)
 * - AI vision/analysis (Claude, GPT-4V, Ollama LLaVA)
 * - AI text generation (prompts, descriptions, code)
 */

export type MimeType = "image/svg+xml" | "image/png" | "image/jpeg" | "image/webp" | "image/avif";

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
  return typeof value === "object" && value !== null && "bytes" in value && "mime" in value;
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
  /** Output type this generator produces (default: 'image') */
  outputType?: "image" | "data";

  // AI-specific metadata
  /** Whether this generator uses AI/ML models */
  isAI?: boolean;
  /** Whether this generator requires an API key to function */
  requiresApiKey?: boolean;
  /** Environment variable name for the API key (e.g., 'OPENAI_API_KEY') */
  apiKeyEnvVar?: string;

  // Reference image support (for AI generators that can use style/content references)
  /** Whether this generator accepts reference images as input */
  acceptsReferenceImages?: boolean;
  /** Maximum number of reference images supported (default: unlimited if acceptsReferenceImages is true) */
  maxReferenceImages?: number;
}

/**
 * I/O type for schema validation
 * Used by visual builders to validate connections between nodes
 */
export type IOType = "image" | "data";

/**
 * Supported image MIME types for format constraints
 */
export type ImageMimeType = "image/png" | "image/jpeg" | "image/webp" | "image/avif";

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
  /** Input type this operation accepts (default: 'image') */
  inputType?: IOType;
  /** Output type this operation produces (default: 'image') */
  outputType?: IOType;

  // AI-specific metadata (for AI transforms like background removal, upscale)
  /** Whether this transform uses AI/ML models */
  isAI?: boolean;
  /** Whether this transform requires an API key to function */
  requiresApiKey?: boolean;
  /** Environment variable name for the API key */
  apiKeyEnvVar?: string;

  // Reference image support (for AI transforms that can use additional reference images)
  /** Whether this transform accepts additional reference images beyond the primary input */
  acceptsReferenceImages?: boolean;
  /** Maximum number of reference images supported */
  maxReferenceImages?: number;

  // Input format constraints (for operations with specific format requirements)
  /**
   * Accepted input image formats. If specified, validation will fail for other formats.
   * Use this for API limitations like OpenAI edit requiring PNG.
   */
  acceptedInputFormats?: ImageMimeType[];
  /** Custom error message when input format doesn't match (optional) */
  inputFormatError?: string;
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
  /** Input type (always 'image' for vision providers) */
  inputType?: IOType;
  /** Output type (always 'data' for vision providers) */
  outputType?: IOType;
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
  /** Input type (optional 'data' for context) */
  inputType?: IOType;
  /** Output type (always 'data' for text providers) */
  outputType?: IOType;
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
 *
 * Providers handle their own operation dispatch via the transform() method.
 * The individual operation methods (resize, blur, etc.) are optional and
 * only used for type-safe direct calls. The transform() method is the
 * primary entry point for dynamic operation dispatch.
 */
export interface TransformProvider {
  /** Provider name */
  name: string;
  /** Schemas for all operations this provider supports */
  operationSchemas: Record<string, TransformOperationSchema>;

  /**
   * Execute a transform operation by name
   * This is the primary dispatch method - providers handle their own routing
   * @param input - Image to transform
   * @param op - Operation name (e.g., 'resize', 'blur', 'convert')
   * @param params - Operation-specific parameters
   */
  transform(input: ImageBlob, op: string, params: Record<string, unknown>): Promise<ImageBlob>;

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
  modulate?(
    input: ImageBlob,
    opts: { brightness?: number; saturation?: number; hue?: number; lightness?: number }
  ): Promise<ImageBlob>;
  /** Apply color tint overlay */
  tint?(input: ImageBlob, color: string | { r: number; g: number; b: number }): Promise<ImageBlob>;

  // Border & frame operations (optional)
  /** Add borders to image */
  extend?(
    input: ImageBlob,
    opts: {
      top: number;
      bottom: number;
      left: number;
      right: number;
      background?: string | { r: number; g: number; b: number; alpha?: number };
    }
  ): Promise<ImageBlob>;
  /** Extract a region from image */
  extract?(
    input: ImageBlob,
    region: { left: number; top: number; width: number; height: number }
  ): Promise<ImageBlob>;
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
  /** Operation to perform (string allows custom operations from plugins) */
  op: string;
  /**
   * Transform provider to use (optional)
   * If not specified, uses the default provider from config
   * Use this to target specific providers (e.g., 'stability' for AI transforms)
   */
  provider?: string;
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
  /** Alternative names this provider can be referenced by (for backwards compatibility) */
  aliases?: string[];
  /** Save an image */
  save(input: { blob: ImageBlob; path: string; [key: string]: unknown }): Promise<SaveResult>;
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
      /** Operation name (string allows custom operations from plugins) */
      op: string;
      /** Input variable name */
      in: string;
      /** Operation parameters */
      params: Record<string, unknown>;
      /** Output variable name */
      out: string;
      /**
       * Transform provider to use (optional)
       * If not specified, uses the default provider
       */
      provider?: string;
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
    }
  | {
      /**
       * Fan-out step - distributes execution across parallel branches
       *
       * @example Count mode: spawn 3 parallel branches
       * ```yaml
       * - kind: fan-out
       *   in: source_image
       *   mode: count
       *   count: 3
       *   out: [branch_0, branch_1, branch_2]
       * ```
       *
       * @example Array mode: iterate over parsed JSON array
       * ```yaml
       * - kind: fan-out
       *   in: concepts_data
       *   mode: array
       *   arrayProperty: concepts
       *   out: [concept_0, concept_1, concept_2]
       * ```
       */
      kind: "fan-out";
      /** Input variable name - the value to distribute or array to iterate */
      in: string;
      /** Fan-out mode: "count" spawns N copies, "array" iterates over array items */
      mode: "count" | "array";
      /** Number of branches to spawn (required for count mode) */
      count?: number;
      /** Property name to extract array from (for array mode with DataBlob input) */
      arrayProperty?: string;
      /** Output variable names - one per branch */
      out: string[];
    }
  | {
      /**
       * Collect step - gathers outputs from parallel branches into an array
       *
       * @example Gather 3 branch outputs
       * ```yaml
       * - kind: collect
       *   in: [logo_0, logo_1, logo_2]
       *   waitMode: all
       *   out: all_logos
       * ```
       */
      kind: "collect";
      /** Input variable names - one per branch to collect */
      in: string[];
      /** Wait mode: "all" waits for all inputs, "available" proceeds with ready inputs */
      waitMode: "all" | "available";
      /** Minimum required inputs (for "available" mode, fails if fewer succeed) */
      minRequired?: number;
      /** Output variable name - will be an array of collected values */
      out: string;
    }
  | {
      /**
       * Router step - selects one item from an array based on selection data
       *
       * @example Select by index from vision output
       * ```yaml
       * - kind: router
       *   in: all_logos
       *   selectionIn: evaluation_result
       *   selectionType: index
       *   selectionProperty: winner
       *   out: best_logo
       * ```
       */
      kind: "router";
      /** Input variable name - array of candidates to select from */
      in: string;
      /** Selection data variable name - DataBlob containing selection info */
      selectionIn: string;
      /** Selection type: "index" uses numeric index, "property" matches property value */
      selectionType: "index" | "property";
      /** Property name to read from selection data (e.g., "winner" for {winner: 2}) */
      selectionProperty: string;
      /** Output variable name - the selected item */
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
  /**
   * Pre-loaded variables available before pipeline execution starts.
   * Use this to inject external data (e.g., uploaded images) that steps can reference.
   * Keys are variable names that steps can use in their `in` field.
   */
  initialVariables?: Record<string, ImageBlob | DataBlob>;
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

// =============================================================================
// Usage Tracking (for cost attribution and observability)
// =============================================================================

/**
 * Usage event emitted by AI providers for cost tracking and observability.
 *
 * Use cases:
 * - Track API costs across providers for internal billing/chargebacks
 * - Log usage patterns for debugging and performance optimization
 * - Monitor provider API reliability via rawMetadata
 * - Implement custom rate limiting or quota management
 * - Multi-tenant platforms: attribute costs to users/projects
 *
 * All fields are optional except provider, model, and operation.
 * Providers include as much detail as possible to enable accurate cost calculation.
 */
export interface UsageEvent {
  /** AI provider identifier (e.g., 'openai', 'stability', 'google', 'replicate', 'xai') */
  provider: string;
  /** Model name used (e.g., 'dall-e-3', 'gpt-4o', 'sdxl', 'imagen-3') */
  model: string;
  /** Operation type (e.g., 'generate', 'edit', 'vision', 'text', 'transform') */
  operation: string;

  // Token-based usage (for LLM operations)
  /** Number of input tokens (for text/vision operations) */
  inputTokens?: number;
  /** Number of output tokens (for text operations) */
  outputTokens?: number;

  // Image-based usage (for image generation/transform)
  /** Image width in pixels */
  imageWidth?: number;
  /** Image height in pixels */
  imageHeight?: number;
  /** Number of images generated/processed */
  imageCount?: number;
  /** Quality level (e.g., 'hd', 'standard') */
  quality?: string;

  /** Unix timestamp in milliseconds when the event occurred */
  timestamp?: number;
  /** Raw metadata from the provider response (for debugging) */
  rawMetadata?: Record<string, unknown>;
}

/**
 * Hooks for capturing usage events from AI providers.
 *
 * Use cases:
 * - Track API costs across providers for internal billing/chargebacks
 * - Log usage patterns for debugging and performance optimization
 * - Monitor provider API reliability and response metadata
 * - Implement custom rate limiting or quota management
 *
 * @example Track costs to your own database
 * ```typescript
 * const hooks: UsageHooks = {
 *   onUsage: async (event) => {
 *     await db.insert('ai_usage').values({
 *       timestamp: new Date(),
 *       provider: event.provider,
 *       model: event.model,
 *       operation: event.operation,
 *       tokens: (event.inputTokens || 0) + (event.outputTokens || 0),
 *       estimatedCost: calculateCost(event), // Your pricing logic
 *     });
 *   },
 * };
 *
 * client.registerGenerator(openai({ apiKey, hooks }));
 * ```
 *
 * @example Simple logging
 * ```typescript
 * const hooks: UsageHooks = {
 *   onUsage: (event) => {
 *     console.log(`[AI Usage] ${event.provider}/${event.model}:`, event);
 *   },
 * };
 * ```
 */
export interface UsageHooks {
  /**
   * Called after an AI operation completes successfully.
   * Failed operations should not emit usage events (providers don't charge for errors).
   */
  onUsage?: (event: UsageEvent) => void | Promise<void>;
}
