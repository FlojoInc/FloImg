import type {
  FloimgConfig,
  ImageGenerator,
  TransformProvider,
  SaveProvider,
  VisionProvider,
  TextProvider,
  GenerateInput,
  TransformInput,
  VisionInput,
  TextGenerateInput,
  SaveInput,
  ImageBlob,
  DataBlob,
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
import { ProviderNotFoundError, ConfigurationError, PipelineError } from "./errors.js";
import { validatePipelineFull } from "./validator.js";
import {
  buildDependencyGraph,
  computeExecutionWaves,
  executeWithConcurrency,
} from "./pipeline-runner.js";

/**
 * Main floimg client for image generation, transformation, and upload
 */
export class FloImg {
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
      throw new ConfigurationError("No generator specified and no default configured");
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
   *
   * Delegates operation dispatch to the transform provider. Each provider
   * handles its own operation routing via the transform() method.
   */
  async transform(input: TransformInput): Promise<ImageBlob> {
    const { blob, op, to, params = {}, provider } = input;

    this.logger.info(`Transforming image with operation: ${op}`);

    // Get transform provider (explicit, config default, or 'sharp')
    const providerName = provider || (this.config.transform?.default as string) || "sharp";
    const transformProvider = this.providers.transform[providerName];

    if (!transformProvider) {
      throw new ProviderNotFoundError("transform", providerName);
    }

    // Merge 'to' into params for convert operation
    const mergedParams = to ? { ...params, to } : params;

    // Delegate to provider's transform method
    return transformProvider.transform(blob, op, mergedParams);
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
      throw new ConfigurationError("No vision provider specified and no default configured");
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
      throw new ConfigurationError("No text provider specified and no default configured");
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
  async save(blob: ImageBlob, destination: string | SaveInput): Promise<SaveResult> {
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
   *
   * Pre-execution validation:
   * - Validates all step parameters against provider schemas
   * - Validates semantic correctness (variable references, prompt sources, etc.)
   * - Throws PipelineError if validation fails
   */
  async run(pipeline: Pipeline): Promise<PipelineResult[]> {
    this.logger.info(`Running pipeline: ${pipeline.name || "unnamed"}`);

    // Validate pipeline before execution
    const capabilities = this.getCapabilities();
    const validation = validatePipelineFull(pipeline, capabilities);

    if (!validation.valid) {
      const errorMessage = validation.formatErrors();
      this.logger.error(`Pipeline validation failed:\n${errorMessage}`);
      const error = new PipelineError(
        `Pipeline validation failed with ${validation.errors.length} error(s):\n${errorMessage}`
      );
      // Attach validation issues for programmatic access
      (error as PipelineError & { validationIssues: typeof validation.errors }).validationIssues =
        validation.errors;
      throw error;
    }

    // Log warnings but continue execution
    if (validation.warnings.length > 0) {
      this.logger.warn(`Pipeline validation warnings:\n${validation.formatWarnings()}`);
    }

    const results: PipelineResult[] = [];
    const variables = new Map<string, ImageBlob | DataBlob | SaveResult>();
    const concurrency = pipeline.concurrency ?? Infinity;

    // Pre-populate with initial variables (e.g., uploaded images from Studio)
    const preSatisfied = new Set<string>();
    if (pipeline.initialVariables) {
      for (const [key, value] of Object.entries(pipeline.initialVariables)) {
        variables.set(key, value);
        preSatisfied.add(key);
        this.logger.debug(`Loaded initial variable: ${key}`);
      }
    }

    // Build dependency graph and compute execution waves
    const nodes = buildDependencyGraph(pipeline.steps);
    const waves = computeExecutionWaves(nodes, preSatisfied);

    this.logger.debug(`Pipeline has ${waves.length} execution waves, concurrency: ${concurrency}`);

    // Execute waves sequentially, steps within each wave in parallel
    for (const wave of waves) {
      this.logger.debug(`Executing wave with ${wave.steps.length} steps`);

      // Execute all steps in this wave in parallel (bounded by concurrency)
      const waveResults = await executeWithConcurrency(
        wave.steps.map((node) => () => this.executeStep(node.step, variables)),
        concurrency
      );

      // Collect results and update variables map
      for (let i = 0; i < wave.steps.length; i++) {
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
        provider: step.provider,
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
        step.provider ? { path: step.destination, provider: step.provider } : step.destination
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
    } else if (step.kind === "fan-out") {
      // Fan-out step: distribute input to multiple branches
      const input = variables.get(step.in);
      if (!input) {
        throw new ConfigurationError(`Fan-out step references undefined variable: ${step.in}`);
      }

      if (step.mode === "count") {
        // Count mode: copy input to all branches
        const count = step.count ?? step.out.length;
        if (count !== step.out.length) {
          this.logger.warn(
            `Fan-out count (${count}) doesn't match output array length (${step.out.length}). ` +
              `Using minimum: ${Math.min(count, step.out.length)}`
          );
        }
        for (let i = 0; i < count && i < step.out.length; i++) {
          variables.set(step.out[i], input);
        }
        this.logger.debug(
          `Fan-out (count): distributed input to ${Math.min(count, step.out.length)} branches`
        );
      } else if (step.mode === "array") {
        // Array mode: distribute array items to branches
        let items: unknown[];

        if (isDataBlob(input) && step.arrayProperty) {
          // Extract array from parsed JSON (or parse content if needed)
          let parsedData = input.parsed;

          // If parsed is undefined but content looks like JSON, try to parse it
          // This handles cases where upstream providers return JSON content without pre-parsing
          if (!parsedData && input.content) {
            try {
              const trimmed = input.content.trim();
              if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
                parsedData = JSON.parse(input.content);
              }
            } catch {
              // Not valid JSON, will fall through to error with detailed context
            }
          }

          if (!parsedData) {
            // Provide detailed error context to help users diagnose the issue
            let errorContext = "";
            if (!input.content || input.content.trim() === "") {
              errorContext =
                " The upstream provider returned empty content. " +
                "This may indicate a safety filter, rate limit, or internal provider error.";
            } else {
              const trimmed = input.content.trim();
              const looksLikeJson = trimmed.startsWith("{") || trimmed.startsWith("[");
              const hasClosingBrace = trimmed.endsWith("}") || trimmed.endsWith("]");

              if (looksLikeJson && !hasClosingBrace) {
                errorContext =
                  " The content appears to be truncated JSON (starts with '{' or '[' but has no closing brace). " +
                  "This usually means the upstream AI provider hit its token limit. " +
                  "Try increasing maxTokens in the text node configuration.";
              } else if (!looksLikeJson) {
                const preview = input.content.slice(0, 100);
                errorContext = ` The content does not appear to be JSON. Preview: "${preview}${input.content.length > 100 ? "..." : ""}"`;
              } else {
                errorContext =
                  " The content looks like JSON but could not be parsed. " +
                  "Check for malformed syntax in the upstream provider's output.";
              }
            }
            throw new ConfigurationError(
              `Fan-out in array mode: could not parse DataBlob content as JSON.${errorContext}`
            );
          }

          const arrayValue = parsedData[step.arrayProperty];
          if (!Array.isArray(arrayValue)) {
            throw new ConfigurationError(
              `Fan-out array property "${step.arrayProperty}" is not an array`
            );
          }
          items = arrayValue;
        } else if (Array.isArray(input)) {
          items = input;
        } else {
          throw new ConfigurationError(
            `Fan-out in array mode requires array input or DataBlob with arrayProperty`
          );
        }

        // Warn if array length doesn't match output array length
        if (items.length !== step.out.length) {
          this.logger.warn(
            `Fan-out array length (${items.length}) doesn't match output array length (${step.out.length}). ` +
              `Distributing ${Math.min(items.length, step.out.length)} items.`
          );
        }

        // Distribute items to output variables
        for (let i = 0; i < items.length && i < step.out.length; i++) {
          // Wrap non-blob items in DataBlob for consistency
          const item = items[i];
          if (isImageBlob(item) || isDataBlob(item)) {
            variables.set(step.out[i], item);
          } else {
            // Wrap primitive/object in DataBlob
            variables.set(step.out[i], {
              type: "json",
              content: JSON.stringify(item),
              parsed:
                typeof item === "object" ? (item as Record<string, unknown>) : { value: item },
              source: "fan-out",
            } as DataBlob);
          }
        }
        this.logger.debug(
          `Fan-out (array): distributed ${Math.min(items.length, step.out.length)} items to branches`
        );
      }

      // Return a synthetic result (fan-out doesn't produce a single value)
      // We return the first output as representative
      const firstOut = step.out[0];
      const firstValue = variables.get(firstOut);
      return { step, out: firstOut, value: firstValue as ImageBlob | DataBlob | SaveResult };
    } else if (step.kind === "collect") {
      // Collect step: gather inputs into an array
      const collected: (ImageBlob | DataBlob | SaveResult | null)[] = [];

      for (const inputName of step.in) {
        const value = variables.get(inputName);
        if (value === undefined) {
          if (step.waitMode === "all") {
            throw new ConfigurationError(
              `Collect step with waitMode="all" requires all inputs. Missing: ${inputName}`
            );
          }
          collected.push(null); // Mark missing inputs as null
        } else {
          collected.push(value);
        }
      }

      // Check minRequired for "available" mode
      const validCount = collected.filter((v) => v !== null).length;
      if (step.waitMode === "available" && step.minRequired && validCount < step.minRequired) {
        throw new ConfigurationError(
          `Collect step requires at least ${step.minRequired} inputs, but only ${validCount} available`
        );
      }

      // Store collected array as a special variable
      // We wrap it in a synthetic structure that can be accessed by router
      const collectedBlob: DataBlob = {
        type: "json",
        content: JSON.stringify({ items: collected.filter((v) => v !== null) }),
        parsed: { items: collected.filter((v) => v !== null), _raw: collected },
        source: "collect",
        metadata: { inputCount: step.in.length, validCount },
      };

      // Also store the raw array for direct access by router
      (variables as Map<string, unknown>).set(
        `${step.out}_array`,
        collected.filter((v) => v !== null)
      );

      this.logger.debug(`Collect: gathered ${validCount}/${step.in.length} inputs`);
      return { step, out: step.out, value: collectedBlob };
    } else if (step.kind === "router") {
      // Router step: select one item from candidates based on selection data
      const candidatesVar = variables.get(step.in);
      const selectionVar = variables.get(step.selectionIn);

      if (!selectionVar) {
        throw new ConfigurationError(
          `Router step references undefined selection variable: ${step.selectionIn}`
        );
      }

      // Get selection value from DataBlob
      let selectionValue: unknown;
      if (isDataBlob(selectionVar) && selectionVar.parsed) {
        selectionValue = selectionVar.parsed[step.selectionProperty];
        if (selectionValue === undefined) {
          const availableKeys = Object.keys(selectionVar.parsed).join(", ");
          throw new ConfigurationError(
            `Router selection property "${step.selectionProperty}" not found in selection data. ` +
              `Available properties: ${availableKeys || "(none)"}`
          );
        }
      } else {
        throw new ConfigurationError(
          `Router selection must be a DataBlob with parsed JSON containing "${step.selectionProperty}"`
        );
      }

      // Get candidates array
      let candidates: unknown[];
      const rawArray = (variables as Map<string, unknown>).get(`${step.in}_array`);
      if (Array.isArray(rawArray)) {
        candidates = rawArray;
      } else if (isDataBlob(candidatesVar) && candidatesVar.parsed?.items) {
        candidates = candidatesVar.parsed.items as unknown[];
      } else {
        throw new ConfigurationError(`Router input "${step.in}" must be a collected array`);
      }

      // Select based on type
      let selected: unknown;
      if (step.selectionType === "index") {
        const index = Number(selectionValue);
        if (isNaN(index) || index < 0 || index >= candidates.length) {
          throw new ConfigurationError(
            `Router index ${selectionValue} out of bounds (0-${candidates.length - 1})`
          );
        }
        selected = candidates[index];
        this.logger.debug(`Router: selected index ${index} from ${candidates.length} candidates`);
      } else if (step.selectionType === "property") {
        // Find candidate matching the property value
        selected = candidates.find((c) => {
          if (isDataBlob(c) && c.parsed) {
            return c.parsed[step.selectionProperty] === selectionValue;
          }
          if (typeof c === "object" && c !== null) {
            return (c as Record<string, unknown>)[step.selectionProperty] === selectionValue;
          }
          return false;
        });
        if (selected === undefined) {
          throw new ConfigurationError(
            `Router could not find candidate with ${step.selectionProperty}=${selectionValue}`
          );
        }
        this.logger.debug(
          `Router: selected by property ${step.selectionProperty}=${selectionValue}`
        );
      }

      if (!selected) {
        throw new ConfigurationError(`Router failed to select a candidate`);
      }

      return { step, out: step.out, value: selected as ImageBlob | DataBlob | SaveResult };
    }

    throw new ConfigurationError(
      `Unknown step kind: ${(step as unknown as { kind: string }).kind}`
    );
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

    // Register under aliases for backwards compatibility
    if (provider.aliases) {
      for (const alias of provider.aliases) {
        this.providers.save[alias] = provider;
        this.logger.debug(`Registered save provider alias: ${alias} -> ${provider.name}`);
      }
    }
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
