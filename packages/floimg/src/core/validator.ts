/**
 * FloImg Parameter Validator
 *
 * Validates workflow/pipeline parameters against generator and transform schemas.
 * Catches common issues like:
 * - Missing required parameters
 * - Unknown parameters (warns, doesn't error - for pass-through flexibility)
 * - Type mismatches
 *
 * Can be used at:
 * - Build time: Validate templates before packaging
 * - Runtime: Validate before execution
 *
 * @example
 * ```typescript
 * import { validatePipeline, ValidationError } from '@teamflojo/floimg';
 *
 * const result = validatePipeline(pipeline, client.getCapabilities());
 * if (result.errors.length > 0) {
 *   throw new ValidationError(result.formatErrors());
 * }
 * if (result.warnings.length > 0) {
 *   console.warn(result.formatWarnings());
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
      errors.push({
        severity: "error",
        code: "MISSING_REQUIRED_PARAM",
        message: `Missing required parameter '${paramName}'`,
        ...context,
        parameterName: paramName,
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
