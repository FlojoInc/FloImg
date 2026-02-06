/**
 * Validation utilities for FloImg Studio
 *
 * Maps SDK validation errors to Studio node IDs for UI highlighting.
 * This enables the visual editor to show which nodes have issues.
 */

import type {
  PipelineStep,
  StudioNode,
  StudioEdge,
  InputNodeData,
  TransformNodeData,
} from "./index.js";

/**
 * SDK ValidationIssue shape (from @teamflojo/floimg)
 * We define it here to avoid runtime dependency on SDK in shared package.
 */
export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  stepIndex?: number;
  stepKind?: string;
  providerName?: string;
  parameterName?: string;
  /** Actionable guidance for fixing this issue */
  suggestedFix?: string;
}

/**
 * Quick fix metadata for automated resolution
 */
export interface QuickFix {
  /** Type of quick fix action */
  type: "ADD_CONVERT_NODE";
  /** Label for the quick fix button */
  label: string;
  /** Target MIME type for conversion */
  targetFormat?: string;
  /** Node to insert the convert node before */
  targetNodeId?: string;
  /** Source node providing the input */
  sourceNodeId?: string;
}

/**
 * Studio-specific validation issue with node ID for UI highlighting
 */
export interface StudioValidationIssue extends ValidationIssue {
  /** Node ID in the visual editor (for highlighting) */
  nodeId?: string;
  /** Variable name from the step */
  varName?: string;
  /** Quick fix action that can automatically resolve this issue */
  quickFix?: QuickFix;
}

/**
 * Map SDK validation errors to Studio node IDs
 *
 * Takes ValidationIssues from the SDK (which reference stepIndex) and maps
 * them to Studio node IDs using the nodeToVar mapping from pipeline conversion.
 *
 * @param issues - Validation issues from SDK
 * @param nodeToVar - Map from node IDs to variable names (from nodesToPipeline)
 * @param steps - Pipeline steps (to get variable names by index)
 * @returns Issues with nodeId added for UI highlighting
 *
 * @example
 * ```typescript
 * const { pipeline, nodeToVar } = nodesToPipeline(nodes, edges);
 * const validation = validatePipelineFull(pipeline, capabilities);
 * if (!validation.valid) {
 *   const studioIssues = mapValidationToNodes(validation.errors, nodeToVar, pipeline.steps);
 *   return { error: "Validation failed", issues: studioIssues };
 * }
 * ```
 */
export function mapValidationToNodes(
  issues: ValidationIssue[],
  nodeToVar: Map<string, string>,
  steps: PipelineStep[]
): StudioValidationIssue[] {
  // Build reverse map: varName -> nodeId
  const varToNode = new Map<string, string>();
  for (const [nodeId, varName] of nodeToVar) {
    varToNode.set(varName, nodeId);
  }

  return issues.map((issue) => {
    const studioIssue: StudioValidationIssue = { ...issue };

    // Try to find the node ID from the step at stepIndex
    if (issue.stepIndex !== undefined && steps[issue.stepIndex]) {
      const step = steps[issue.stepIndex];
      const varName = getStepOutput(step);

      if (varName) {
        studioIssue.varName = varName;
        const nodeId = varToNode.get(varName);
        if (nodeId) {
          studioIssue.nodeId = nodeId;
        }
      }
    }

    return studioIssue;
  });
}

/**
 * Get the output variable name from a pipeline step
 */
function getStepOutput(step: PipelineStep): string | undefined {
  if (step.kind === "save") {
    return step.out; // Optional output
  }
  if (step.kind === "fan-out") {
    // Fan-out has multiple outputs, return the first for error mapping
    return step.out[0];
  }
  return step.out;
}

/**
 * Format validation issues for API response
 */
export function formatValidationResponse(issues: StudioValidationIssue[]): {
  message: string;
  issues: StudioValidationIssue[];
} {
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  let message = `Validation failed with ${errorCount} error(s)`;
  if (warningCount > 0) {
    message += ` and ${warningCount} warning(s)`;
  }

  return { message, issues };
}

// =============================================================================
// Format Validation (Studio-level)
// =============================================================================

/**
 * Transform schema with format requirements (subset of full schema)
 * Used for format validation without importing full SDK types
 */
export interface TransformFormatRequirements {
  name: string;
  acceptedInputFormats?: string[];
  inputFormatError?: string;
}

/**
 * Validate image format compatibility in a workflow
 *
 * Checks that input formats match transform operation requirements.
 * For example, OpenAI edit/variations require PNG format.
 *
 * @param nodes - Workflow nodes
 * @param edges - Connections between nodes
 * @param transformSchemas - Map of transform name to format requirements
 * @returns Validation issues for format mismatches
 */
export function validateInputFormats(
  nodes: StudioNode[],
  edges: StudioEdge[],
  transformSchemas: Map<string, TransformFormatRequirements>
): StudioValidationIssue[] {
  const issues: StudioValidationIssue[] = [];

  // Build map of node ID to node for quick lookup
  const nodeMap = new Map<string, StudioNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  // Track known MIME types flowing through the graph
  // Key: node ID, Value: MIME type (if known)
  const knownMimeTypes = new Map<string, string>();

  // Initialize known MIME types from input nodes
  for (const node of nodes) {
    if (node.type === "input") {
      const data = node.data as InputNodeData;
      if (data.mime) {
        knownMimeTypes.set(node.id, data.mime);
      }
    }
  }

  // Process nodes to propagate MIME types and check format requirements
  // Note: This is a simplified single-pass. For complex graphs with multiple
  // paths, a topological traversal would be more accurate.
  for (const node of nodes) {
    if (node.type !== "transform") continue;

    const data = node.data as TransformNodeData;
    const schema = transformSchemas.get(data.operation);

    // Find the input edge (image input)
    const inputEdge = edges.find(
      (e) => e.target === node.id && (e.targetHandle === "image" || !e.targetHandle)
    );

    if (!inputEdge) continue;

    const sourceNode = nodeMap.get(inputEdge.source);
    if (!sourceNode) continue;

    // Get the MIME type of the source
    let sourceMime = knownMimeTypes.get(inputEdge.source);

    // If source is a transform with convert operation, track the output format
    if (sourceNode.type === "transform") {
      const sourceData = sourceNode.data as TransformNodeData;
      if (sourceData.operation === "convert" && sourceData.params?.to) {
        sourceMime = sourceData.params.to as string;
        knownMimeTypes.set(sourceNode.id, sourceMime);
      }
    }

    // Check format requirements
    if (schema?.acceptedInputFormats && sourceMime) {
      const isAccepted = schema.acceptedInputFormats.includes(sourceMime);

      if (!isAccepted) {
        const acceptedList = schema.acceptedInputFormats.join(", ");
        const errorMessage =
          schema.inputFormatError ||
          `This operation requires ${acceptedList} format, but input is ${sourceMime}`;

        issues.push({
          severity: "error",
          code: "INCOMPATIBLE_INPUT_FORMAT",
          message: errorMessage,
          nodeId: node.id,
          providerName: data.operation,
          suggestedFix: `Add a Convert node to change the format to ${schema.acceptedInputFormats[0]}`,
          quickFix: {
            type: "ADD_CONVERT_NODE",
            label: "Add Convert Node",
            targetFormat: schema.acceptedInputFormats[0],
            targetNodeId: node.id,
            sourceNodeId: inputEdge.source,
          },
        });
      }
    }

    // Propagate MIME type if this is a convert operation
    if (data.operation === "convert" && data.params?.to) {
      knownMimeTypes.set(node.id, data.params.to as string);
    } else if (sourceMime) {
      // Other transforms preserve MIME type
      knownMimeTypes.set(node.id, sourceMime);
    }
  }

  return issues;
}
