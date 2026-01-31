/**
 * FloImg Error System
 *
 * Structured error types for better debugging and error handling.
 * All errors include:
 * - message: Human-readable description
 * - code: Machine-readable error code (e.g., "TRANSFORM_ERROR")
 * - category: Error classification for handling strategies
 * - retryable: Whether the operation can be retried
 *
 * Optional context:
 * - provider: Which provider failed (e.g., "openai", "sharp")
 * - operation: What operation was being performed
 * - cause: The underlying error (for error chaining)
 */

/**
 * Error categories for classification and handling strategies.
 *
 * - user_input: Invalid user-provided values (bad params, missing fields)
 * - provider_error: External API failures (rate limit, timeout, service down)
 * - provider_config: Missing/invalid credentials or configuration
 * - validation: Pre-execution validation failures (circular deps, missing inputs)
 * - execution: Runtime failures during image processing
 * - network: Connectivity issues reaching providers
 * - internal: Unexpected internal errors (bugs)
 */
export type ErrorCategory =
  | "user_input"
  | "provider_error"
  | "provider_config"
  | "validation"
  | "execution"
  | "network"
  | "internal";

/**
 * Options for creating a FloImg error
 */
export interface FloimgErrorOptions {
  /** Machine-readable error code */
  code?: string;
  /** Error category for handling strategies */
  category?: ErrorCategory;
  /** Whether the operation can be retried */
  retryable?: boolean;
  /** Which provider failed (e.g., "openai", "sharp") */
  provider?: string;
  /** What operation was being performed */
  operation?: string;
  /** The underlying error that caused this one */
  cause?: Error;
}

/**
 * Base error class for all floimg errors.
 *
 * Provides structured error information for better debugging:
 * - Categorization for handling strategies
 * - Retryable flag for recovery logic
 * - Provider/operation context for debugging
 * - Error chaining via cause
 *
 * @example
 * ```typescript
 * throw new FloimgError("Failed to process image", {
 *   code: "PROCESSING_FAILED",
 *   category: "execution",
 *   retryable: false,
 *   provider: "sharp",
 *   operation: "resize",
 * });
 * ```
 */
export class FloimgError extends Error {
  /** Machine-readable error code */
  readonly code: string;
  /** Error category for handling strategies */
  readonly category: ErrorCategory;
  /** Whether the operation can be retried */
  readonly retryable: boolean;
  /** Which provider failed */
  readonly provider?: string;
  /** What operation was being performed */
  readonly operation?: string;
  /** The underlying error */
  readonly cause?: Error;

  constructor(message: string, options: FloimgErrorOptions = {}) {
    super(message);
    this.name = "FloimgError";

    this.code = options.code || "FLOIMG_ERROR";
    this.category = options.category || "internal";
    this.retryable = options.retryable ?? false;
    this.provider = options.provider;
    this.operation = options.operation;
    this.cause = options.cause;

    // Maintain proper stack trace in V8 environments
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert to a plain object for serialization
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      category: this.category,
      retryable: this.retryable,
      provider: this.provider,
      operation: this.operation,
      cause: this.cause?.message,
    };
  }
}

/**
 * Error thrown when a provider is not found.
 *
 * Category: provider_config (missing provider registration)
 * Retryable: false
 *
 * @example
 * ```typescript
 * throw new ProviderNotFoundError("save", "s3");
 * // Message includes helpful setup instructions
 * ```
 */
export class ProviderNotFoundError extends FloimgError {
  constructor(providerType: string, providerName: string) {
    let message = `Provider "${providerName}" not found for type "${providerType}"`;

    // Add helpful hints for common cases
    if (
      providerType === "save" &&
      (providerName === "s3" || providerName === "r2" || providerName === "tigris")
    ) {
      message +=
        `\n\nTo enable S3-compatible storage, create a floimg.config.ts file:\n\n` +
        `export default {\n` +
        `  save: {\n` +
        `    s3: {\n` +
        `      bucket: 'my-bucket',\n` +
        `      region: 'us-east-1',\n` +
        `      credentials: {\n` +
        `        accessKeyId: process.env.AWS_ACCESS_KEY_ID,\n` +
        `        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,\n` +
        `      },\n` +
        `    },\n` +
        `  },\n` +
        `};\n\n` +
        `See floimg.config.example.ts for more options.`;
    }

    super(message, {
      code: "PROVIDER_NOT_FOUND",
      category: "provider_config",
      retryable: false,
      provider: providerName,
      operation: providerType,
    });
    this.name = "ProviderNotFoundError";
  }
}

/**
 * Error thrown when provider configuration is invalid.
 *
 * Category: provider_config
 * Retryable: false (requires configuration change)
 *
 * @example
 * ```typescript
 * throw new ConfigurationError("Missing API key for OpenAI", {
 *   provider: "openai",
 * });
 * ```
 */
export class ConfigurationError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code" | "category"> = {}) {
    super(message, {
      ...options,
      code: "CONFIGURATION_ERROR",
      category: "provider_config",
      retryable: false,
    });
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown when an image transformation fails.
 *
 * Category: execution (runtime failure)
 * Retryable: depends on the cause (default: false)
 *
 * @example
 * ```typescript
 * throw new TransformError("Failed to resize image: invalid dimensions", {
 *   provider: "sharp",
 *   operation: "resize",
 *   cause: originalError,
 * });
 * ```
 */
export class TransformError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code" | "category"> = {}) {
    super(message, {
      ...options,
      code: "TRANSFORM_ERROR",
      category: "execution",
      retryable: options.retryable ?? false,
    });
    this.name = "TransformError";
  }
}

/**
 * Error thrown when an upload/save operation fails.
 *
 * Category: execution (or network if connectivity issue)
 * Retryable: often true for transient failures
 *
 * @example
 * ```typescript
 * throw new UploadError("Failed to upload to S3: timeout", {
 *   provider: "s3",
 *   operation: "putObject",
 *   retryable: true,
 * });
 * ```
 */
export class UploadError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code"> = {}) {
    super(message, {
      ...options,
      code: "UPLOAD_ERROR",
      category: options.category ?? "execution",
      retryable: options.retryable ?? true, // Uploads are often retryable
    });
    this.name = "UploadError";
  }
}

/**
 * Error thrown when image generation fails.
 *
 * Category: provider_error (for AI providers) or execution
 * Retryable: depends on the cause
 *
 * @example
 * ```typescript
 * throw new GenerationError("OpenAI rate limit exceeded", {
 *   provider: "openai",
 *   operation: "dall-e-3",
 *   retryable: true,
 *   cause: apiError,
 * });
 * ```
 */
export class GenerationError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code"> = {}) {
    super(message, {
      ...options,
      code: "GENERATION_ERROR",
      category: options.category ?? "execution",
      retryable: options.retryable ?? false,
    });
    this.name = "GenerationError";
  }
}

/**
 * Error thrown when user input validation fails.
 *
 * Category: user_input
 * Retryable: false (requires user to fix input)
 *
 * @example
 * ```typescript
 * throw new ValidationError("Width must be a positive number", {
 *   operation: "resize",
 * });
 * ```
 */
export class ValidationError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code" | "category"> = {}) {
    super(message, {
      ...options,
      code: "VALIDATION_ERROR",
      category: "user_input",
      retryable: false,
    });
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when a network request fails.
 *
 * Category: network
 * Retryable: usually true
 *
 * @example
 * ```typescript
 * throw new NetworkError("Failed to connect to OpenAI API", {
 *   provider: "openai",
 *   retryable: true,
 *   cause: fetchError,
 * });
 * ```
 */
export class NetworkError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code" | "category"> = {}) {
    super(message, {
      ...options,
      code: "NETWORK_ERROR",
      category: "network",
      retryable: options.retryable ?? true,
    });
    this.name = "NetworkError";
  }
}

/**
 * Error thrown when an external provider returns an error.
 *
 * Category: provider_error
 * Retryable: depends on error type (rate limits: yes, invalid request: no)
 *
 * @example
 * ```typescript
 * throw new ProviderError("OpenAI API error: content policy violation", {
 *   provider: "openai",
 *   operation: "dall-e-3",
 *   retryable: false,
 * });
 * ```
 */
export class ProviderError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code" | "category"> = {}) {
    super(message, {
      ...options,
      code: "PROVIDER_ERROR",
      category: "provider_error",
      retryable: options.retryable ?? false,
    });
    this.name = "ProviderError";
  }
}

/**
 * Error thrown when pipeline validation fails.
 *
 * Category: validation
 * Retryable: false (requires workflow fix)
 *
 * @example
 * ```typescript
 * throw new PipelineError("Circular dependency detected between nodes A and B");
 * ```
 */
export class PipelineError extends FloimgError {
  constructor(message: string, options: Omit<FloimgErrorOptions, "code" | "category"> = {}) {
    super(message, {
      ...options,
      code: "PIPELINE_ERROR",
      category: "validation",
      retryable: false,
    });
    this.name = "PipelineError";
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Check if an error is retryable
 */
export function isRetryable(error: unknown): boolean {
  if (error instanceof FloimgError) {
    return error.retryable;
  }
  return false;
}

/**
 * Get the error category, defaulting to "internal" for unknown errors
 */
export function getErrorCategory(error: unknown): ErrorCategory {
  if (error instanceof FloimgError) {
    return error.category;
  }
  return "internal";
}

/**
 * Wrap an unknown error in a FloimgError if it isn't already one.
 * Useful for catch blocks that need to normalize errors.
 *
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   throw wrapError(error, {
 *     code: "OPERATION_FAILED",
 *     category: "execution",
 *     provider: "myProvider",
 *   });
 * }
 * ```
 */
export function wrapError(error: unknown, options: FloimgErrorOptions = {}): FloimgError {
  // Already a FloimgError - return as-is (don't double-wrap)
  if (error instanceof FloimgError) {
    return error;
  }

  // Extract message from various error types
  const message = error instanceof Error ? error.message : String(error);
  const cause = error instanceof Error ? error : undefined;

  return new FloimgError(message, {
    ...options,
    cause,
  });
}
