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
  StudioNode,
  StudioEdge,
  GeneratorNodeData,
  TransformNodeData,
  VisionNodeData,
  TextNodeData,
  FanOutNodeData,
  CollectNodeData,
  RouterNodeData,
  StudioNodeType,
} from "@teamflojo/floimg-studio-shared";
import { nodesToPipeline, mapValidationToNodes } from "@teamflojo/floimg-studio-shared";
import { validatePipelineFull } from "@teamflojo/floimg";
import {
  getGenerators,
  getTransforms,
  getInputNodes,
  getTextProviders,
  getVisionProviders,
  getFlowControlNodes,
} from "../floimg/registry.js";
import { getCachedCapabilities } from "../floimg/setup.js";

// Model to use for workflow generation
const MODEL_ID = "gemini-3-pro-preview";

/**
 * Convert GeneratedWorkflowData to Studio format for Pipeline validation
 *
 * The workflow generator uses a simplified format (GeneratedNode/GeneratedEdge).
 * To validate as Pipeline, we convert to StudioNode/StudioEdge format first,
 * then use nodesToPipeline() which handles all the edge cases.
 *
 * @exported for testing
 */
export function generatedToStudioFormat(workflow: GeneratedWorkflowData): {
  nodes: StudioNode[];
  edges: StudioEdge[];
} {
  const nodes: StudioNode[] = workflow.nodes.map((node, index) => {
    // Parse nodeType to extract type and provider info
    // Format: "generator:openai", "transform:sharp:resize", "text:gemini-text", etc.
    const parts = node.nodeType.split(":");
    const typePrefix = parts[0];

    // Map nodeType prefix to StudioNodeType
    let studioType: StudioNodeType;
    switch (typePrefix) {
      case "generator":
        studioType = "generator";
        break;
      case "transform":
        studioType = "transform";
        break;
      case "text":
        studioType = "text";
        break;
      case "vision":
        studioType = "vision";
        break;
      case "input":
        studioType = "input";
        break;
      case "flow":
        // flow:fanout, flow:collect, flow:router
        studioType = parts[1] as StudioNodeType;
        break;
      default:
        studioType = "generator"; // Default fallback
    }

    // Build node data based on type
    let data: StudioNode["data"];
    switch (studioType) {
      case "generator":
        data = {
          generatorName: parts.slice(1).join(":"), // e.g., "gemini-generate" from "generator:gemini-generate"
          params: node.parameters,
          isAI: true,
        } as GeneratorNodeData;
        break;
      case "transform":
        // transform:sharp:resize -> providerName="sharp", operation="resize"
        data = {
          providerName: parts[1],
          operation: parts[2] || parts[1],
          params: node.parameters,
          isAI: parts[1]?.includes("gemini") || parts[1]?.includes("openai"),
        } as TransformNodeData;
        break;
      case "text":
        data = {
          providerName: parts[1], // e.g., "gemini-text"
          params: node.parameters,
        } as TextNodeData;
        break;
      case "vision":
        data = {
          providerName: parts[1], // e.g., "gemini-vision"
          params: node.parameters,
        } as VisionNodeData;
        break;
      case "fanout":
        data = {
          mode: (node.parameters?.mode as "array" | "count") || "count",
          count: (node.parameters?.count as number) || 3,
          arrayProperty: node.parameters?.arrayProperty as string,
        } as FanOutNodeData;
        break;
      case "collect":
        data = {
          expectedInputs: (node.parameters?.expectedInputs as number) || 3,
          waitMode: (node.parameters?.waitMode as "all" | "available") || "all",
        } as CollectNodeData;
        break;
      case "router":
        data = {
          selectionProperty: (node.parameters?.selectionProperty as string) || "best_index",
          selectionType: (node.parameters?.selectionType as "index" | "value") || "index",
          outputCount: (node.parameters?.outputCount as number) || 1,
          contextProperty: node.parameters?.contextProperty as string,
        } as RouterNodeData;
        break;
      default:
        data = {
          generatorName: parts.slice(1).join(":"),
          params: node.parameters,
        } as GeneratorNodeData;
    }

    return {
      id: node.id,
      type: studioType,
      position: { x: index * 200, y: 0 }, // Position doesn't affect validation
      data,
    };
  });

  const edges: StudioEdge[] = workflow.edges.map((edge, index) => ({
    id: `edge_${index}`,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
  }));

  return { nodes, edges };
}

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
  /** Number of generation attempts made (1 = first try succeeded) */
  attempts?: number;
  /** Validation errors from the final attempt (if any) */
  validationErrors?: ValidationError[];
}

/** Maximum number of retry attempts for validation failures */
const MAX_GENERATION_ATTEMPTS = 3;

/**
 * Generate a workflow from natural language using Gemini 3 Pro
 *
 * Implements a validation-retry loop:
 * 1. Generate initial workflow from prompt
 * 2. Validate the workflow (structural + semantic)
 * 3. If validation fails, send repair prompt to LLM with specific fix instructions
 * 4. Repeat up to MAX_GENERATION_ATTEMPTS times
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

  const ai = new GoogleGenAI({ apiKey });
  const availableNodes = getAllAvailableNodes();
  const systemPrompt = buildSystemPrompt(availableNodes);

  let lastWorkflow: GeneratedWorkflowData | undefined;
  let lastValidationErrors: ValidationError[] = [];
  let currentPrompt = prompt;
  let attempt = 0;

  while (attempt < MAX_GENERATION_ATTEMPTS) {
    attempt++;

    try {
      // Build contents with history (only on first attempt)
      const contents =
        attempt === 1
          ? [...formatHistory(history), { role: "user" as const, parts: [{ text: currentPrompt }] }]
          : [
              // For repair attempts, include the original history plus the repair prompt
              ...formatHistory(history),
              { role: "user" as const, parts: [{ text: prompt }] },
              {
                role: "model" as const,
                parts: [{ text: `Generated workflow: ${JSON.stringify(lastWorkflow)}` }],
              },
              { role: "user" as const, parts: [{ text: currentPrompt }] },
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
          attempts: attempt,
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

      lastWorkflow = workflow;

      // Validate the workflow - Studio format validation
      const validation = validateWorkflow(workflow, availableNodes);

      if (validation.valid) {
        // Studio validation passed - now validate as Pipeline (End-to-End Consistency)
        // This catches semantic issues that only appear in execution format
        try {
          const { nodes: studioNodes, edges: studioEdges } = generatedToStudioFormat(workflow);
          const { pipeline, nodeToVar } = nodesToPipeline(studioNodes, studioEdges);
          const capabilities = getCachedCapabilities();
          const pipelineValidation = validatePipelineFull(pipeline, capabilities);

          if (!pipelineValidation.valid) {
            // Pipeline validation failed - map errors back to nodes and trigger repair
            const studioIssues = mapValidationToNodes(
              pipelineValidation.errors,
              nodeToVar,
              pipeline.steps
            );

            // Convert to ValidationError format for repair prompt
            lastValidationErrors = studioIssues.map((issue) => ({
              nodeId: issue.nodeId || "unknown",
              nodeType: issue.stepKind || "unknown",
              error: issue.message,
              fix: getPipelineErrorFix(issue.code),
            }));

            console.log(
              `Pipeline validation failed on attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}:`,
              pipelineValidation.errors.map((e) => e.message)
            );

            if (attempt < MAX_GENERATION_ATTEMPTS) {
              currentPrompt = buildRepairPrompt(prompt, workflow, lastValidationErrors);
              console.log(`Sending Pipeline repair prompt for attempt ${attempt + 1}`);
            }
            continue; // Try again
          }
        } catch (conversionError) {
          // nodesToPipeline() can throw on structural issues (e.g., missing connections)
          const errorMsg =
            conversionError instanceof Error ? conversionError.message : String(conversionError);
          console.log(`Pipeline conversion failed on attempt ${attempt}: ${errorMsg}`);

          lastValidationErrors = [
            {
              nodeId: "workflow",
              nodeType: "structure",
              error: errorMsg,
              fix: "Ensure all nodes are properly connected with edges",
            },
          ];

          if (attempt < MAX_GENERATION_ATTEMPTS) {
            currentPrompt = buildRepairPrompt(prompt, workflow, lastValidationErrors);
            console.log(`Sending structure repair prompt for attempt ${attempt + 1}`);
          }
          continue; // Try again
        }

        // Both validations passed!
        console.log(`Workflow generation succeeded on attempt ${attempt}`);
        return {
          success: true,
          workflow,
          message:
            attempt === 1
              ? `Created a workflow with ${workflow.nodes.length} nodes`
              : `Created a workflow with ${workflow.nodes.length} nodes (fixed after ${attempt} attempts)`,
          attempts: attempt,
        };
      }

      // Studio format validation failed
      lastValidationErrors = validation.validationErrors;
      console.log(
        `Workflow validation failed on attempt ${attempt}/${MAX_GENERATION_ATTEMPTS}:`,
        validation.errors
      );

      if (attempt < MAX_GENERATION_ATTEMPTS) {
        // Build repair prompt for next attempt
        currentPrompt = buildRepairPrompt(prompt, workflow, validation.validationErrors);
        console.log(`Sending repair prompt for attempt ${attempt + 1}`);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Generation attempt ${attempt} failed:`, errorMessage);

      // Don't retry on parse errors or API errors
      return {
        success: false,
        message: "Failed to generate workflow",
        error: errorMessage,
        attempts: attempt,
      };
    }
  }

  // All attempts exhausted - return the last workflow with validation errors
  return {
    success: false,
    workflow: lastWorkflow,
    message: `Generated workflow has issues after ${attempt} attempts: ${lastValidationErrors.map((e) => e.error).join(", ")}`,
    error: lastValidationErrors.map((e) => `${e.nodeId}: ${e.error} - ${e.fix}`).join("; "),
    attempts: attempt,
    validationErrors: lastValidationErrors,
  };
}

/**
 * Validation error with actionable fix suggestion
 */
interface ValidationError {
  nodeId: string;
  nodeType: string;
  error: string;
  fix: string;
}

/**
 * Get fix suggestion for Pipeline validation error codes
 * Maps SDK validation codes to actionable repair instructions
 */
function getPipelineErrorFix(code: string): string {
  const fixes: Record<string, string> = {
    MISSING_PROMPT_SOURCE:
      'Either set a static "prompt" parameter OR connect a text node to the "text" input handle with an edge (sourceHandle: "text", targetHandle: "text")',
    MISSING_IMAGE_INPUT: "Connect a generator or another transform to this node's image input",
    MISSING_ARRAY_PROPERTY:
      'Set "arrayProperty" to the name of the array property in the upstream text node\'s JSON output (e.g., "prompts" for {"prompts": ["a", "b", "c"]})',
    UNDEFINED_VARIABLE:
      "Ensure the referenced variable is defined by a previous step in the workflow",
    UNDEFINED_COLLECT_INPUT:
      "Ensure all input nodes connected to collect are defined earlier in the workflow",
    UNDEFINED_ROUTER_INPUT: "Ensure both candidates and selection inputs are connected and defined",
    MISSING_REQUIRED_PARAM: "Add the required parameter with an appropriate value",
    UNKNOWN_GENERATOR: "Use a valid generator name from the available generators list",
    UNKNOWN_TRANSFORM: "Use a valid transform operation from the available transforms list",
    INVALID_PARAM_TYPE: "Ensure the parameter value matches the expected type",
  };

  return fixes[code] || "Review the node configuration and ensure all connections are valid";
}

/**
 * Validate a generated workflow - both structural and semantic checks
 *
 * Semantic validation ensures that:
 * - Generators without static prompts have incoming text edges
 * - AI transforms have proper prompt sources
 * - Fan-out in array mode has arrayProperty configured
 * - Edge handles match expected node inputs
 */
function validateWorkflow(
  workflow: GeneratedWorkflowData,
  availableNodes: NodeDefinition[]
): { valid: boolean; errors: string[]; validationErrors: ValidationError[] } {
  const errors: string[] = [];
  const validationErrors: ValidationError[] = [];
  const nodeIds = new Set(workflow.nodes.map((n) => n.id));
  const availableNodeTypes = new Set(availableNodes.map((n) => n.id));
  const availableNodeMap = new Map(availableNodes.map((n) => [n.id, n]));

  // Build edge lookup: target node ID -> incoming edges
  const incomingEdges = new Map<string, GeneratedWorkflowData["edges"]>();
  for (const edge of workflow.edges) {
    const existing = incomingEdges.get(edge.target) || [];
    existing.push(edge);
    incomingEdges.set(edge.target, existing);
  }

  // Check nodes - structural
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

  // Check edges - structural
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

  // Semantic validation - check required parameters and edge connections
  for (const node of workflow.nodes) {
    const nodeDef = availableNodeMap.get(node.nodeType);
    if (!nodeDef) continue;

    const nodeEdges = incomingEdges.get(node.id) || [];
    const hasTextEdge = nodeEdges.some((e) => e.targetHandle === "text");
    const hasImageEdge = nodeEdges.some(
      (e) => !e.targetHandle || e.targetHandle === "image" || e.targetHandle === "input"
    );

    // Check generators
    if (node.nodeType.startsWith("generator:")) {
      const prompt = node.parameters?.prompt;
      const promptEmpty = prompt === undefined || prompt === null || prompt === "";

      // AI generators need either a static prompt OR an incoming text edge
      if (nodeDef.params.required?.includes("prompt")) {
        if (promptEmpty && !hasTextEdge) {
          const errorMsg = `Generator "${node.id}" (${node.nodeType}) requires a prompt but has no prompt parameter and no incoming text edge`;
          errors.push(errorMsg);
          validationErrors.push({
            nodeId: node.id,
            nodeType: node.nodeType,
            error: "Missing prompt source",
            fix: `Either set a static "prompt" parameter OR connect a text node to the "text" input handle`,
          });
        }
      }
    }

    // Check transforms - AI transforms need prompts too
    if (node.nodeType.startsWith("transform:")) {
      // Check if this is an AI transform that requires a prompt
      const isAITransform =
        node.nodeType.includes("gemini") ||
        node.nodeType.includes("openai") ||
        node.nodeType.includes("stability");

      if (isAITransform && nodeDef.params.required?.includes("prompt")) {
        const prompt = node.parameters?.prompt;
        const promptEmpty = prompt === undefined || prompt === null || prompt === "";

        if (promptEmpty && !hasTextEdge) {
          const errorMsg = `AI Transform "${node.id}" (${node.nodeType}) requires a prompt but has no prompt parameter and no incoming text edge`;
          errors.push(errorMsg);
          validationErrors.push({
            nodeId: node.id,
            nodeType: node.nodeType,
            error: "Missing prompt source",
            fix: `Either set a static "prompt" parameter OR connect a text node to the "text" input handle`,
          });
        }
      }

      // Transforms need an image input (unless they're the first node somehow)
      if (!hasImageEdge && nodeDef.params.required?.includes("in")) {
        const errorMsg = `Transform "${node.id}" (${node.nodeType}) has no incoming image connection`;
        errors.push(errorMsg);
        validationErrors.push({
          nodeId: node.id,
          nodeType: node.nodeType,
          error: "Missing image input",
          fix: `Connect a generator or another transform to this node's image input`,
        });
      }
    }

    // Check flow:fanout nodes
    if (node.nodeType === "flow:fanout") {
      const mode = node.parameters?.mode;
      const arrayProperty = node.parameters?.arrayProperty;

      if (mode === "array" && !arrayProperty) {
        const errorMsg = `Fan-out node "${node.id}" is in array mode but has no arrayProperty specified`;
        errors.push(errorMsg);
        validationErrors.push({
          nodeId: node.id,
          nodeType: node.nodeType,
          error: "Missing arrayProperty for array mode",
          fix: `Set "arrayProperty" to the name of the array property in the upstream text node's JSON output (e.g., "prompts" for {"prompts": ["a", "b", "c"]})`,
        });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    validationErrors,
  };
}

/**
 * Build a repair prompt from validation errors
 * This gives the LLM specific instructions on how to fix the workflow
 */
function buildRepairPrompt(
  originalPrompt: string,
  workflow: GeneratedWorkflowData,
  validationErrors: ValidationError[]
): string {
  const errorDescriptions = validationErrors
    .map((e, i) => `${i + 1}. Node "${e.nodeId}" (${e.nodeType}): ${e.error}\n   Fix: ${e.fix}`)
    .join("\n");

  return `The workflow you generated has validation errors that need to be fixed.

Original request: "${originalPrompt}"

Current workflow (needs fixes):
${JSON.stringify(workflow, null, 2)}

Validation errors:
${errorDescriptions}

Please generate a corrected workflow that fixes ALL the validation errors above.
Remember:
- Generators that receive dynamic prompts from text nodes should have an empty "prompt": "" parameter AND an edge with targetHandle: "text"
- The text node must have sourceHandle: "text" (or "output.{property}" for structured output)
- Fan-out in array mode needs arrayProperty set to match the text node's JSON schema`;
}
