import type {
  FloimgConfig,
  ImageGenerator,
  TransformProvider,
  StoreProvider,
  SaveProvider,
  VisionProvider,
  TextProvider,
  GenerateInput,
  TransformInput,
  VisionInput,
  TextGenerateInput,
  UploadInput,
  SaveInput,
  ImageBlob,
  DataBlob,
  UploadResult,
  SaveResult,
  Pipeline,
  PipelineStep,
  PipelineResult,
  ClientCapabilities,
  GeneratorSchema,
  TransformOperationSchema,
  SaveProviderSchema,
  VisionProviderSchema,
  TextProviderSchema,
} from "./types.js";
import { isImageBlob, isDataBlob } from "./types.js";
import { Logger } from "./logger.js";
import {
  ProviderNotFoundError,
  ConfigurationError,
} from "./errors.js";
import {
  buildDependencyGraph,
  computeExecutionWaves,
  executeWithConcurrency,
  type StepNode,
} from "./pipeline-runner.js";

/**
 * Main floimg client for image generation, transformation, and upload
 */
export class Floimg {
  private logger: Logger;
  private config: FloimgConfig;

  /**
   * Registry of available providers
   */
  public providers: {
    generators: Record<string, ImageGenerator>;
    transform: Record<string, TransformProvider>;
    save: Record<string, SaveProvider>;
    vision: Record<string, VisionProvider>;
    text: Record<string, TextProvider>;
  };

  constructor(config: FloimgConfig = {}) {
    this.config = {
      cacheDir: ".floimg",
      verbose: false,
      ...config,
    };

    this.logger = new Logger(this.config.verbose);
    this.providers = {
      generators: {},
      transform: {},
      save: {},
      vision: {},
      text: {},
    };

    this.logger.info("Floimg client initialized");
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

      // Filter operations
      case "blur":
        if (!transformProvider.blur) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support blur operation`
          );
        }
        return transformProvider.blur(blob, params.sigma as number | undefined);

      case "sharpen":
        if (!transformProvider.sharpen) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support sharpen operation`
          );
        }
        return transformProvider.sharpen(blob, params);

      case "grayscale":
        if (!transformProvider.grayscale) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support grayscale operation`
          );
        }
        return transformProvider.grayscale(blob);

      case "negate":
        if (!transformProvider.negate) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support negate operation`
          );
        }
        return transformProvider.negate(blob);

      case "normalize":
        if (!transformProvider.normalize) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support normalize operation`
          );
        }
        return transformProvider.normalize(blob);

      case "threshold":
        if (!transformProvider.threshold) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support threshold operation`
          );
        }
        return transformProvider.threshold(blob, params.value as number | undefined);

      case "modulate":
        if (!transformProvider.modulate) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support modulate operation`
          );
        }
        return transformProvider.modulate(blob, params as Parameters<NonNullable<TransformProvider["modulate"]>>[1]);

      case "tint":
        if (!transformProvider.tint) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support tint operation`
          );
        }
        return transformProvider.tint(blob, params.color as Parameters<NonNullable<TransformProvider["tint"]>>[1]);

      // Border & frame operations
      case "extend":
        if (!transformProvider.extend) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support extend operation`
          );
        }
        return transformProvider.extend(blob, params as Parameters<NonNullable<TransformProvider["extend"]>>[1]);

      case "extract":
        if (!transformProvider.extract) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support extract operation`
          );
        }
        return transformProvider.extract(blob, params as Parameters<NonNullable<TransformProvider["extract"]>>[1]);

      case "roundCorners":
        if (!transformProvider.roundCorners) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support roundCorners operation`
          );
        }
        return transformProvider.roundCorners(blob, params.radius as number);

      // Text operations
      case "addText":
        if (!transformProvider.addText) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support addText operation`
          );
        }
        return transformProvider.addText(blob, params);

      case "addCaption":
        if (!transformProvider.addCaption) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support addCaption operation`
          );
        }
        return transformProvider.addCaption(blob, params);

      // Preset filters
      case "preset":
        if (!transformProvider.preset) {
          throw new ConfigurationError(
            `Transform provider "${providerName}" does not support preset operation`
          );
        }
        return transformProvider.preset(blob, params.name as string);

      default:
        throw new ConfigurationError(`Unknown transform operation: ${op}`);
    }
  }

  /**
   * Analyze an image using AI vision (Claude, GPT-4V, Ollama LLaVA, etc.)
   * Returns text or structured JSON describing/analyzing the image
   */
  async analyzeImage(input: VisionInput): Promise<DataBlob> {
    const { provider, blob, params = {} } = input;

    // Use default vision provider if configured
    const providerName = provider || (this.config.ai?.default as string);

    if (!providerName) {
      throw new ConfigurationError(
        "No vision provider specified and no default configured"
      );
    }

    this.logger.info(`Analyzing image with vision provider: ${providerName}`, params);

    const visionProvider = this.providers.vision[providerName];
    if (!visionProvider) {
      throw new ProviderNotFoundError("vision", providerName);
    }

    return visionProvider.analyze(blob, params);
  }

  /**
   * Generate text using AI (Claude, GPT-4, Ollama Llama, etc.)
   * Returns text that can be used as prompts, descriptions, or other content
   */
  async generateText(input: TextGenerateInput): Promise<DataBlob> {
    const { provider, params = {} } = input;

    // Use default text provider if configured
    const providerName = provider || (this.config.ai?.default as string);

    if (!providerName) {
      throw new ConfigurationError(
        "No text provider specified and no default configured"
      );
    }

    this.logger.info(`Generating text with provider: ${providerName}`, params);

    const textProvider = this.providers.text[providerName];
    if (!textProvider) {
      throw new ProviderNotFoundError("text", providerName);
    }

    return textProvider.generate(params);
  }

  /**
   * Save an image (filesystem or cloud) with smart destination routing
   */
  async save(
    blob: ImageBlob,
    destination: string | SaveInput
  ): Promise<SaveResult> {
    // Parse destination
    const parsed = this.parseDestination(destination);

    this.logger.info(`Saving image with provider: ${parsed.provider} to ${parsed.path}`);

    // Get save provider
    const saveProvider = this.providers.save[parsed.provider];
    if (!saveProvider) {
      throw new ProviderNotFoundError("save", parsed.provider);
    }

    return saveProvider.save({
      blob,
      ...parsed,
    });
  }

  /**
   * Parse destination string or object into provider and path
   */
  private parseDestination(destination: string | SaveInput): {
    provider: string;
    path: string;
    [key: string]: unknown;
  } {
    // If it's an object, use it directly
    if (typeof destination === "object") {
      return {
        provider: destination.provider || this.config.save?.default || "fs",
        ...destination,
      };
    }

    // Protocol-based routing (s3://, r2://, file://)
    if (destination.includes("://")) {
      const [protocol, rest] = destination.split("://");
      return { provider: protocol, path: rest };
    }

    // Local path detection (starts with ./, /, ../)
    if (
      destination.startsWith("./") ||
      destination.startsWith("/") ||
      destination.startsWith("../")
    ) {
      return { provider: "fs", path: destination };
    }

    // Use default provider from config
    const defaultProvider = this.config.save?.default || "fs";
    return { provider: defaultProvider, path: destination };
  }


  /**
   * Run a declarative pipeline of operations
   *
   * Steps are analyzed for dependencies and executed in parallel where possible.
   * The `concurrency` option controls maximum parallel steps (default: Infinity).
   * Supports multi-modal workflows with images AND text/JSON data flowing between steps.
   */
  async run(pipeline: Pipeline): Promise<PipelineResult[]> {
    this.logger.info(`Running pipeline: ${pipeline.name || "unnamed"}`);

    const results: PipelineResult[] = [];
    const variables = new Map<string, ImageBlob | DataBlob | SaveResult>();
    const concurrency = pipeline.concurrency ?? Infinity;

    // Build dependency graph and compute execution waves
    const nodes = buildDependencyGraph(pipeline.steps);
    const waves = computeExecutionWaves(nodes);

    this.logger.debug(
      `Pipeline has ${waves.length} execution waves, concurrency: ${concurrency}`
    );

    // Execute waves sequentially, steps within each wave in parallel
    for (const wave of waves) {
      this.logger.debug(`Executing wave with ${wave.steps.length} steps`);

      // Execute all steps in this wave in parallel (bounded by concurrency)
      const waveResults = await executeWithConcurrency(
        wave.steps.map(
          (node) => () => this.executeStep(node.step, variables)
        ),
        concurrency
      );

      // Collect results and update variables map
      for (let i = 0; i < wave.steps.length; i++) {
        const node = wave.steps[i];
        const result = waveResults[i];
        results.push(result);

        // Store output in variables map for dependent steps
        if (result.value && result.out) {
          variables.set(result.out, result.value);
        }
      }
    }

    this.logger.info(`Pipeline completed with ${results.length} steps`);
    return results;
  }

  /**
   * Execute a single pipeline step
   * @internal
   */
  private async executeStep(
    step: PipelineStep,
    variables: Map<string, ImageBlob | DataBlob | SaveResult>
  ): Promise<PipelineResult> {
    this.logger.debug(`Executing step: ${step.kind}`);

    if (step.kind === "generate") {
      const blob = await this.generate({
        generator: step.generator,
        params: step.params,
      });
      return { step, out: step.out, value: blob };
    } else if (step.kind === "transform") {
      const inputBlob = variables.get(step.in);
      if (!inputBlob || !isImageBlob(inputBlob)) {
        throw new ConfigurationError(
          `Transform step references undefined or invalid variable: ${step.in}`
        );
      }

      const blob = await this.transform({
        blob: inputBlob,
        op: step.op,
        params: step.params,
      });
      return { step, out: step.out, value: blob };
    } else if (step.kind === "save") {
      const inputBlob = variables.get(step.in);
      if (!inputBlob || !isImageBlob(inputBlob)) {
        throw new ConfigurationError(
          `Save step references undefined or invalid variable: ${step.in}`
        );
      }

      const result = await this.save(
        inputBlob,
        step.provider
          ? { path: step.destination, provider: step.provider }
          : step.destination
      );

      return { step, out: step.out || step.destination, value: result };
    } else if (step.kind === "vision") {
      // Vision step: analyze an image with AI
      const inputBlob = variables.get(step.in);
      if (!inputBlob || !isImageBlob(inputBlob)) {
        throw new ConfigurationError(
          `Vision step references undefined or invalid variable: ${step.in}`
        );
      }

      const result = await this.analyzeImage({
        provider: step.provider,
        blob: inputBlob,
        params: step.params,
      });
      return { step, out: step.out, value: result };
    } else if (step.kind === "text") {
      // Text step: generate text (optionally using context from previous step)
      let context: string | undefined;
      if (step.in) {
        const inputData = variables.get(step.in);
        if (isDataBlob(inputData)) {
          context = inputData.content;
        }
        // Note: text steps can optionally take DataBlob input for chaining
        // If input is not a DataBlob, we simply skip context injection
      }

      const result = await this.generateText({
        provider: step.provider,
        params: { ...step.params, context },
      });
      return { step, out: step.out, value: result };
    }

    throw new ConfigurationError(`Unknown step kind: ${(step as unknown as { kind: string }).kind}`);
  }

  /**
   * Get capabilities of all registered providers
   * This allows consumers to discover available generators, transforms, save, vision, and text providers
   */
  getCapabilities(): ClientCapabilities {
    const generators: GeneratorSchema[] = [];
    const transforms: TransformOperationSchema[] = [];
    const saveProviders: SaveProviderSchema[] = [];
    const visionProviders: VisionProviderSchema[] = [];
    const textProviders: TextProviderSchema[] = [];

    // Collect generator schemas
    for (const generator of Object.values(this.providers.generators)) {
      generators.push(generator.schema);
    }

    // Collect transform operation schemas
    for (const provider of Object.values(this.providers.transform)) {
      transforms.push(...Object.values(provider.operationSchemas));
    }

    // Collect save provider info
    for (const provider of Object.values(this.providers.save)) {
      // SaveProvider doesn't have schema yet, create minimal info
      saveProviders.push({
        name: provider.name,
        description: `Save provider: ${provider.name}`,
      });
    }

    // Collect vision provider schemas
    for (const provider of Object.values(this.providers.vision)) {
      visionProviders.push(provider.schema);
    }

    // Collect text provider schemas
    for (const provider of Object.values(this.providers.text)) {
      textProviders.push(provider.schema);
    }

    return { generators, transforms, saveProviders, visionProviders, textProviders };
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
   * Register a custom save provider
   */
  registerSaveProvider(provider: SaveProvider): void {
    this.providers.save[provider.name] = provider;
    this.logger.debug(`Registered save provider: ${provider.name}`);
  }

  /**
   * Register a custom vision provider (AI image analysis)
   */
  registerVisionProvider(provider: VisionProvider): void {
    this.providers.vision[provider.name] = provider;
    this.logger.debug(`Registered vision provider: ${provider.name}`);
  }

  /**
   * Register a custom text provider (AI text generation)
   */
  registerTextProvider(provider: TextProvider): void {
    this.providers.text[provider.name] = provider;
    this.logger.debug(`Registered text provider: ${provider.name}`);
  }
}
