# Iterative Workflow Architecture

## Overview

This document describes the architecture for AI-driven iterative workflows in FloImg Studio. The system enables workflows that generate multiple variations, have AI analyze and select the best output, and refine iteratively with preserved context.

## New Node Types

### 1. Fan-Out Node

**Purpose**: Distribute execution across N parallel branches based on array input.

```typescript
export interface FanOutNodeData {
  /** How to fan out: "array" (one per item) or "count" (N copies) */
  mode: "array" | "count";
  /** For count mode: number of parallel executions */
  count?: number;
  /** For array mode: which array property to iterate over */
  arrayProperty?: string;
}
```

**Execution Behavior**:

- **Array mode**: Receives an array (e.g., 3 prompts from a text node), spawns one downstream execution per item
- **Count mode**: Receives a single input, spawns N copies of it downstream

**Visual Representation**:

- Single input handle (accepts array or single value)
- Multiple output handles labeled `out[0]`, `out[1]`, `out[2]`, etc.
- Canvas shows "fan" icon with count indicator

**Data Flow**:

```
[text node] ─── { prompts: ["A", "B", "C"] } ───► [Fan-Out (array: "prompts")]
                                                       │
                                                       ├── out[0]: "A"
                                                       ├── out[1]: "B"
                                                       └── out[2]: "C"
```

### 2. Collect Node

**Purpose**: Gather outputs from parallel branches into a single array.

```typescript
export interface CollectNodeData {
  /** How many inputs to expect (helps with canvas layout) */
  expectedInputs?: number;
  /** Whether to wait for all inputs or proceed with available */
  waitMode: "all" | "available";
}
```

**Execution Behavior**:

- Waits for all (or configured number of) inputs to arrive
- Bundles them into an array in order received
- Handles failures gracefully (null entries for failed branches)

**Visual Representation**:

- Multiple input handles labeled `in[0]`, `in[1]`, `in[2]`, etc.
- Single output handle
- Canvas shows "collect" icon with count indicator

**Data Flow**:

```
[generator] ─── img1 ───┐
[generator] ─── img2 ───┼──► [Collect] ─── [img1, img2, img3] ───►
[generator] ─── img3 ───┘
```

### 3. Router Node

**Purpose**: Route inputs based on a selection criterion (typically from AI analysis).

```typescript
export interface RouterNodeData {
  /** The property name containing the selection (e.g., "winner") */
  selectionProperty: string;
  /** What type of selection: "index" (0-based) or "value" (match) */
  selectionType: "index" | "value";
  /** How many outputs to route (1 = single winner, N = top N) */
  outputCount: number;
  /** Optional: property containing refinement context */
  contextProperty?: string;
}
```

**Execution Behavior**:

- Receives array of candidates + selection data (e.g., from vision analysis)
- Routes selected item(s) to output
- Optionally passes through refinement context

**Visual Representation**:

- Two input handles: `candidates` (array), `selection` (data with selection criteria)
- Output handle(s): `winner` (or `winner[0]`, `winner[1]` for multi-select)
- Optional: `context` output for refinement suggestions

**Data Flow**:

```
[Collect] ─── [img1, img2, img3] ───┐
                                     ├──► [Router] ─── img2 ───► [refine]
[vision] ─── { winner: 1, ... } ────┘            └── "add more contrast" ──►
```

## Type System Updates

### StudioNodeType Extension

```typescript
export type StudioNodeType =
  | "generator"
  | "transform"
  | "save"
  | "input"
  | "vision"
  | "text"
  // New iterative workflow types
  | "fanout"
  | "collect"
  | "router";
```

### Data Type Extension

```typescript
export type StudioNodeData =
  | GeneratorNodeData
  | TransformNodeData
  | SaveNodeData
  | InputNodeData
  | VisionNodeData
  | TextNodeData
  // New types
  | FanOutNodeData
  | CollectNodeData
  | RouterNodeData;
```

## Variable System Extension

Current system stores single values:

```typescript
const variables = new Map<string, ImageBlob | DataBlob | SaveResult>();
```

Extended to support arrays:

```typescript
type VariableValue = ImageBlob | DataBlob | SaveResult | VariableValue[];

const variables = new Map<string, VariableValue>();
```

### Array Operations

```typescript
// Check if value is array
function isArrayValue(value: VariableValue): value is VariableValue[] {
  return Array.isArray(value);
}

// Get array item by index
function getArrayItem(value: VariableValue, index: number): VariableValue | undefined {
  if (isArrayValue(value)) {
    return value[index];
  }
  return index === 0 ? value : undefined;
}
```

## Executor Changes

### Wave Computation with Branching

The existing wave-based execution model extends naturally to fan-out/collect:

```typescript
interface ExecutionBranch {
  id: string; // e.g., "branch_0", "branch_1"
  sourceNodeId: string; // Fan-out node that created this branch
  index: number; // Position in fan-out (0, 1, 2...)
  variables: Map<string, VariableValue>; // Branch-local variables
}

interface ExecutionContext {
  globalVariables: Map<string, VariableValue>;
  branches: ExecutionBranch[];
  pendingCollects: Map<
    string,
    {
      nodeId: string;
      received: Map<number, VariableValue>;
      expected: number;
    }
  >;
}
```

### Execution Flow

1. **Pre-execution phase**: Identify fan-out nodes and their downstream subgraphs
2. **Fan-out execution**: When encountering a fan-out node:
   - Extract array items (or generate N copies)
   - Create N execution branches
   - Each branch gets its own variable context
   - Execute downstream nodes in parallel (respecting concurrency limits)
3. **Collect execution**: When all expected inputs arrive:
   - Bundle into array
   - Continue with merged execution context
4. **Router execution**: Extract selection criterion, route appropriate items

### Parallel Execution Strategy

```typescript
async function executeFanOut(
  node: StudioNode,
  context: ExecutionContext,
  callbacks: ExecutionCallbacks
): Promise<void> {
  const data = node.data as FanOutNodeData;
  const inputValue = context.globalVariables.get(inputVar);

  // Determine items to fan out
  const items =
    data.mode === "array"
      ? getArrayFromInput(inputValue, data.arrayProperty)
      : Array(data.count).fill(inputValue);

  // Create branches
  const branches: ExecutionBranch[] = items.map((item, index) => ({
    id: `${node.id}_branch_${index}`,
    sourceNodeId: node.id,
    index,
    variables: new Map([[`${node.id}_out`, item]]),
  }));

  // Find downstream subgraph (until collect node)
  const subgraph = findSubgraphUntilCollect(node, edges, nodes);

  // Execute branches in parallel with concurrency limit
  await Promise.all(branches.map((branch) => executeSubgraph(subgraph, branch, callbacks)));
}
```

## Handle System Extension

### Fan-Out Handles

```typescript
function getFanOutHandles(node: StudioNode): Handle[] {
  const data = node.data as FanOutNodeData;
  const outputCount = data.mode === "count" ? data.count || 3 : 3; // Default preview

  return [
    { id: "input", type: "target", position: "left" },
    ...Array(outputCount)
      .fill(null)
      .map((_, i) => ({
        id: `out[${i}]`,
        type: "source",
        position: "right",
      })),
  ];
}
```

### Collect Handles

```typescript
function getCollectHandles(node: StudioNode): Handle[] {
  const data = node.data as CollectNodeData;
  const inputCount = data.expectedInputs || 3;

  return [
    ...Array(inputCount)
      .fill(null)
      .map((_, i) => ({
        id: `in[${i}]`,
        type: "target",
        position: "left",
      })),
    { id: "output", type: "source", position: "right" },
  ];
}
```

### Router Handles

```typescript
function getRouterHandles(node: StudioNode): Handle[] {
  const data = node.data as RouterNodeData;

  return [
    { id: "candidates", type: "target", position: "left" },
    { id: "selection", type: "target", position: "left" },
    { id: "winner", type: "source", position: "right" },
    ...(data.contextProperty
      ? [
          {
            id: "context",
            type: "source",
            position: "right",
          },
        ]
      : []),
  ];
}
```

## Connection Validation

```typescript
function validateIterativeConnection(connection: Connection): boolean {
  const { sourceNode, targetNode, sourceHandle, targetHandle } = connection;

  // Fan-out outputs connect to generators/transforms
  if (sourceNode.type === "fanout") {
    return ["generator", "transform"].includes(targetNode.type);
  }

  // Collect inputs accept images from generators/transforms
  if (targetNode.type === "collect" && targetHandle?.startsWith("in[")) {
    return ["generator", "transform", "input"].includes(sourceNode.type);
  }

  // Router candidates input accepts arrays (from collect)
  if (targetNode.type === "router" && targetHandle === "candidates") {
    return sourceNode.type === "collect";
  }

  // Router selection input accepts data (from vision/text)
  if (targetNode.type === "router" && targetHandle === "selection") {
    return ["vision", "text"].includes(sourceNode.type);
  }

  return true;
}
```

## Execution Callbacks Extension

```typescript
interface IterativeExecutionStepResult extends ExecutionStepResult {
  /** Branch ID for parallel executions */
  branchId?: string;
  /** Branch index (0, 1, 2...) */
  branchIndex?: number;
  /** Total branches in this fan-out */
  totalBranches?: number;
}
```

## Canvas Visualization

### Parallel Branch Indicators

When fan-out is connected to collect, draw visual indicators:

- Dashed lines showing parallel execution paths
- Branch count badge on fan-out and collect nodes
- During execution: show progress for each branch

### Layout Algorithm

Auto-layout for iterative workflows:

```typescript
function layoutIterativeWorkflow(nodes: StudioNode[], edges: StudioEdge[]): Position[] {
  // 1. Identify fan-out → collect pairs
  // 2. Stack parallel branches vertically between them
  // 3. Allocate horizontal space for parallelism
  // 4. Keep router and downstream nodes after collect
}
```

## Reference Use Case Implementation

**Flojo Logo Generation Flow**:

```
[text: gemini-text]
  prompt: "Generate 3 logo concept prompts for Flojo brand..."
  outputSchema: { prompts: ["string"] }
        │
        ▼
[Fan-Out (mode: "array", arrayProperty: "prompts")]
        │
        ├─── out[0] ──► [generator: gemini-generate] ──┐
        ├─── out[1] ──► [generator: gemini-generate] ──┼─► [Collect]
        └─── out[2] ──► [generator: gemini-generate] ──┘      │
                                                               ▼
[vision: gemini-vision] ◄────────────────────────────────────────
  prompt: "Analyze these 3 logos against Flojo brand principles..."
  outputSchema: { winner: "number", reasoning: "string", refinement: "string" }
        │
        ▼
[Router (selectionProperty: "winner", contextProperty: "refinement")]
        │
        ├─── winner ──────────────────┐
        └─── context ──► [text: gemini-text] ──► prompt injection
                                      │
                                      ▼
                         [transform: gemini-edit]
                                      │
                                      ▼
                                  [save]
```

## Implementation Tasks

1. **T-YYYY-NNN**: Add new node types to shared types (`fanout`, `collect`, `router`)
2. **T-YYYY-NNN**: Implement fan-out node component and handle rendering
3. **T-YYYY-NNN**: Implement collect node component with multi-input handles
4. **T-YYYY-NNN**: Implement router node with selection logic
5. **T-YYYY-NNN**: Extend executor for branching execution
6. **T-YYYY-NNN**: Add connection validation for new node types
7. **T-YYYY-NNN**: Update AI workflow generator to create iterative workflows
8. **T-YYYY-NNN**: Add canvas visualization for parallel branches

## Open Questions

1. **Handle count dynamics**: Should fan-out/collect handle counts be fixed or dynamic based on runtime data?
   - **Proposed**: Fixed at design time, but allow "auto" mode that adapts

2. **Error handling in branches**: When one branch fails, should others continue?
   - **Proposed**: Yes, continue. Collect receives null for failed branches.

3. **Nested fan-out**: Should we support fan-out within fan-out?
   - **Proposed**: Not in v1. Keep execution flat for simplicity.

4. **Variable scoping**: How do branch-local variables interact with global?
   - **Proposed**: Branches inherit global read-only, write to branch scope. Collect merges.

## Context Preservation

A critical requirement for iterative workflows: original context (brand guidelines, user requirements) must flow through all stages to influence generation, evaluation, and refinement.

### Workflow-Level Context

Workflows gain a new `context` field that holds persistent information:

```typescript
export interface StudioWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: StudioNode[];
  edges: StudioEdge[];
  /** Workflow-level context injected into prompts */
  context?: WorkflowContext;
  createdAt: number;
  updatedAt: number;
}

export interface WorkflowContext {
  /** Named context blocks that can be referenced in prompts */
  blocks: Record<string, ContextBlock>;
}

export interface ContextBlock {
  /** Human-readable name */
  name: string;
  /** The context content */
  content: string;
  /** When to auto-inject: "all" | "ai-only" | "manual" */
  injection: "all" | "ai-only" | "manual";
}
```

### Context in Prompts

Prompts can reference context blocks using `{{context.blockName}}` syntax:

```
Generate a logo concept that embodies:
{{context.brand_principles}}

Style requirements:
{{context.visual_guidelines}}
```

### Context Node (Optional)

For visual representation, add an optional Context node type:

```typescript
export interface ContextNodeData {
  /** Which context blocks this node represents */
  blockNames: string[];
  /** Whether this is editable in the workflow or reference-only */
  editable: boolean;
}
```

**Visual Representation**:

- Document icon
- Lists context block names
- Connecting to a node injects that context into its prompts

### Context Resolution in Executor

```typescript
function resolvePromptWithContext(prompt: string, context: WorkflowContext | undefined): string {
  if (!context) return prompt;

  return prompt.replace(/\{\{context\.(\w+)\}\}/g, (match, blockName) => {
    const block = context.blocks[blockName];
    return block?.content || match;
  });
}
```

### Auto-Injection for AI Nodes

For nodes with `injection: "ai-only"` or `injection: "all"`, context is automatically appended:

```typescript
function getEffectivePrompt(
  node: StudioNode,
  basePrompt: string,
  context: WorkflowContext
): string {
  const autoInjectBlocks = Object.entries(context.blocks)
    .filter(
      ([_, block]) => block.injection === "all" || (block.injection === "ai-only" && isAINode(node))
    )
    .map(([name, block]) => `## ${block.name}\n${block.content}`)
    .join("\n\n");

  if (!autoInjectBlocks) return basePrompt;

  return `${basePrompt}\n\n---\n\nContext:\n${autoInjectBlocks}`;
}
```

### Reference Use Case: Brand Context Flow

```
Workflow Context:
  blocks:
    brand_principles:
      name: "Flojo Brand Principles"
      content: |
        - Approachable, not intimidating
        - Pragmatic, not dogmatic
        - Open and welcoming
        - Whimsical but substantive
        - Dark themes with warmth
      injection: "ai-only"

Flow:
  [text: gemini-text]
    prompt: "Generate 3 logo concepts for Flojo"
    → Auto-receives brand_principles context

  [vision: gemini-vision]
    prompt: "Evaluate these logos against brand criteria"
    → Auto-receives brand_principles context for evaluation

  [transform: gemini-edit]
    prompt: "Apply refinement: {{router.context}}"
    → Auto-receives brand_principles to guide refinement
```

### UI for Context Management

1. **Workflow Settings Panel**: New tab for managing context blocks
2. **Context Preview**: Show resolved prompts with context injected
3. **Context Inheritance**: Child workflows can extend parent context

## Future Extensions

- **True recursion**: Loop until quality threshold met (requires cycle detection)
- **Human-in-the-loop**: Selection gates for manual approval
- **Multi-winner routing**: Route top N through different refinement paths
- **Quality scoring**: Automatic termination when score exceeds threshold
