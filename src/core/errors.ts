/**
 * Base error class for imgflo errors
 */
export class ImgfloError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = "ImgfloError";
  }
}

/**
 * Error thrown when a provider is not found
 */
export class ProviderNotFoundError extends ImgfloError {
  constructor(providerType: string, providerName: string) {
    super(
      `Provider "${providerName}" not found for type "${providerType}"`,
      "PROVIDER_NOT_FOUND"
    );
    this.name = "ProviderNotFoundError";
  }
}

/**
 * Error thrown when provider configuration is invalid
 */
export class ConfigurationError extends ImgfloError {
  constructor(message: string) {
    super(message, "CONFIGURATION_ERROR");
    this.name = "ConfigurationError";
  }
}

/**
 * Error thrown when an image transformation fails
 */
export class TransformError extends ImgfloError {
  constructor(message: string) {
    super(message, "TRANSFORM_ERROR");
    this.name = "TransformError";
  }
}

/**
 * Error thrown when an upload operation fails
 */
export class UploadError extends ImgfloError {
  constructor(message: string) {
    super(message, "UPLOAD_ERROR");
    this.name = "UploadError";
  }
}

/**
 * Error thrown when image generation fails
 */
export class GenerationError extends ImgfloError {
  constructor(message: string) {
    super(message, "GENERATION_ERROR");
    this.name = "GenerationError";
  }
}
