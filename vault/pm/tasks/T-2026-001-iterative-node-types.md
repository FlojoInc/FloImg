---
tags: [type/task]
status: in-progress
priority: p1
created: 2026-01-09
updated: 2026-01-09
parent: EPIC-2026-001
---

# T-2026-001: Add Iterative Workflow Node Types

## Overview

Add the foundational type definitions for iterative workflow nodes: `fanout`, `collect`, and `router`. These types enable AI-driven workflows that generate variations, evaluate, select, and refine.

## Parent Epic

EPIC-2026-001: AI-Driven Iterative Workflows

## Scope

**File**: `apps/studio/shared/src/index.ts`

Add:

1. Three new entries to `StudioNodeType` union
2. Three new node data interfaces (`FanOutNodeData`, `CollectNodeData`, `RouterNodeData`)
3. Update `StudioNodeData` union to include new types

## Implementation

### 1. StudioNodeType Extension

```typescript
export type StudioNodeType =
  | "generator"
  | "transform"
  | "save"
  | "input"
  | "vision"
  | "text"
  // Iterative workflow nodes
  | "fanout"
  | "collect"
  | "router";
```

### 2. FanOutNodeData

```typescript
/** Fan-out node distributes execution across parallel branches */
export interface FanOutNodeData {
  /** How to fan out: "array" (one per item) or "count" (N copies) */
  mode: "array" | "count";
  /** For count mode: number of parallel executions */
  count?: number;
  /** For array mode: which property of the input object to iterate over */
  arrayProperty?: string;
}
```

### 3. CollectNodeData

```typescript
/** Collect node gathers outputs from parallel branches into array */
export interface CollectNodeData {
  /** How many inputs to expect (helps with canvas layout) */
  expectedInputs?: number;
  /** Whether to wait for all inputs or proceed with available */
  waitMode: "all" | "available";
}
```

### 4. RouterNodeData

```typescript
/** Router node routes inputs based on selection criteria */
export interface RouterNodeData {
  /** Property name containing the selection (e.g., "winner") */
  selectionProperty: string;
  /** Selection type: "index" (0-based number) or "value" (exact match) */
  selectionType: "index" | "value";
  /** How many outputs to route (1 = single winner, N = top N) */
  outputCount: number;
  /** Optional: property containing context to pass through (e.g., "refinement") */
  contextProperty?: string;
}
```

### 5. StudioNodeData Update

```typescript
export type StudioNodeData =
  | GeneratorNodeData
  | TransformNodeData
  | SaveNodeData
  | InputNodeData
  | VisionNodeData
  | TextNodeData
  | FanOutNodeData
  | CollectNodeData
  | RouterNodeData;
```

## Acceptance Criteria

- [ ] Three new node types added to `StudioNodeType`
- [ ] Three new data interfaces defined with JSDoc comments
- [ ] `StudioNodeData` union updated
- [ ] `pnpm typecheck` passes
- [ ] No breaking changes to existing types

## Notes

These are just type definitions. Actual node rendering and execution will be implemented in subsequent tasks.
