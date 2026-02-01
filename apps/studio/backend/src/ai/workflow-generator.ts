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
  getFlowControlNodes,
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
              "Node type from the registry (e.g., 'generator:gemini-generate', 'generator:openai', 'transform:sharp:resize')",
          },
          label: {
            type: Type.STRING,
            description: "Human-readable label for display",
          },
          parametersJson: {
            type: Type.STRING,
            description:
              'Node parameters as a JSON string (e.g., \'{"prompt": "a sunset", "width": 800}\')',
          },
        },
        required: ["id", "nodeType"],
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
5. Parameters must be provided as a JSON string in the "parametersJson" field
6. For image generation, use AI generators like "generator:gemini-generate", "generator:openai", or "generator:stability"
7. For transforms, use the correct provider format: "transform:{provider}:{operation}"
8. When a generator receives a dynamic prompt from a text node, use "prePrompt" to add context/instructions that get prepended to the dynamic content
9. For composite transforms (transform:sharp:composite), use targetHandle: "base" for the background image and targetHandle: "overlays[0]", "overlays[1]", etc. for each overlay image

## Text Node Structured Output

When using text:gemini-text to generate multiple prompts or structured data:

1. Set "outputFormat": "json" to enable JSON mode
2. Define "jsonSchema" with the exact structure you want
3. Use sourceHandle "output.{property}" to extract specific fields

Example jsonSchema for multiple prompts:
{
  "type": "object",
  "properties": {
    "landscape": { "type": "string", "description": "Fantasy landscape prompt" },
    "character": { "type": "string", "description": "Character prompt" },
    "item": { "type": "string", "description": "Item prompt" }
  },
  "required": ["landscape", "character", "item"]
}

Then connect edges with sourceHandle "output.landscape", "output.character", etc.

## Flow Control Nodes (Iterative Workflows)

Use flow control nodes for AI-driven iterative workflows that generate variations and select the best:

### flow:fanout - Split into Parallel Branches
- **input** handle (left): Receives data/array from upstream node
- **count mode**: Creates N copies of input (e.g., generate 3 variations)
- **array mode**: Iterates over array property from text node's parsed JSON output
- **out[0], out[1], out[2]** handles (right): One output per branch
- Connect each output to a separate generator for parallel image generation

### flow:collect - Gather Branch Results
- **in[0], in[1], in[2]** handles (left): One input per branch
- Waits for all parallel branches to complete
- **output** handle (right): Array of collected results
- Connect to vision node for evaluation

### flow:router - AI-Powered Selection
- **candidates** handle (left): Array of images from collect node
- **selection** handle (left): JSON from vision node with selection (e.g., {"best_index": 0, "reasoning": "..."})
- **selectionProperty**: Which property contains the winner index
- **winner** handle (right): The selected image
- **context** handle (right): Optional extracted context (reasoning, feedback)

### Vision Node Context Input
Vision nodes have a "context" input handle (top) that receives workflow context.
Connect a text node's output to provide the vision model with:
- Original objectives/requirements
- Prompts used to generate images
- Evaluation criteria

This helps the vision model make informed selections.

## Output Format

For each node, provide:
- id: unique identifier (e.g., "node_1")
- nodeType: exact match from available nodes (e.g., "generator:gemini-generate")
- label: human-readable description
- parametersJson: JSON string with parameters (e.g., '{"prompt": "a sunset", "width": 800}')

## Examples

### Simple: Generate and resize
**User**: "Generate an image of a cat and resize it to 800x600"

Response nodes:
- id: "node_1", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "a beautiful cat"}'
- id: "node_2", nodeType: "transform:sharp:resize", parametersJson: '{"width": 800, "height": 600}'

Response edges:
- source: "node_1", target: "node_2"

### Advanced: AI text generates prompts for image generation (simple)
**User**: "Use Gemini text to create a creative prompt, then generate an image from it"

Response nodes:
- id: "node_1", nodeType: "text:gemini-text", parametersJson: '{"prompt": "Generate a detailed, creative image prompt for a fantasy landscape with magical elements. Output only the prompt, nothing else."}'
- id: "node_2", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": ""}'

Response edges:
- source: "node_1", target: "node_2", sourceHandle: "text", targetHandle: "text"

### Advanced: Structured output with multiple image generators
**User**: "Generate structured prompts for a landscape, wizard, and weapon, then generate images from each"

Response nodes:
- id: "text_1", nodeType: "text:gemini-text", parametersJson: '{"prompt": "Generate three detailed image prompts for a fantasy art series.", "outputFormat": "json", "jsonSchema": {"type": "object", "properties": {"landscape": {"type": "string", "description": "A detailed fantasy landscape prompt"}, "wizard": {"type": "string", "description": "A detailed wizard character prompt"}, "weapon": {"type": "string", "description": "A detailed magical weapon prompt"}}, "required": ["landscape", "wizard", "weapon"]}}'
- id: "gen_landscape", nodeType: "generator:gemini-generate", label: "Landscape", parametersJson: '{"prompt": "", "prePrompt": "Generate a high-quality fantasy landscape image based on this description:", "aspectRatio": "16:9"}'
- id: "gen_wizard", nodeType: "generator:gemini-generate", label: "Wizard", parametersJson: '{"prompt": "", "prePrompt": "Generate a detailed character portrait based on this description:", "aspectRatio": "1:1"}'
- id: "gen_weapon", nodeType: "generator:gemini-generate", label: "Weapon", parametersJson: '{"prompt": "", "prePrompt": "Generate a detailed item illustration based on this description:", "aspectRatio": "1:1"}'

Response edges:
- source: "text_1", target: "gen_landscape", sourceHandle: "output.landscape", targetHandle: "text"
- source: "text_1", target: "gen_wizard", sourceHandle: "output.wizard", targetHandle: "text"
- source: "text_1", target: "gen_weapon", sourceHandle: "output.weapon", targetHandle: "text"

Note: The "prePrompt" parameter provides context/instructions that get prepended to the dynamic prompt.
When the main "prompt" comes from a text node, prePrompt ensures consistent styling or instructions.

### Advanced: Multiple reference images combined into one
**User**: "Generate 3 images and combine them as references for a final composite"

Response nodes:
- id: "gen_1", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "fantasy landscape"}'
- id: "gen_2", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "wizard character"}'
- id: "gen_3", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "magical staff"}'
- id: "final", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "Combine these reference images: place the wizard holding the staff in the landscape. Cinematic, high detail.", "imageSize": "2K"}'

Response edges:
- source: "gen_1", target: "final", sourceHandle: "image", targetHandle: "references"
- source: "gen_2", target: "final", sourceHandle: "image", targetHandle: "references"
- source: "gen_3", target: "final", sourceHandle: "image", targetHandle: "references"

### Advanced: Image as reference for another generation
**User**: "Generate an image, then use it as reference to create a variation"

Response nodes:
- id: "node_1", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "a serene mountain landscape at sunset"}'
- id: "node_2", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "same scene but during a thunderstorm with dramatic lighting"}'

Response edges:
- source: "node_1", target: "node_2", sourceHandle: "image", targetHandle: "referenceImage"

### Advanced: Multi-step pipeline with transforms
**User**: "Generate art, apply effects, and upscale"

Response nodes:
- id: "node_1", nodeType: "generator:gemini-generate", parametersJson: '{"prompt": "abstract digital art with vibrant colors"}'
- id: "node_2", nodeType: "transform:sharp:blur", parametersJson: '{"sigma": 2}'
- id: "node_3", nodeType: "transform:sharp:resize", parametersJson: '{"width": 2048, "height": 2048, "fit": "contain"}'

Response edges:
- source: "node_1", target: "node_2"
- source: "node_2", target: "node_3"

### Advanced: Composite transform (layering images)
**User**: "Generate a background and a logo, then composite them together"

Response nodes:
- id: "gen_bg", nodeType: "generator:gemini-generate", label: "Background", parametersJson: '{"prompt": "abstract gradient background, blue and purple"}'
- id: "gen_logo", nodeType: "generator:gemini-generate", label: "Logo", parametersJson: '{"prompt": "minimalist tech company logo, white on transparent"}'
- id: "composite_1", nodeType: "transform:sharp:composite", label: "Layer Images", parametersJson: '{"gravity": "center"}'

Response edges:
- source: "gen_bg", target: "composite_1", targetHandle: "base"
- source: "gen_logo", target: "composite_1", targetHandle: "overlays[0]"

Note: The composite transform requires specific targetHandle values:
- "base" for the background/base image (required)
- "overlays[0]", "overlays[1]", etc. for each overlay image (indexed)

### Iterative: Generate variations and AI-select the best
**User**: "Generate 3 variations of a mountain landscape and have AI pick the best one"

Response nodes:
- id: "text_1", nodeType: "text:gemini-text", label: "Context & Prompts", parametersJson: '{"prompt": "Generate 3 different prompts for mountain landscape images. Each should have a unique style: realistic, impressionist, and dramatic. Output JSON with prompts array and objectives.", "outputFormat": "json", "jsonSchema": {"type": "object", "properties": {"prompts": {"type": "array", "items": {"type": "string"}, "description": "Array of 3 image prompts"}, "objectives": {"type": "string", "description": "What makes a good mountain landscape"}}, "required": ["prompts", "objectives"]}}'
- id: "fanout_1", nodeType: "flow:fanout", label: "Split to 3 branches", parametersJson: '{"mode": "array", "arrayProperty": "prompts"}'
- id: "gen_1", nodeType: "generator:gemini-generate", label: "Variation 1", parametersJson: '{"prompt": ""}'
- id: "gen_2", nodeType: "generator:gemini-generate", label: "Variation 2", parametersJson: '{"prompt": ""}'
- id: "gen_3", nodeType: "generator:gemini-generate", label: "Variation 3", parametersJson: '{"prompt": ""}'
- id: "collect_1", nodeType: "flow:collect", label: "Gather results", parametersJson: '{}'
- id: "vision_1", nodeType: "vision:gemini-vision", label: "Evaluate & Select", parametersJson: '{"prompt": "Analyze these 3 mountain landscape images. Consider composition, lighting, detail, and artistic quality. Select the best one.", "outputFormat": "json", "jsonSchema": {"type": "object", "properties": {"best_index": {"type": "number", "description": "Index of best image (0, 1, or 2)"}, "reasoning": {"type": "string", "description": "Why this image is the best"}}, "required": ["best_index", "reasoning"]}}'
- id: "router_1", nodeType: "flow:router", label: "Select winner", parametersJson: '{"selectionProperty": "best_index", "contextProperty": "reasoning"}'

Response edges:
- source: "text_1", target: "fanout_1", sourceHandle: "text", targetHandle: "input"
- source: "fanout_1", target: "gen_1", sourceHandle: "out[0]", targetHandle: "text"
- source: "fanout_1", target: "gen_2", sourceHandle: "out[1]", targetHandle: "text"
- source: "fanout_1", target: "gen_3", sourceHandle: "out[2]", targetHandle: "text"
- source: "gen_1", target: "collect_1", sourceHandle: "image", targetHandle: "in[0]"
- source: "gen_2", target: "collect_1", sourceHandle: "image", targetHandle: "in[1]"
- source: "gen_3", target: "collect_1", sourceHandle: "image", targetHandle: "in[2]"
- source: "collect_1", target: "vision_1", sourceHandle: "output", targetHandle: "image"
- source: "text_1", target: "vision_1", sourceHandle: "text", targetHandle: "context"
- source: "collect_1", target: "router_1", sourceHandle: "output", targetHandle: "candidates"
- source: "vision_1", target: "router_1", sourceHandle: "output", targetHandle: "selection"

Note: This iterative workflow generates multiple variations, uses AI vision to evaluate them with full context of the original objectives, and routes the winner to the output.

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
    ...getFlowControlNodes(),
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
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      message: "Google AI API key not configured",
      error: "GOOGLE_AI_API_KEY environment variable is not set",
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

    const rawWorkflow = JSON.parse(text) as {
      nodes: Array<{
        id: string;
        nodeType: string;
        label?: string;
        parametersJson?: string;
      }>;
      edges: GeneratedWorkflowData["edges"];
    };

    // Transform parametersJson strings to parameters objects
    const workflow: GeneratedWorkflowData = {
      nodes: rawWorkflow.nodes.map((node) => ({
        id: node.id,
        nodeType: node.nodeType,
        label: node.label,
        parameters: node.parametersJson ? JSON.parse(node.parametersJson) : {},
      })),
      edges: rawWorkflow.edges,
    };

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
    (n) =>
      n.nodeType.startsWith("generator:") ||
      n.nodeType === "input:upload" ||
      n.nodeType.startsWith("text:")
  );
  if (!hasSource) {
    errors.push("Workflow has no source node (generator, input, or text)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
