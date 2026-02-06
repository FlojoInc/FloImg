/**
 * FloImg Parameter Validator
 *
 * Validates workflow/pipeline parameters against generator and transform schemas.
 * Provides two levels of validation:
 *
 * 1. **Parameter validation** (validatePipeline/validateStep):
 *    - Missing required parameters
 *    - Unknown parameters (warns, doesn't error - for pass-through flexibility)
 *    - Type mismatches
 *
 * 2. **Semantic validation** (validatePipelineSemantics):
 *    - Missing prompt sources (AI generators need static prompt OR incoming text)
 *    - Missing image inputs (transforms must have an image source)
 *    - Missing array property (fan-out in array mode)
 *    - Undefined variable references (steps must reference defined outputs)
 *
 * Can be used at:
 * - Build time: Validate templates before packaging
 * - Runtime: Validate before execution
 *
 * @example
 * ```typescript
 * import { validatePipeline, validatePipelineSemantics, ValidationError } from '@teamflojo/floimg';
 *
 * // Parameter validation
 * const paramResult = validatePipeline(pipeline, client.getCapabilities());
 * if (!paramResult.valid) {
 *   throw new ValidationError(paramResult.formatErrors());
 * }
 *
 * // Semantic validation (for workflows with variable references)
 * const semanticResult = validatePipelineSemantics(pipeline, client.getCapabilities());
 * if (!semanticResult.valid) {
 *   throw new ValidationError(semanticResult.formatErrors());
 * }
 * ```
 */

import type {
  Pipeline,
  PipelineStep,
  ClientCapabilities,
  GeneratorSchema,
  TransformOperationSchema,
  VisionProviderSchema,
  TextProviderSchema,
  ParameterSchema,
} from "./types.js";

/**
 * A single validation issue (error or warning)
 */
export interface ValidationIssue {
  /** Severity: error = blocks execution, warning = informational */
  severity: "error" | "warning";
  /** Issue code for programmatic handling */
  code: string;
  /** Human-readable message */
  message: string;
  /** Which step in the pipeline has the issue */
  stepIndex?: number;
  /** The step kind (generate, transform, etc.) */
  stepKind?: string;
  /** The provider/generator name */
  providerName?: string;
  /** The parameter that has an issue */
  parameterName?: string;
  /** Actionable guidance for fixing this issue */
  suggestedFix?: string;
}

/**
 * Result of validating a pipeline or step
 */
export interface ValidationResult {
  /** Whether validation passed (no errors, warnings OK) */
  valid: boolean;
  /** Error-level issues that block execution */
  errors: ValidationIssue[];
  /** Warning-level issues that don't block execution */
  warnings: ValidationIssue[];
  /** Format errors as a human-readable string */
  formatErrors(): string;
  /** Format warnings as a human-readable string */
  formatWarnings(): string;
  /** Format all issues as a human-readable string */
  formatAll(): string;
}

/**
 * Options for validation behavior
 */
export interface ValidationOptions {
  /** Treat unknown parameters as errors instead of warnings (default: false) */
  strictUnknownParams?: boolean;
  /** Skip validation for steps with missing schemas (default: true) */
  skipMissingSchemas?: boolean;
}

/**
 * Create a validation result object
 */
function createResult(errors: ValidationIssue[], warnings: ValidationIssue[]): ValidationResult {
  const formatIssues = (issues: ValidationIssue[], label: string): string => {
    if (issues.length === 0) return "";
    const lines = issues.map((issue) => {
      const location =
        issue.stepIndex !== undefined
          ? `Step ${issue.stepIndex} (${issue.stepKind}${issue.providerName ? `: ${issue.providerName}` : ""})`
          : issue.providerName || "Unknown";
      const param = issue.parameterName ? ` - param '${issue.parameterName}'` : "";
      return `  [${issue.code}] ${location}${param}: ${issue.message}`;
    });
    return `${label}:\n${lines.join("\n")}`;
  };

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    formatErrors: () => formatIssues(errors, "Validation Errors"),
    formatWarnings: () => formatIssues(warnings, "Validation Warnings"),
    formatAll: () => {
      const parts: string[] = [];
      if (errors.length > 0) parts.push(formatIssues(errors, "Errors"));
      if (warnings.length > 0) parts.push(formatIssues(warnings, "Warnings"));
      return parts.join("\n\n") || "No validation issues";
    },
  };
}

/**
 * Validate parameters against a schema
 */
function validateParams(
  params: Record<string, unknown> | undefined,
  schema: {
    parameters: Record<string, ParameterSchema>;
    requiredParameters?: string[];
  },
  context: {
    stepIndex?: number;
    stepKind?: string;
    providerName: string;
  },
  options: ValidationOptions
): { errors: ValidationIssue[]; warnings: ValidationIssue[] } {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const actualParams = params || {};

  // Check required parameters
  const required = schema.requiredParameters || [];
  for (const paramName of required) {
    // Skip internal/injected parameters
    if (paramName.startsWith("_")) continue;

    if (!(paramName in actualParams) || actualParams[paramName] === undefined) {
      const paramInfo = schema.parameters[paramName];
      const paramType = paramInfo?.type || "value";
      errors.push({
        severity: "error",
        code: "MISSING_REQUIRED_PARAM",
        message: `Missing required parameter '${paramName}'`,
        ...context,
        parameterName: paramName,
        suggestedFix: `Add the required '${paramName}' parameter with a ${paramType} value`,
      });
    }
  }

  // Check for unknown parameters
  const knownParams = new Set(Object.keys(schema.parameters));
  for (const paramName of Object.keys(actualParams)) {
    // Skip internal parameters (used for variable injection, etc.)
    if (paramName.startsWith("_")) continue;

    if (!knownParams.has(paramName)) {
      const issue: ValidationIssue = {
        severity: options.strictUnknownParams ? "error" : "warning",
        code: "UNKNOWN_PARAM",
        message: `Unknown parameter '${paramName}' for ${context.providerName}`,
        ...context,
        parameterName: paramName,
        suggestedFix: `Remove '${paramName}' or check the parameter name spelling. Valid parameters: ${[...knownParams].join(", ")}`,
      };

      if (options.strictUnknownParams) {
        errors.push(issue);
      } else {
        warnings.push(issue);
      }
    }
  }

  // Type validation for known parameters
  for (const [paramName, paramValue] of Object.entries(actualParams)) {
    if (paramName.startsWith("_")) continue;

    const paramSchema = schema.parameters[paramName];
    if (!paramSchema) continue;

    const typeError = validateType(paramValue, paramSchema, paramName);
    if (typeError) {
      errors.push({
        severity: "error",
        code: "INVALID_PARAM_TYPE",
        message: typeError,
        ...context,
        parameterName: paramName,
        suggestedFix: `Change '${paramName}' to a ${paramSchema.type} value${paramSchema.enum ? ` (one of: ${paramSchema.enum.join(", ")})` : ""}`,
      });
    }
  }

  return { errors, warnings };
}

/**
 * Validate a value against its expected type
 */
function validateType(value: unknown, schema: ParameterSchema, paramName: string): string | null {
  // Null/undefined is handled by required check
  if (value === undefined || value === null) return null;

  const actualType = Array.isArray(value) ? "array" : typeof value;

  switch (schema.type) {
    case "string":
      if (typeof value !== "string") {
        return `Expected string for '${paramName}', got ${actualType}`;
      }
      // Check enum constraint
      if (schema.enum && !schema.enum.includes(value)) {
        return `Invalid value '${value}' for '${paramName}'. Allowed: ${schema.enum.join(", ")}`;
      }
      break;

    case "number":
      if (typeof value !== "number" || !Number.isFinite(value)) {
        return `Expected finite number for '${paramName}', got ${typeof value === "number" ? String(value) : actualType}`;
      }
      if (schema.minimum !== undefined && value < schema.minimum) {
        return `Value ${value} for '${paramName}' is below minimum ${schema.minimum}`;
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        return `Value ${value} for '${paramName}' is above maximum ${schema.maximum}`;
      }
      break;

    case "boolean":
      if (typeof value !== "boolean") {
        return `Expected boolean for '${paramName}', got ${actualType}`;
      }
      break;

    case "array":
      if (!Array.isArray(value)) {
        return `Expected array for '${paramName}', got ${actualType}`;
      }
      break;

    case "object":
      if (typeof value !== "object" || Array.isArray(value)) {
        return `Expected object for '${paramName}', got ${actualType}`;
      }
      break;
  }

  return null;
}

/**
 * Find a generator schema by name
 */
function findGeneratorSchema(
  name: string,
  capabilities: ClientCapabilities
): GeneratorSchema | undefined {
  return capabilities.generators.find((g) => g.name === name);
}

/**
 * Find a transform operation schema by name
 */
function findTransformSchema(
  name: string,
  capabilities: ClientCapabilities
): TransformOperationSchema | undefined {
  return capabilities.transforms.find((t) => t.name === name);
}

/**
 * Find a vision provider schema by name
 */
function findVisionSchema(
  name: string,
  capabilities: ClientCapabilities
): VisionProviderSchema | undefined {
  return capabilities.visionProviders.find((v) => v.name === name);
}

/**
 * Find a text provider schema by name
 */
function findTextSchema(
  name: string,
  capabilities: ClientCapabilities
): TextProviderSchema | undefined {
  return capabilities.textProviders.find((t) => t.name === name);
}

/**
 * Validate a single pipeline step against schemas
 */
export function validateStep(
  step: PipelineStep,
  stepIndex: number,
  capabilities: ClientCapabilities,
  options: ValidationOptions = {}
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const opts = { skipMissingSchemas: true, ...options };

  const context = {
    stepIndex,
    stepKind: step.kind,
    providerName: "",
  };

  switch (step.kind) {
    case "generate": {
      context.providerName = step.generator;
      const schema = findGeneratorSchema(step.generator, capabilities);

      if (!schema) {
        if (!opts.skipMissingSchemas) {
          errors.push({
            severity: "error",
            code: "UNKNOWN_GENERATOR",
            message: `Unknown generator '${step.generator}'`,
            ...context,
          });
        }
        break;
      }

      const result = validateParams(step.params, schema, context, opts);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      break;
    }

    case "transform": {
      context.providerName = step.op;
      const schema = findTransformSchema(step.op, capabilities);

      if (!schema) {
        if (!opts.skipMissingSchemas) {
          errors.push({
            severity: "error",
            code: "UNKNOWN_TRANSFORM",
            message: `Unknown transform operation '${step.op}'`,
            ...context,
          });
        }
        break;
      }

      const result = validateParams(step.params, schema, context, opts);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      break;
    }

    case "vision": {
      context.providerName = step.provider;
      const schema = findVisionSchema(step.provider, capabilities);

      if (!schema) {
        if (!opts.skipMissingSchemas) {
          errors.push({
            severity: "error",
            code: "UNKNOWN_VISION_PROVIDER",
            message: `Unknown vision provider '${step.provider}'`,
            ...context,
          });
        }
        break;
      }

      const result = validateParams(step.params, schema, context, opts);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      break;
    }

    case "text": {
      context.providerName = step.provider;
      const schema = findTextSchema(step.provider, capabilities);

      if (!schema) {
        if (!opts.skipMissingSchemas) {
          errors.push({
            severity: "error",
            code: "UNKNOWN_TEXT_PROVIDER",
            message: `Unknown text provider '${step.provider}'`,
            ...context,
          });
        }
        break;
      }

      const result = validateParams(step.params, schema, context, opts);
      errors.push(...result.errors);
      warnings.push(...result.warnings);
      break;
    }

    // These step types don't have parameter schemas to validate
    case "save":
    case "fan-out":
    case "collect":
    case "router":
      // No parameter validation for these steps
      break;
  }

  return createResult(errors, warnings);
}

/**
 * Validate an entire pipeline against schemas
 *
 * @param pipeline - The pipeline to validate
 * @param capabilities - Client capabilities containing schemas
 * @param options - Validation options
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const client = createClient();
 * const result = validatePipeline(pipeline, client.getCapabilities());
 *
 * if (!result.valid) {
 *   console.error(result.formatErrors());
 *   throw new Error("Pipeline validation failed");
 * }
 * ```
 */
export function validatePipeline(
  pipeline: Pipeline,
  capabilities: ClientCapabilities,
  options: ValidationOptions = {}
): ValidationResult {
  const allErrors: ValidationIssue[] = [];
  const allWarnings: ValidationIssue[] = [];

  for (let i = 0; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i];
    const result = validateStep(step, i, capabilities, options);
    allErrors.push(...result.errors);
    allWarnings.push(...result.warnings);
  }

  return createResult(allErrors, allWarnings);
}

/**
 * Validate parameters for a specific generator
 *
 * Useful for template validation where you have generator name + params
 * but not a full pipeline.
 *
 * @param generatorName - Name of the generator
 * @param params - Parameters to validate
 * @param capabilities - Client capabilities containing schemas
 * @param options - Validation options
 * @returns Validation result
 *
 * @example
 * ```typescript
 * const result = validateGeneratorParams(
 *   "openai",
 *   { model: "dall-e-3" }, // Missing required "prompt"
 *   client.getCapabilities()
 * );
 * // result.errors[0].message = "Missing required parameter 'prompt'"
 * ```
 */
export function validateGeneratorParams(
  generatorName: string,
  params: Record<string, unknown>,
  capabilities: ClientCapabilities,
  options: ValidationOptions = {}
): ValidationResult {
  const opts = { skipMissingSchemas: true, ...options };
  const schema = findGeneratorSchema(generatorName, capabilities);

  if (!schema) {
    if (opts.skipMissingSchemas) {
      return createResult([], []);
    }
    return createResult(
      [
        {
          severity: "error",
          code: "UNKNOWN_GENERATOR",
          message: `Unknown generator '${generatorName}'`,
          providerName: generatorName,
        },
      ],
      []
    );
  }

  const context = { providerName: generatorName };
  const result = validateParams(params, schema, context, opts);
  return createResult(result.errors, result.warnings);
}

/**
 * Validate parameters for a specific transform operation
 *
 * @param operationName - Name of the transform operation
 * @param params - Parameters to validate
 * @param capabilities - Client capabilities containing schemas
 * @param options - Validation options
 * @returns Validation result
 */
export function validateTransformParams(
  operationName: string,
  params: Record<string, unknown>,
  capabilities: ClientCapabilities,
  options: ValidationOptions = {}
): ValidationResult {
  const opts = { skipMissingSchemas: true, ...options };
  const schema = findTransformSchema(operationName, capabilities);

  if (!schema) {
    if (opts.skipMissingSchemas) {
      return createResult([], []);
    }
    return createResult(
      [
        {
          severity: "error",
          code: "UNKNOWN_TRANSFORM",
          message: `Unknown transform operation '${operationName}'`,
          providerName: operationName,
        },
      ],
      []
    );
  }

  const context = { providerName: operationName };
  const result = validateParams(params, schema, context, opts);
  return createResult(result.errors, result.warnings);
}

// =============================================================================
// Semantic Validation
// =============================================================================

/**
 * Semantic validation codes
 */
export const SemanticValidationCodes = {
  /** AI generator requires prompt but has no static prompt AND no _promptFromVar */
  MISSING_PROMPT_SOURCE: "MISSING_PROMPT_SOURCE",
  /** Transform step has no image input (no 'in' reference or reference is undefined) */
  MISSING_IMAGE_INPUT: "MISSING_IMAGE_INPUT",
  /** Fan-out step in array mode is missing arrayProperty */
  MISSING_ARRAY_PROPERTY: "MISSING_ARRAY_PROPERTY",
  /** Step references a variable that doesn't exist (not defined by any previous step) */
  UNDEFINED_VARIABLE: "UNDEFINED_VARIABLE",
  /** Collect step references undefined input variables */
  UNDEFINED_COLLECT_INPUT: "UNDEFINED_COLLECT_INPUT",
  /** Router step references undefined candidate or selection input */
  UNDEFINED_ROUTER_INPUT: "UNDEFINED_ROUTER_INPUT",
  /** Transform operation requires specific input format (e.g., PNG for OpenAI edit) */
  INCOMPATIBLE_INPUT_FORMAT: "INCOMPATIBLE_INPUT_FORMAT",
} as const;

export type SemanticValidationCode =
  (typeof SemanticValidationCodes)[keyof typeof SemanticValidationCodes];

/**
 * Validate a pipeline for semantic correctness
 *
 * This checks higher-level semantic issues that parameter validation doesn't catch:
 * - AI generators without a prompt source (static prompt or _promptFromVar)
 * - Transforms without image input references
 * - Fan-out in array mode without arrayProperty
 * - References to undefined variables
 *
 * @param pipeline - The pipeline to validate
 * @param capabilities - Client capabilities for schema lookups (optional, used for AI detection)
 * @returns Validation result with errors and warnings
 *
 * @example
 * ```typescript
 * const result = validatePipelineSemantics(pipeline, client.getCapabilities());
 * if (!result.valid) {
 *   console.error(result.formatErrors());
 * }
 * ```
 */
export function validatePipelineSemantics(
  pipeline: Pipeline,
  capabilities?: ClientCapabilities
): ValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  // Track which variables are defined by previous steps
  const definedVariables = new Set<string>();

  // Add initial variables if present
  if (pipeline.initialVariables) {
    for (const varName of Object.keys(pipeline.initialVariables)) {
      definedVariables.add(varName);
    }
  }

  for (let i = 0; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i];
    const context = {
      stepIndex: i,
      stepKind: step.kind,
    };

    switch (step.kind) {
      case "generate": {
        // Check if AI generator has a prompt source
        const schema = capabilities?.generators.find((g) => g.name === step.generator);
        const isAI =
          schema?.isAI ??
          (step.generator.includes("openai") ||
            step.generator.includes("stability") ||
            step.generator.includes("gemini") ||
            step.generator.includes("imagen") ||
            step.generator.includes("replicate"));

        if (isAI) {
          const hasStaticPrompt =
            step.params?.prompt &&
            typeof step.params.prompt === "string" &&
            step.params.prompt.trim() !== "";
          const hasPromptFromVar = step.params?._promptFromVar !== undefined;

          if (!hasStaticPrompt && !hasPromptFromVar) {
            errors.push({
              severity: "error",
              code: SemanticValidationCodes.MISSING_PROMPT_SOURCE,
              message: `AI generator '${step.generator}' requires a prompt but has no static prompt and no dynamic prompt source (_promptFromVar)`,
              ...context,
              providerName: step.generator,
              suggestedFix: `Either set a static 'prompt' parameter with descriptive text, OR connect a text node to this generator's text input (set _promptFromVar to the text step's output variable)`,
            });
          }

          // If using _promptFromVar, check it references a defined variable
          if (hasPromptFromVar) {
            const promptVar = step.params!._promptFromVar as string;
            if (!definedVariables.has(promptVar)) {
              errors.push({
                severity: "error",
                code: SemanticValidationCodes.UNDEFINED_VARIABLE,
                message: `Generator references undefined variable '${promptVar}' in _promptFromVar`,
                ...context,
                providerName: step.generator,
                parameterName: "_promptFromVar",
                suggestedFix: `Ensure a text step with output variable '${promptVar}' exists before this generator step`,
              });
            }
          }
        }

        // Define output variable
        definedVariables.add(step.out);
        break;
      }

      case "transform": {
        // Check that 'in' references a defined variable
        if (!definedVariables.has(step.in)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_VARIABLE,
            message: `Transform step references undefined variable '${step.in}'`,
            ...context,
            providerName: step.op,
            suggestedFix: `Connect a generator or another transform to this node's image input. The variable '${step.in}' must be defined by a previous step.`,
          });
        }

        // Define output variable
        definedVariables.add(step.out);
        break;
      }

      case "vision": {
        // Check that 'in' references a defined variable
        if (!definedVariables.has(step.in)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_VARIABLE,
            message: `Vision step references undefined variable '${step.in}'`,
            ...context,
            providerName: step.provider,
            suggestedFix: `Connect an image source (generator, transform, or collect node) to this vision node's image input. The variable '${step.in}' must be defined by a previous step.`,
          });
        }

        // Define output variable
        definedVariables.add(step.out);
        break;
      }

      case "text": {
        // 'in' is optional for text steps
        if (step.in && !definedVariables.has(step.in)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_VARIABLE,
            message: `Text step references undefined variable '${step.in}'`,
            ...context,
            providerName: step.provider,
            suggestedFix: `Ensure the input variable '${step.in}' is defined by a previous step, or remove the input connection if this text node doesn't need one.`,
          });
        }

        // Define output variable
        definedVariables.add(step.out);
        break;
      }

      case "save": {
        // Check that 'in' references a defined variable
        if (!definedVariables.has(step.in)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_VARIABLE,
            message: `Save step references undefined variable '${step.in}'`,
            ...context,
            suggestedFix: `Connect an image source to this save node. The variable '${step.in}' must be defined by a previous generator or transform step.`,
          });
        }

        // Define output variable if present
        if (step.out) {
          definedVariables.add(step.out);
        }
        break;
      }

      case "fan-out": {
        // Check that 'in' references a defined variable
        if (!definedVariables.has(step.in)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_VARIABLE,
            message: `Fan-out step references undefined variable '${step.in}'`,
            ...context,
            suggestedFix: `Connect a text node to this fan-out node's input. The variable '${step.in}' must be defined by a previous step.`,
          });
        }

        // Check array mode has arrayProperty
        if (step.mode === "array" && !step.arrayProperty) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.MISSING_ARRAY_PROPERTY,
            message: `Fan-out step in array mode requires 'arrayProperty' to specify which array to iterate`,
            ...context,
            suggestedFix: `Set 'arrayProperty' to the name of the array property in the upstream text node's JSON output (e.g., "prompts" for {"prompts": ["a", "b", "c"]})`,
          });
        }

        // Define output variables
        for (const outVar of step.out) {
          definedVariables.add(outVar);
        }
        break;
      }

      case "collect": {
        // Check all input variables are defined
        for (const inVar of step.in) {
          if (!definedVariables.has(inVar)) {
            errors.push({
              severity: "error",
              code: SemanticValidationCodes.UNDEFINED_COLLECT_INPUT,
              message: `Collect step references undefined variable '${inVar}'`,
              ...context,
              suggestedFix: `Ensure all input nodes connected to this collect node are defined earlier in the workflow. The variable '${inVar}' is missing.`,
            });
          }
        }

        // Define output variable
        definedVariables.add(step.out);
        break;
      }

      case "router": {
        // Check 'in' (candidates array) references a defined variable
        if (!definedVariables.has(step.in)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_ROUTER_INPUT,
            message: `Router step references undefined candidates variable '${step.in}'`,
            ...context,
            suggestedFix: `Connect a collect node to the router's candidates input. The variable '${step.in}' must be an array from a collect node.`,
          });
        }

        // Check 'selectionIn' references a defined variable
        if (!definedVariables.has(step.selectionIn)) {
          errors.push({
            severity: "error",
            code: SemanticValidationCodes.UNDEFINED_ROUTER_INPUT,
            message: `Router step references undefined selection variable '${step.selectionIn}'`,
            ...context,
            suggestedFix: `Connect a vision node to the router's selection input. The variable '${step.selectionIn}' must contain JSON with the selection property.`,
          });
        }

        // Define output variable
        definedVariables.add(step.out);
        break;
      }
    }
  }

  return createResult(errors, warnings);
}

/**
 * Comprehensive validation combining parameter and semantic checks
 *
 * This is the recommended validation function for most use cases.
 * It runs both parameter validation (schema checks) and semantic validation
 * (variable references, prompt sources, etc.)
 *
 * @param pipeline - The pipeline to validate
 * @param capabilities - Client capabilities containing schemas
 * @param options - Validation options
 * @returns Combined validation result
 *
 * @example
 * ```typescript
 * const result = validatePipelineFull(pipeline, client.getCapabilities());
 * if (!result.valid) {
 *   throw new ValidationError(result.formatErrors());
 * }
 * ```
 */
export function validatePipelineFull(
  pipeline: Pipeline,
  capabilities: ClientCapabilities,
  options: ValidationOptions = {}
): ValidationResult {
  // Run parameter validation
  const paramResult = validatePipeline(pipeline, capabilities, options);

  // Run semantic validation
  const semanticResult = validatePipelineSemantics(pipeline, capabilities);

  // Combine results
  const allErrors = [...paramResult.errors, ...semanticResult.errors];
  const allWarnings = [...paramResult.warnings, ...semanticResult.warnings];

  return createResult(allErrors, allWarnings);
}
