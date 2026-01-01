/**
 * AI Workflow Generator - Uses Gemini 3 Pro to generate workflows from natural language
 *
 * This service takes a user's description of what they want and generates a valid
 * FloImg Studio workflow using Gemini's structured output capability.
 */

import { GoogleGenAI, Type } from "@google/genai";
import type {
  GeneratedWorkflowData,
  GenerateWorkflowMessage,
  NodeDefinition,
} from "@teamflojo/floimg-studio-shared";
import {
  getGenerators,
  getTransforms,
  getInputNodes,
  getTextProviders,
  getVisionProviders,
} from "../floimg/registry.js";

// Model to use for workflow generation
const MODEL_ID = "gemini-3-pro-preview";

/**
 * JSON Schema for Gemini structured output
 * Matches GeneratedWorkflowData interface
 */
const WORKFLOW_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: {
            type: Type.STRING,
            description: "Unique identifier for this node (e.g., 'node_1', 'generator_1')",
          },
          nodeType: {
            type: Type.STRING,
            description:
              "Node type from the registry (e.g., 'generator:dalle-3', 'transform:sharp:resize', 'input:upload')",
          },
          label: {
            type: Type.STRING,
            description: "Human-readable label for display",
          },
          parameters: {
            type: Type.OBJECT,
            description: "Node parameters matching the node type's parameter schema",
          },
        },
        required: ["id", "nodeType", "parameters"],
      },
      description: "Array of nodes in the workflow",
    },
    edges: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          source: {
            type: Type.STRING,
            description: "Source node ID",
          },
          target: {
            type: Type.STRING,
            description: "Target node ID",
          },
          sourceHandle: {
            type: Type.STRING,
            description: "Source handle for multi-output nodes (optional)",
          },
          targetHandle: {
            type: Type.STRING,
            description: "Target handle for multi-input nodes (optional)",
          },
        },
        required: ["source", "target"],
      },
      description: "Array of edges connecting nodes",
    },
  },
  required: ["nodes", "edges"],
};

/**
 * Build the system prompt with available node types
 */
function buildSystemPrompt(availableNodes: NodeDefinition[]): string {
  const nodeDescriptions = availableNodes
    .map((node) => {
      const params = Object.entries(node.params.properties)
        .map(([name, field]) => {
          const required = node.params.required?.includes(name) ? " (required)" : "";
          return `    - ${name}: ${field.type}${required} - ${field.description || ""}`;
        })
        .join("\n");
      return `  - ${node.id}: ${node.description || node.label}\n${params}`;
    })
    .join("\n\n");

  return `You are a workflow designer for FloImg Studio, a visual image processing application.
Your job is to convert natural language descriptions into valid FloImg workflows.

## Available Node Types

${nodeDescriptions}

## Workflow Structure

A workflow consists of:
1. **Nodes**: Processing steps (generators, transforms, etc.)
2. **Edges**: Connections between nodes (data flows from source to target)

## Rules

1. Every workflow needs at least one source (generator or input:upload)
2. Nodes must be connected via edges to form a valid data flow
3. Use node IDs like "node_1", "node_2" etc.
4. The nodeType must exactly match one from the available list above
5. Parameters should match what the node type expects
6. For image generation, prefer AI generators like "generator:dalle-3", "generator:gemini-imagen"
7. For transforms, use the correct provider format: "transform:{provider}:{operation}"

## Examples

**User**: "Generate an image of a cat and resize it to 800x600"
**Workflow**:
- node_1: generator:dalle-3 (prompt: "a cat")
- node_2: transform:sharp:resize (width: 800, height: 600)
- edge: node_1 → node_2

**User**: "Take my uploaded image, remove the background, and convert to PNG"
**Workflow**:
- node_1: input:upload
- node_2: transform:stability-transform:removeBackground
- node_3: transform:sharp:format (format: "png")
- edges: node_1 → node_2 → node_3

Now generate a workflow for the user's request.`;
}

/**
 * Get all available nodes from the registry
 */
function getAllAvailableNodes(): NodeDefinition[] {
  return [
    ...getInputNodes(),
    ...getGenerators(),
    ...getTransforms(),
    ...getTextProviders(),
    ...getVisionProviders(),
  ];
}

/**
 * Format conversation history for Gemini
 */
function formatHistory(history: GenerateWorkflowMessage[]): Array<{
  role: "user" | "model";
  parts: Array<{ text: string }>;
}> {
  return history.map((msg) => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [
      {
        text:
          msg.role === "assistant" && msg.workflow
            ? `${msg.content}\n\nGenerated workflow: ${JSON.stringify(msg.workflow)}`
            : msg.content,
      },
    ],
  }));
}

export interface GenerateWorkflowResult {
  success: boolean;
  workflow?: GeneratedWorkflowData;
  message: string;
  error?: string;
}

/**
 * Generate a workflow from natural language using Gemini 3 Pro
 */
export async function generateWorkflow(
  prompt: string,
  history: GenerateWorkflowMessage[] = []
): Promise<GenerateWorkflowResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "Gemini API key not configured",
      error: "GEMINI_API_KEY environment variable is not set",
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const availableNodes = getAllAvailableNodes();
    const systemPrompt = buildSystemPrompt(availableNodes);

    // Build contents with history
    const contents = [
      ...formatHistory(history),
      {
        role: "user" as const,
        parts: [{ text: prompt }],
      },
    ];

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: WORKFLOW_SCHEMA,
      },
    });

    // Parse the response
    const text = response.text;
    if (!text) {
      return {
        success: false,
        message: "No response from Gemini",
        error: "Empty response received",
      };
    }

    const workflow = JSON.parse(text) as GeneratedWorkflowData;

    // Validate the workflow
    const validation = validateWorkflow(workflow, availableNodes);
    if (!validation.valid) {
      return {
        success: false,
        workflow,
        message: `Generated workflow has issues: ${validation.errors.join(", ")}`,
        error: validation.errors.join("; "),
      };
    }

    return {
      success: true,
      workflow,
      message: `Created a workflow with ${workflow.nodes.length} nodes`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      message: "Failed to generate workflow",
      error: errorMessage,
    };
  }
}

/**
 * Validate a generated workflow
 */
function validateWorkflow(
  workflow: GeneratedWorkflowData,
  availableNodes: NodeDefinition[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));
  const availableNodeTypes = new Set(availableNodes.map((n) => n.id));

  // Check nodes
  for (const node of workflow.nodes) {
    if (!node.id) {
      errors.push("Node missing ID");
    }
    if (!node.nodeType) {
      errors.push(`Node ${node.id} missing nodeType`);
    } else if (!availableNodeTypes.has(node.nodeType)) {
      errors.push(`Unknown node type: ${node.nodeType}`);
    }
  }

  // Check edges
  for (const edge of workflow.edges) {
    if (!nodeIds.has(edge.source)) {
      errors.push(`Edge references unknown source: ${edge.source}`);
    }
    if (!nodeIds.has(edge.target)) {
      errors.push(`Edge references unknown target: ${edge.target}`);
    }
  }

  // Check for at least one source node
  const hasSource = workflow.nodes.some(
    (n) => n.nodeType.startsWith("generator:") || n.nodeType === "input:upload"
  );
  if (!hasSource) {
    errors.push("Workflow has no source node (generator or input)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
