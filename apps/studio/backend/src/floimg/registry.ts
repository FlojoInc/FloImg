/**
 * Node registry - auto-discovers generators and transforms from floimg
 *
 * This module converts floimg's capability schemas to studio NodeDefinitions.
 * The schemas are sourced from the floimg client at runtime, ensuring the
 * visual editor always reflects what the execution engine actually supports.
 */

import type { NodeDefinition, ParamSchema, ParamField } from "@floimg-studio/shared";
import type { GeneratorSchema, TransformOperationSchema, ParameterSchema } from "@teamflojo/floimg";
import { getCachedCapabilities } from "./setup.js";

/**
 * Convert floimg ParameterSchema to studio ParamField
 */
function parameterToField(schema: ParameterSchema): ParamField {
  return {
    type: schema.type as ParamField["type"],
    title: schema.title,
    description: schema.description,
    default: schema.default,
    enum: schema.enum,
    minimum: schema.minimum,
    maximum: schema.maximum,
    properties: schema.properties
      ? Object.fromEntries(
          Object.entries(schema.properties).map(([k, v]) => [k, parameterToField(v)])
        )
      : undefined,
  };
}

/**
 * Convert floimg GeneratorSchema to studio NodeDefinition
 */
function generatorToNode(schema: GeneratorSchema): NodeDefinition {
  return {
    id: `generator:${schema.name}`,
    type: "generator",
    name: schema.name,
    label: formatLabel(schema.name, schema.description),
    description: schema.description,
    category: schema.category || "General",
    params: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(schema.parameters).map(([k, v]) => [k, parameterToField(v)])
      ),
      required: schema.requiredParameters,
    },
  };
}

/**
 * Convert floimg TransformOperationSchema to studio NodeDefinition
 */
function transformToNode(schema: TransformOperationSchema): NodeDefinition {
  return {
    id: `transform:${schema.name}`,
    type: "transform",
    name: schema.name,
    label: formatLabel(schema.name, schema.description),
    description: schema.description,
    category: schema.category || "Effects",
    params: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(schema.parameters).map(([k, v]) => [k, parameterToField(v)])
      ),
      required: schema.requiredParameters,
    },
  };
}

/**
 * Generate a human-readable label from name and description
 */
function formatLabel(name: string, description?: string): string {
  // If description exists, use first word/phrase as label
  if (description) {
    const firstWord = description.split(/[,.\-:]/)[0].trim();
    if (firstWord.length <= 20) {
      return firstWord;
    }
  }
  // Otherwise capitalize the name
  return name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, " $1");
}

/**
 * Get all available generators as NodeDefinitions
 */
export function getGenerators(): NodeDefinition[] {
  const caps = getCachedCapabilities();
  return caps.generators.map(generatorToNode);
}

/**
 * Get all available transforms as NodeDefinitions
 */
export function getTransforms(): NodeDefinition[] {
  const caps = getCachedCapabilities();
  return caps.transforms.map(transformToNode);
}

/**
 * Get input node definitions (not from floimg, these are studio-specific)
 */
export function getInputNodes(): NodeDefinition[] {
  return [
    {
      id: "input:upload",
      type: "input",
      name: "upload",
      label: "Upload Image",
      description: "Use an uploaded image as input",
      category: "Input",
      params: {
        type: "object",
        properties: {
          uploadId: {
            type: "string",
            title: "Upload ID",
            description: "Reference to uploaded image",
          },
        },
      },
    },
  ];
}

/**
 * Get schema for a specific generator
 */
export function getGeneratorSchema(name: string): ParamSchema | undefined {
  const caps = getCachedCapabilities();
  const generator = caps.generators.find((g) => g.name === name);
  if (!generator) return undefined;

  return {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(generator.parameters).map(([k, v]) => [k, parameterToField(v)])
    ),
    required: generator.requiredParameters,
  };
}

/**
 * Get schema for a specific transform operation
 */
export function getTransformSchema(op: string): ParamSchema | undefined {
  const caps = getCachedCapabilities();
  const transform = caps.transforms.find((t) => t.name === op);
  if (!transform) return undefined;

  return {
    type: "object",
    properties: Object.fromEntries(
      Object.entries(transform.parameters).map(([k, v]) => [k, parameterToField(v)])
    ),
    required: transform.requiredParameters,
  };
}
