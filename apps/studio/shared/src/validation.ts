/**
 * Validation utilities for FloImg Studio
 *
 * Maps SDK validation errors to Studio node IDs for UI highlighting.
 * This enables the visual editor to show which nodes have issues.
 */

import type { PipelineStep } from "./index.js";

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
 * Studio-specific validation issue with node ID for UI highlighting
 */
export interface StudioValidationIssue extends ValidationIssue {
  /** Node ID in the visual editor (for highlighting) */
  nodeId?: string;
  /** Variable name from the step */
  varName?: string;
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
