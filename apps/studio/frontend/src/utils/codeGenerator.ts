import type { Node, Edge } from "reactflow";
import type {
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  InputNodeData,
  VisionNodeData,
  TextNodeData,
  FanOutNodeData,
  CollectNodeData,
  RouterNodeData,
} from "@teamflojo/floimg-studio-shared";

type NodeData =
  | GeneratorNodeData
  | TransformNodeData
  | SaveNodeData
  | InputNodeData
  | VisionNodeData
  | TextNodeData
  | FanOutNodeData
  | CollectNodeData
  | RouterNodeData;

/**
 * Topologically sort nodes based on edges (dependencies)
 * Returns nodes in execution order
 */
function topologicalSort(nodes: Node<NodeData>[], edges: Edge[]): Node<NodeData>[] {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  // Initialize
  for (const node of nodes) {
    inDegree.set(node.id, 0);
    adjacency.set(node.id, []);
  }

  // Build graph
  for (const edge of edges) {
    const targets = adjacency.get(edge.source) || [];
    targets.push(edge.target);
    adjacency.set(edge.source, targets);
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
  }

  // Find nodes with no incoming edges (sources)
  const queue: string[] = [];
  for (const [id, degree] of inDegree) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  // Process in order
  const sorted: Node<NodeData>[] = [];
  while (queue.length > 0) {
    const id = queue.shift()!;
    const node = nodeMap.get(id);
    if (node) {
      sorted.push(node);
    }

    const neighbors = adjacency.get(id) || [];
    for (const neighbor of neighbors) {
      const newDegree = (inDegree.get(neighbor) || 1) - 1;
      inDegree.set(neighbor, newDegree);
      if (newDegree === 0) {
        queue.push(neighbor);
      }
    }
  }

  return sorted;
}

/**
 * Get the variable name for a node
 */
function getNodeVarName(node: Node<NodeData>): string {
  const type = node.type || "node";
  const suffix = node.id.replace(/[^a-zA-Z0-9]/g, "_");
  return `${type}_${suffix}`;
}

/**
 * Stringify a value for code generation
 */
function stringify(value: unknown): string {
  if (typeof value === "string") {
    // Escape special characters and use template literal if multiline
    if (value.includes("\n")) {
      return "`" + value.replace(/`/g, "\\`").replace(/\$/g, "\\$") + "`";
    }
    return JSON.stringify(value);
  }
  return JSON.stringify(value, null, 2);
}

/**
 * Generate JavaScript code for a single node
 */
function generateNodeCode(
  node: Node<NodeData>,
  edges: Edge[],
  nodeVarNames: Map<string, string>
): { code: string; imports: string[] } {
  const varName = nodeVarNames.get(node.id)!;
  const imports: string[] = [];

  // Find input node (source of edge pointing to this node)
  const inputEdge = edges.find((e) => e.target === node.id);
  const inputVarName = inputEdge ? nodeVarNames.get(inputEdge.source) : null;

  switch (node.type) {
    case "generator": {
      const data = node.data as GeneratorNodeData;
      imports.push(data.generatorName);

      const params = data.params || {};
      const paramStr = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `  ${k}: ${stringify(v)}`)
        .join(",\n");

      return {
        code: `// Generate image using ${data.generatorName}
const ${varName} = await ${data.generatorName}({
${paramStr}
});`,
        imports,
      };
    }

    case "input": {
      return {
        code: `// Load input image
const ${varName} = await flo.loadImage("./input.png");`,
        imports: [],
      };
    }

    case "transform": {
      const data = node.data as TransformNodeData;
      const params = data.params || {};
      const paramStr = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `${k}: ${stringify(v)}`)
        .join(", ");

      const input = inputVarName || "image";
      return {
        code: `// Apply ${data.operation} transform
const ${varName} = await flo.transform(${input}, "${data.operation}"${paramStr ? `, { ${paramStr} }` : ""});`,
        imports: [],
      };
    }

    case "vision": {
      const data = node.data as VisionNodeData;
      imports.push(data.providerName);

      const params = data.params || {};
      const input = inputVarName || "image";
      const paramStr = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `  ${k}: ${stringify(v)}`)
        .join(",\n");

      return {
        code: `// Analyze image with ${data.providerName}
const ${varName} = await ${data.providerName}.analyze(${input}, {
${paramStr}
});`,
        imports,
      };
    }

    case "text": {
      const data = node.data as TextNodeData;
      imports.push(data.providerName);

      const params = data.params || {};
      const paramStr = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => `  ${k}: ${stringify(v)}`)
        .join(",\n");

      return {
        code: `// Generate text with ${data.providerName}
const ${varName} = await ${data.providerName}.generate({
${paramStr}
});`,
        imports,
      };
    }

    case "save": {
      const data = node.data as SaveNodeData;
      const input = inputVarName || "result";
      return {
        code: `// Save result
await flo.save(${input}, ${stringify(data.destination)});`,
        imports: [],
      };
    }

    default:
      return {
        code: `// Unknown node type: ${node.type}`,
        imports: [],
      };
  }
}

/**
 * Generate JavaScript code from workflow nodes and edges
 */
export function generateJavaScript(nodes: Node<NodeData>[], edges: Edge[]): string {
  if (nodes.length === 0) {
    return `// Empty workflow
// Add nodes to your canvas to generate code`;
  }

  // Sort nodes topologically
  const sortedNodes = topologicalSort(nodes, edges);

  // Generate variable names
  const nodeVarNames = new Map<string, string>();
  for (const node of sortedNodes) {
    nodeVarNames.set(node.id, getNodeVarName(node));
  }

  // Generate code for each node
  const allImports = new Set<string>();
  const codeBlocks: string[] = [];

  for (const node of sortedNodes) {
    const { code, imports } = generateNodeCode(node, edges, nodeVarNames);
    codeBlocks.push(code);
    for (const imp of imports) {
      allImports.add(imp);
    }
  }

  // Build final code
  const importLines: string[] = [];
  if (allImports.size > 0) {
    importLines.push(`import { ${Array.from(allImports).join(", ")} } from "@teamflojo/floimg";`);
  }
  importLines.push(`import * as flo from "@teamflojo/floimg";`);

  const header = `/**
 * FloImg Workflow
 * Generated by FloImg Studio
 * https://floimg.com
 */

`;

  const mainCode = `
async function runWorkflow() {
${codeBlocks
  .map((block) =>
    block
      .split("\n")
      .map((line) => "  " + line)
      .join("\n")
  )
  .join("\n\n")}
}

// Run the workflow
runWorkflow().catch(console.error);
`;

  return header + importLines.join("\n") + "\n" + mainCode;
}
