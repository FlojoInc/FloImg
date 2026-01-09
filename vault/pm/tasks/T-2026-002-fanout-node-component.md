---
tags: [type/task]
status: in-progress
priority: p1
created: 2026-01-09
updated: 2026-01-09
parent: EPIC-2026-001
---

# T-2026-002: Implement Fan-Out Node Component

## Overview

Implement the Fan-Out node React component for FloImg Studio. This node distributes execution across parallel branches, either by iterating over array items or spawning N copies.

## Parent Epic

EPIC-2026-001: AI-Driven Iterative Workflows

## Dependencies

- T-2026-001: Add Iterative Workflow Node Types (PR #106)

## Scope

**Files**:
- `apps/studio/frontend/src/nodes/FanOutNode.tsx` - New component
- `apps/studio/frontend/src/nodes/index.ts` - Export
- `apps/studio/frontend/src/editor/WorkflowEditor.tsx` - Register node type
- `apps/studio/backend/src/floimg/registry.ts` - Add to node registry

## Implementation

### 1. FanOutNode Component

```typescript
// Dynamic output handles based on mode and count
// - Array mode: shows "out[0]", "out[1]", "out[2]" etc.
// - Count mode: shows count number of outputs

// Input handle: accepts data/array from upstream
// Output handles: dynamic based on count
```

### 2. Node Inspector

Add parameter controls:
- Mode selector: "array" | "count"
- Count input (for count mode)
- Array property input (for array mode)

### 3. Visual Design

- Icon: branching/fork symbol
- Badge showing output count
- Color: neutral (not AI-specific)

## Acceptance Criteria

- [ ] FanOutNode renders with correct handles
- [ ] Output handle count updates when mode/count changes
- [ ] Node appears in palette under "Flow Control" category
- [ ] Can connect input from text/vision nodes
- [ ] Can connect outputs to generator/transform nodes
- [ ] Node inspector shows mode and count parameters

## Notes

Execution logic will be implemented in a later task. This task focuses on the visual component only.
