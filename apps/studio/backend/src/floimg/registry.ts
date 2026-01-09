/**
 * Node registry - auto-discovers generators and transforms from floimg
 *
 * This module converts floimg's capability schemas to studio NodeDefinitions.
 * The schemas are sourced from the floimg client at runtime, ensuring the
 * visual editor always reflects what the execution engine actually supports.
 */

import type { NodeDefinition, ParamSchema, ParamField } from "@teamflojo/floimg-studio-shared";
import type {
  GeneratorSchema,
  TransformOperationSchema,
  ParameterSchema,
  TextProviderSchema,
  VisionProviderSchema,
} from "@teamflojo/floimg";
import { getCachedCapabilities, getClient } from "./setup.js";

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
    isAI: schema.isAI,
    requiresApiKey: schema.requiresApiKey,
    apiKeyEnvVar: schema.apiKeyEnvVar,
    acceptsReferenceImages: schema.acceptsReferenceImages,
    maxReferenceImages: schema.maxReferenceImages,
  };
}

/**
 * Convert floimg TransformOperationSchema to studio NodeDefinition
 * @param schema - The transform operation schema
 * @param providerName - The provider this transform belongs to
 */
function transformToNode(schema: TransformOperationSchema, providerName: string): NodeDefinition {
  return {
    id: `transform:${providerName}:${schema.name}`,
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
    providerName,
    isAI: schema.isAI,
    requiresApiKey: schema.requiresApiKey,
    apiKeyEnvVar: schema.apiKeyEnvVar,
    acceptsReferenceImages: schema.acceptsReferenceImages,
    maxReferenceImages: schema.maxReferenceImages,
  };
}

/**
 * Convert floimg TextProviderSchema to studio NodeDefinition
 */
function textProviderToNode(schema: TextProviderSchema): NodeDefinition {
  return {
    id: `text:${schema.name}`,
    type: "text",
    name: schema.name,
    label: formatLabel(schema.name, schema.description),
    description: schema.description,
    category: schema.category || "AI Text",
    params: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(schema.parameters).map(([k, v]) => [k, parameterToField(v)])
      ),
      required: schema.requiredParameters,
    },
    requiresApiKey: schema.requiresApiKey,
  };
}

/**
 * Convert floimg VisionProviderSchema to studio NodeDefinition
 */
function visionProviderToNode(schema: VisionProviderSchema): NodeDefinition {
  return {
    id: `vision:${schema.name}`,
    type: "vision",
    name: schema.name,
    label: formatLabel(schema.name, schema.description),
    description: schema.description,
    category: schema.category || "AI Vision",
    params: {
      type: "object",
      properties: Object.fromEntries(
        Object.entries(schema.parameters).map(([k, v]) => [k, parameterToField(v)])
      ),
      required: schema.requiredParameters,
    },
    requiresApiKey: schema.requiresApiKey,
  };
}

/**
 * Generate a human-readable label from name and description
 *
 * Priority:
 * 1. If description starts with a short phrase (≤20 chars before punctuation), use it
 * 2. Otherwise, convert name from kebab-case to Title Case
 *
 * Examples:
 *   - "gemini-text" → "Gemini Text"
 *   - "grok-vision" → "Grok Vision"
 *   - "dalle-3" (desc: "DALL-E 3 image generation") → "DALL-E 3 image generation" (too long) → "Dalle 3"
 */
function formatLabel(name: string, description?: string): string {
  // If description exists, use first word/phrase as label
  if (description) {
    const firstWord = description.split(/[,.\-:]/)[0].trim();
    if (firstWord.length <= 20) {
      return firstWord;
    }
  }
  // Convert kebab-case to Title Case (e.g., "gemini-text" → "Gemini Text")
  return name
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
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
 * Iterates over providers directly to preserve provider association
 */
export function getTransforms(): NodeDefinition[] {
  const client = getClient();
  const transforms: NodeDefinition[] = [];

  // Iterate over transform providers to preserve provider name association
  for (const [providerName, provider] of Object.entries(client.providers.transform)) {
    const typedProvider = provider as {
      operationSchemas: Record<string, TransformOperationSchema>;
    };
    for (const schema of Object.values(typedProvider.operationSchemas)) {
      transforms.push(transformToNode(schema, providerName));
    }
  }

  return transforms;
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

/**
 * Get all available text providers as NodeDefinitions
 */
export function getTextProviders(): NodeDefinition[] {
  const caps = getCachedCapabilities();
  return caps.textProviders.map(textProviderToNode);
}

/**
 * Get all available vision providers as NodeDefinitions
 */
export function getVisionProviders(): NodeDefinition[] {
  const caps = getCachedCapabilities();
  return caps.visionProviders.map(visionProviderToNode);
}

/**
 * Get flow control node definitions (studio-specific, not from floimg)
 * These enable iterative workflows with parallel branching
 */
export function getFlowControlNodes(): NodeDefinition[] {
  return [
    {
      id: "flow:fanout",
      type: "fanout",
      name: "fanout",
      label: "Fan-Out",
      description:
        "Split execution into parallel branches. Use 'count' mode for N copies or 'array' mode to iterate over array items.",
      category: "Flow Control",
      params: {
        type: "object",
        properties: {
          mode: {
            type: "string",
            title: "Mode",
            description:
              "How to create branches: 'count' creates N copies, 'array' iterates over parsed array",
            enum: ["count", "array"],
            default: "count",
          },
          count: {
            type: "number",
            title: "Branch Count",
            description: "Number of parallel branches (only used in count mode)",
            minimum: 2,
            maximum: 10,
            default: 3,
          },
          arrayProperty: {
            type: "string",
            title: "Array Property",
            description: "Property name containing array to iterate (only used in array mode)",
          },
        },
      },
    },
    {
      id: "flow:collect",
      type: "collect",
      name: "collect",
      label: "Collect",
      description:
        "Gather results from parallel branches into an array. Waits for all branches to complete.",
      category: "Flow Control",
      params: {
        type: "object",
        properties: {
          expectedCount: {
            type: "number",
            title: "Expected Count",
            description: "Number of branches to wait for (auto-detected from fan-out if connected)",
          },
        },
      },
    },
    {
      id: "flow:router",
      type: "router",
      name: "router",
      label: "Router",
      description:
        "Select item(s) from candidates based on AI selection. Connect candidates array and selection/ranking output.",
      category: "Flow Control",
      params: {
        type: "object",
        properties: {
          selectionProperty: {
            type: "string",
            title: "Selection Property",
            description:
              "Property in selection output containing winner index (e.g., 'best_index', 'winner')",
            default: "best_index",
          },
          contextProperty: {
            type: "string",
            title: "Context Property",
            description:
              "Optional property to extract as context output (e.g., 'reasoning', 'feedback')",
          },
        },
      },
    },
  ];
}
