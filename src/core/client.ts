import type {
  ImgfloConfig,
  ImageGenerator,
  TransformProvider,
  StoreProvider,
  GenerateInput,
  TransformInput,
  UploadInput,
  ImageBlob,
  UploadResult,
  Pipeline,
  PipelineResult,
} from "./types.js";
import { Logger } from "./logger.js";
import {
  ProviderNotFoundError,
  ConfigurationError,
} from "./errors.js";

/**
 * Main imgflo client for image generation, transformation, and upload
 */
export class Imgflo {
  private logger: Logger;
  private config: ImgfloConfig;

  /**
   * Registry of available providers
   */
  public providers: {
    generators: Record<string, ImageGenerator>;
    transform: Record<string, TransformProvider>;
    store: Record<string, StoreProvider>;
  };

  constructor(config: ImgfloConfig = {}) {
    this.config = {
      cacheDir: ".imgflo",
      verbose: false,
      ...config,
    };

    this.logger = new Logger(this.config.verbose);
    this.providers = {
      generators: {},
      transform: {},
      store: {},
    };

    this.logger.info("Imgflo client initialized");
  }

  /**
   * Generate an image using any registered generator
   */
  async generate(input: GenerateInput): Promise<ImageBlob> {
    const { generator, params = {} } = input;

    // Use default generator if configured
    const generatorName = generator || (this.config.generators?.default as string);

    if (!generatorName) {
      throw new ConfigurationError(
        "No generator specified and no default configured"
      );
    }

    this.logger.info(`Generating image with generator: ${generatorName}`, params);

    const imageGenerator = this.providers.generators[generatorName];
    if (!imageGenerator) {
      throw new ProviderNotFoundError("generator", generatorName);
    }

    return imageGenerator.generate(params);
  }

  /**
   * Transform an image (convert format, resize, etc.)
   */
  async transform(input: TransformInput): Promise<ImageBlob> {
    const { blob, op, to, params = {} } = input;

    this.logger.info(`Transforming image with operation: ${op}`);

    // Get default transform provider
    const providerName = (this.config.transform?.default as string) || "sharp";
    const transformProvider = this.providers.transform[providerName];

    if (!transformProvider) {
      throw new ProviderNotFoundError("transform", providerName);
    }

    switch (op) {
      case "convert":
        if (!to) {
          throw new ConfigurationError("Convert operation requires 'to' parameter");
        }
        return transformProvider.convert(blob, to);

      case "resize":
        if (!transformProvider.resize) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support resize operation`
          );
        }
        return transformProvider.resize(blob, params as Parameters<NonNullable<TransformProvider["resize"]>>[1]);

      case "composite":
        if (!transformProvider.composite) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support composite operation`
          );
        }
        return transformProvider.composite(
          blob,
          params.overlays as Parameters<NonNullable<TransformProvider["composite"]>>[1]
        );

      case "optimizeSvg":
        if (!transformProvider.optimizeSvg) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support optimizeSvg operation`
          );
        }
        return transformProvider.optimizeSvg(blob);

      default:
        throw new ConfigurationError(`Unknown transform operation: ${op}`);
    }
  }

  /**
   * Upload an image to cloud storage
   */
  async upload(input: UploadInput): Promise<UploadResult> {
    const { blob, key, provider, headers } = input;

    this.logger.info(`Uploading image to key: ${key}`);

    const providerName = provider || (this.config.store?.default as string);
    if (!providerName) {
      throw new ConfigurationError(
        "No storage provider specified and no default configured"
      );
    }

    const storeProvider = this.providers.store[providerName];
    if (!storeProvider) {
      throw new ProviderNotFoundError("store", providerName);
    }

    return storeProvider.put({ key, blob, headers });
  }

  /**
   * Run a declarative pipeline of operations
   */
  async run(pipeline: Pipeline): Promise<PipelineResult[]> {
    this.logger.info(`Running pipeline: ${pipeline.name || "unnamed"}`);

    const results: PipelineResult[] = [];
    const variables = new Map<string, ImageBlob | UploadResult>();

    for (const step of pipeline.steps) {
      this.logger.debug(`Executing step: ${step.kind}`);

      if (step.kind === "generate") {
        const blob = await this.generate({
          generator: step.generator,
          params: step.params,
        });
        variables.set(step.out, blob);
        results.push({ step, out: step.out, value: blob });
      } else if (step.kind === "transform") {
        const inputBlob = variables.get(step.in);
        if (!inputBlob || !("bytes" in inputBlob)) {
          throw new ConfigurationError(
            `Transform step references undefined or invalid variable: ${step.in}`
          );
        }

        const blob = await this.transform({
          blob: inputBlob as ImageBlob,
          op: step.op,
          params: step.params,
        });
        variables.set(step.out, blob);
        results.push({ step, out: step.out, value: blob });
      } else if (step.kind === "upload") {
        const inputBlob = variables.get(step.in);
        if (!inputBlob || !("bytes" in inputBlob)) {
          throw new ConfigurationError(
            `Upload step references undefined or invalid variable: ${step.in}`
          );
        }

        const result = await this.upload({
          blob: inputBlob as ImageBlob,
          key: step.key,
          provider: step.provider,
        });

        if (step.out) {
          variables.set(step.out, result);
        }
        results.push({ step, out: step.out || step.key, value: result });
      }
    }

    this.logger.info(`Pipeline completed with ${results.length} steps`);
    return results;
  }

  /**
   * Register a custom generator
   */
  registerGenerator(generator: ImageGenerator): void {
    this.providers.generators[generator.name] = generator;
    this.logger.debug(`Registered generator: ${generator.name}`);
  }

  /**
   * Register a custom transform provider
   */
  registerTransformProvider(provider: TransformProvider): void {
    this.providers.transform[provider.name] = provider;
    this.logger.debug(`Registered transform provider: ${provider.name}`);
  }

  /**
   * Register a custom storage provider
   */
  registerStoreProvider(provider: StoreProvider): void {
    this.providers.store[provider.name] = provider;
    this.logger.debug(`Registered store provider: ${provider.name}`);
  }
}
