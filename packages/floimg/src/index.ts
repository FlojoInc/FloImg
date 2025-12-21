import { Floimg } from "./core/client.js";
import { ShapesProvider } from "./providers/svg/index.js";
import {
  OpenAIGenerator,
  OpenAIVisionProvider,
  OpenAITextProvider,
} from "./providers/ai/index.js";
import { SharpTransformProvider } from "./providers/transform/index.js";
import FsSaveProvider from "./providers/save/FsSaveProvider.js";
import S3SaveProvider from "./providers/save/S3SaveProvider.js";
import type { FloimgConfig } from "./core/types.js";

// Export types
export type {
  FloimgConfig,
  ImageBlob,
  MimeType,
  ImageGenerator,
  TransformProvider,
  StoreProvider,
  GenerateInput,
  TransformInput,
  UploadInput,
  UploadResult,
  Pipeline,
  PipelineStep,
  PipelineResult,
  // Schema types for capability discovery
  ParameterSchema,
  GeneratorSchema,
  TransformOperationSchema,
  SaveProviderSchema,
  ClientCapabilities,
  // AI/LLM types for vision and text providers
  DataBlob,
  NodeOutput,
  VisionProvider,
  TextProvider,
  VisionProviderSchema,
  TextProviderSchema,
  VisionInput,
  TextGenerateInput,
  // Legacy aliases
  SvgProvider,
  AiProvider,
} from "./core/types.js";

// Export type guards
export { isImageBlob, isDataBlob } from "./core/types.js";

// Export errors
export {
  FloimgError,
  ProviderNotFoundError,
  ConfigurationError,
  TransformError,
  UploadError,
  GenerationError,
} from "./core/errors.js";

// Export generators and providers
export { ShapesProvider } from "./providers/svg/index.js";
export { SharpTransformProvider } from "./providers/transform/index.js";

// Export OpenAI providers (image generation, vision, text)
export {
  OpenAIGenerator,
  OpenAIVisionProvider,
  OpenAITextProvider,
} from "./providers/ai/index.js";
export type {
  OpenAIConfig,
  OpenAIGenerateParams,
  OpenAIVisionConfig,
  OpenAIVisionParams,
  OpenAITextConfig,
  OpenAITextParams,
} from "./providers/ai/index.js";

// Export save providers
export { default as FsSaveProvider } from "./providers/save/FsSaveProvider.js";
export { default as S3SaveProvider } from "./providers/save/S3SaveProvider.js";
export type { S3SaveProviderConfig } from "./providers/save/S3SaveProvider.js";

/**
 * Create a floimg client with automatic provider registration
 */
export function createClient(config: FloimgConfig = {}): Floimg {
  const client = new Floimg(config);

  // Register built-in generators
  client.registerGenerator(new ShapesProvider());

  // Register OpenAI providers if configured
  if (config.ai?.openai) {
    const openaiConfig = config.ai.openai as { apiKey?: string };
    // Image generation (DALL-E)
    client.registerGenerator(new OpenAIGenerator(openaiConfig));
    // Vision analysis (GPT-4V)
    client.registerVisionProvider(new OpenAIVisionProvider(openaiConfig));
    // Text generation (GPT-4)
    client.registerTextProvider(new OpenAITextProvider(openaiConfig));
  }

  // Register built-in transform providers
  client.registerTransformProvider(new SharpTransformProvider());

  // Register save providers
  // Always register filesystem provider (default, zero-config)
  const fsConfig = config.save?.fs || {};
  client.registerSaveProvider(new FsSaveProvider(fsConfig));

  // Register S3 save provider if configured with required fields
  if (config.save?.s3?.bucket && config.save?.s3?.region) {
    client.registerSaveProvider(new S3SaveProvider({
      bucket: config.save.s3.bucket,
      region: config.save.s3.region,
      endpoint: config.save.s3.endpoint,
      credentials: config.save.s3.credentials,
    }));
  }

  return client;
}

// Export the client class
export { Floimg };

// Default export
export default createClient;
