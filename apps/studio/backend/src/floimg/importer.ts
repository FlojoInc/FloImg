/**
 * YAML Import - converts Pipeline format back to Studio graph (nodes + edges)
 *
 * This is the reverse of toPipeline() in executor.ts.
 * Takes a floimg Pipeline (from YAML) and converts it to StudioNode[] + StudioEdge[]
 * for display in the visual editor.
 */

import { parse as parseYaml } from "yaml";
import { nanoid } from "nanoid";
import type {
  StudioNode,
  StudioEdge,
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  VisionNodeData,
  TextNodeData,
} from "@teamflojo/floimg-studio-shared";

// Pipeline step types from floimg core
interface GenerateStep {
  kind: "generate";
  generator: string;
  params?: Record<string, unknown>;
  out: string;
}

interface TransformStep {
  kind: "transform";
  op: string;
  in: string;
  params?: Record<string, unknown>;
  out: string;
}

interface SaveStep {
  kind: "save";
  in: string;
  destination: string;
  provider?: string;
  out?: string;
}

interface VisionStep {
  kind: "vision";
  provider: string;
  in: string;
  params?: Record<string, unknown>;
  out: string;
}

interface TextStep {
  kind: "text";
  provider: string;
  in?: string;
  params?: Record<string, unknown>;
  out: string;
}

type PipelineStep = GenerateStep | TransformStep | SaveStep | VisionStep | TextStep;

interface Pipeline {
  name?: string;
  steps: PipelineStep[];
}

export interface ImportResult {
  nodes: StudioNode[];
  edges: StudioEdge[];
  name?: string;
}

export interface ImportError {
  message: string;
  line?: number;
  column?: number;
}

/**
 * Parse YAML string and convert to Studio graph
 */
export function fromYaml(yaml: string): ImportResult {
  // Parse YAML
  let pipeline: Pipeline;
  try {
    pipeline = parseYaml(yaml) as Pipeline;
  } catch (err) {
    const error = err as Error & { linePos?: { start?: { line?: number; col?: number } } };
    throw {
      message: `Invalid YAML: ${error.message}`,
      line: error.linePos?.start?.line,
      column: error.linePos?.start?.col,
    } as ImportError;
  }

  // Validate basic structure
  if (!pipeline || typeof pipeline !== "object") {
    throw { message: "YAML must be an object with a 'steps' array" } as ImportError;
  }

  if (!Array.isArray(pipeline.steps)) {
    throw { message: "Pipeline must have a 'steps' array" } as ImportError;
  }

  if (pipeline.steps.length === 0) {
    throw { message: "Pipeline must have at least one step" } as ImportError;
  }

  return fromPipeline(pipeline);
}

/**
 * Convert Pipeline to Studio graph (nodes + edges)
 */
export function fromPipeline(pipeline: Pipeline): ImportResult {
  const nodes: StudioNode[] = [];
  const edges: StudioEdge[] = [];

  // Map variable names to node IDs
  const varToNodeId = new Map<string, string>();

  // Map step index to node ID (for edge creation on steps without 'out')
  const stepToNodeId = new Map<number, string>();

  // Layout configuration
  const NODE_WIDTH = 280;
  const NODE_HEIGHT = 150;
  const HORIZONTAL_GAP = 100;
  const VERTICAL_GAP = 80;
  const START_X = 100;
  const START_Y = 100;

  // Track column positions for layout
  // We'll do a simple left-to-right layout based on dependencies
  const nodeColumns = new Map<string, number>();

  // First pass: create nodes and determine columns
  for (let i = 0; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i];
    const nodeId = nanoid(10);

    // Store the mapping from step index to node ID
    stepToNodeId.set(i, nodeId);

    // Determine column based on input dependency
    let column = 0;
    if ("in" in step && step.in) {
      const sourceNodeId = varToNodeId.get(step.in);
      if (sourceNodeId) {
        const sourceColumn = nodeColumns.get(sourceNodeId) || 0;
        column = sourceColumn + 1;
      }
    }

    // Create node based on step kind
    const node = createNodeFromStep(step, nodeId, column, i);
    if (!node) {
      throw { message: `Unknown step kind: ${(step as { kind: string }).kind}` } as ImportError;
    }

    nodes.push(node);
    nodeColumns.set(nodeId, column);

    // Map output variable to node ID
    if ("out" in step && step.out) {
      varToNodeId.set(step.out, nodeId);
    }
  }

  // Second pass: calculate positions based on columns
  const columnCounts = new Map<number, number>();
  for (const node of nodes) {
    const column = nodeColumns.get(node.id) || 0;
    const row = columnCounts.get(column) || 0;
    columnCounts.set(column, row + 1);

    node.position = {
      x: START_X + column * (NODE_WIDTH + HORIZONTAL_GAP),
      y: START_Y + row * (NODE_HEIGHT + VERTICAL_GAP),
    };
  }

  // Third pass: create edges based on input references
  for (let i = 0; i < pipeline.steps.length; i++) {
    const step = pipeline.steps[i];
    if ("in" in step && step.in) {
      const sourceNodeId = varToNodeId.get(step.in);
      const targetNodeId = stepToNodeId.get(i);

      if (sourceNodeId && targetNodeId) {
        edges.push({
          id: `e-${sourceNodeId}-${targetNodeId}`,
          source: sourceNodeId,
          target: targetNodeId,
        });
      }
    }
  }

  return {
    nodes,
    edges,
    name: pipeline.name,
  };
}

/**
 * Create a StudioNode from a pipeline step
 */
function createNodeFromStep(
  step: PipelineStep,
  nodeId: string,
  _column: number,
  _index: number
): StudioNode | null {
  // Default position (will be recalculated later)
  const position = { x: 0, y: 0 };

  switch (step.kind) {
    case "generate": {
      const data: GeneratorNodeData = {
        generatorName: step.generator,
        params: step.params || {},
      };
      return {
        id: nodeId,
        type: "generator",
        position,
        data,
      };
    }

    case "transform": {
      const data: TransformNodeData = {
        operation: step.op,
        params: step.params || {},
      };
      return {
        id: nodeId,
        type: "transform",
        position,
        data,
      };
    }

    case "save": {
      const data: SaveNodeData = {
        destination: step.destination,
        provider: step.provider as "filesystem" | "s3" | undefined,
      };
      return {
        id: nodeId,
        type: "save",
        position,
        data,
      };
    }

    case "vision": {
      const data: VisionNodeData = {
        providerName: step.provider,
        params: step.params || {},
      };
      return {
        id: nodeId,
        type: "vision",
        position,
        data,
      };
    }

    case "text": {
      const data: TextNodeData = {
        providerName: step.provider,
        params: step.params || {},
      };
      return {
        id: nodeId,
        type: "text",
        position,
        data,
      };
    }

    default:
      return null;
  }
}

/**
 * Validate that a YAML string is a valid pipeline
 * Returns errors if invalid, or empty array if valid
 */
export function validateYaml(yaml: string): ImportError[] {
  const errors: ImportError[] = [];

  try {
    const result = fromYaml(yaml);

    // Additional validation
    if (result.nodes.length === 0) {
      errors.push({ message: "Pipeline has no valid steps" });
    }

    // Check for orphan nodes (nodes with missing input references)
    const nodeIds = new Set(result.nodes.map((n) => n.id));
    for (const edge of result.edges) {
      if (!nodeIds.has(edge.source)) {
        errors.push({ message: `Edge references unknown source node: ${edge.source}` });
      }
      if (!nodeIds.has(edge.target)) {
        errors.push({ message: `Edge references unknown target node: ${edge.target}` });
      }
    }
  } catch (err) {
    if ((err as ImportError).message) {
      errors.push(err as ImportError);
    } else {
      errors.push({ message: String(err) });
    }
  }

  return errors;
}
