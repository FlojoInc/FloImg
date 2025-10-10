import { Imgflo } from "./core/client.js";
import { ShapesProvider } from "./providers/svg/index.js";
import { SharpTransformProvider } from "./providers/transform/index.js";
import { S3Provider, FsProvider } from "./providers/store/index.js";
import type { ImgfloConfig } from "./core/types.js";

// Export types
export type {
  ImgfloConfig,
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
  // Legacy aliases
  SvgProvider,
  AiProvider,
} from "./core/types.js";

// Export errors
export {
  ImgfloError,
  ProviderNotFoundError,
  ConfigurationError,
  TransformError,
  UploadError,
  GenerationError,
} from "./core/errors.js";

// Export generators and providers
export { ShapesProvider } from "./providers/svg/index.js";
export { SharpTransformProvider } from "./providers/transform/index.js";
export { S3Provider, FsProvider } from "./providers/store/index.js";
export type { S3ProviderConfig, FsProviderConfig } from "./providers/store/index.js";

/**
 * Create an imgflo client with automatic provider registration
 */
export function createClient(config: ImgfloConfig = {}): Imgflo {
  const client = new Imgflo(config);

  // Register built-in generators
  client.registerGenerator(new ShapesProvider());

  // Register built-in transform providers
  client.registerTransformProvider(new SharpTransformProvider());

  // Register storage providers based on config
  if (config.store?.s3) {
    const s3Config = config.store.s3 as any;
    client.registerStoreProvider(new S3Provider(s3Config));
  }

  if (config.store?.fs) {
    const fsConfig = config.store.fs as any;
    client.registerStoreProvider(new FsProvider(fsConfig));
  }

  return client;
}

// Export the client class
export { Imgflo };

// Default export
export default createClient;
