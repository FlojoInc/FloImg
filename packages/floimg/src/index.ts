import { FloImg } from "./core/client.js";
import { ShapesProvider } from "./providers/svg/index.js";
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

// Export save providers
export { default as FsSaveProvider } from "./providers/save/FsSaveProvider.js";
export { default as S3SaveProvider } from "./providers/save/S3SaveProvider.js";
export type { S3SaveProviderConfig, PresignOptions } from "./providers/save/S3SaveProvider.js";

/**
 * Create a floimg client with automatic provider registration
 *
 * The core client includes built-in generators (shapes) and transform providers (sharp).
 * For AI capabilities, install and register the appropriate plugin:
 *
 * @example
 * ```typescript
 * import createClient from '@teamflojo/floimg';
 * import openai from '@teamflojo/floimg-openai';
 * import stability from '@teamflojo/floimg-stability';
 * import googleImagen from '@teamflojo/floimg-google';
 *
 * const floimg = createClient();
 *
 * // Register AI generators as needed
 * floimg.registerGenerator(openai({ apiKey: process.env.OPENAI_API_KEY }));
 * floimg.registerGenerator(stability({ apiKey: process.env.STABILITY_API_KEY }));
 * floimg.registerGenerator(googleImagen({ apiKey: process.env.GOOGLE_AI_API_KEY }));
 * ```
 */
export function createClient(config: FloimgConfig = {}): FloImg {
  const client = new FloImg(config);

  // Register built-in generators
  client.registerGenerator(new ShapesProvider());

  // Register built-in transform providers
  client.registerTransformProvider(new SharpTransformProvider());

  // Register save providers
  // Always register filesystem provider (default, zero-config)
  const fsConfig = config.save?.fs || {};
  client.registerSaveProvider(new FsSaveProvider(fsConfig));

  // Register S3 save provider if configured with required fields
  if (config.save?.s3?.bucket && config.save?.s3?.region) {
    client.registerSaveProvider(
      new S3SaveProvider({
        bucket: config.save.s3.bucket,
        region: config.save.s3.region,
        endpoint: config.save.s3.endpoint,
        credentials: config.save.s3.credentials,
      })
    );
  }

  return client;
}

// Export the client class
export { FloImg };

// Default export
export default createClient;
