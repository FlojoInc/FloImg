---
tags: [type/task]
status: in-progress
priority: p1
created: 2026-01-09
updated: 2026-01-09
parent: EPIC-2026-001
---

# T-2026-003: Extend Executor for Branching Execution

## Overview

Extend the Studio executor to support parallel branching execution for fan-out/collect/router nodes. This is the core execution logic that makes iterative workflows functional.

## Parent Epic

EPIC-2026-001: AI-Driven Iterative Workflows

## Dependencies

- T-2026-001: Add Iterative Workflow Node Types (PR #106)
- T-2026-002: Implement Node Components (PR #107)

## Scope

**Primary File**: `apps/studio/backend/src/floimg/executor.ts`

**Secondary Files**:

- `apps/studio/backend/src/floimg/toPipeline.ts` - Convert graph to pipeline with branching

## Implementation

### 1. Fan-Out Execution

When executor encounters a fan-out node:

1. Extract array items (array mode) or generate N copies (count mode)
2. Identify downstream subgraph until collect node
3. Execute each branch in parallel with branch-local variables
4. Report progress for each branch via callbacks

### 2. Collect Execution

When executor encounters a collect node:

1. Wait for all expected inputs to arrive
2. Bundle results into array (null for failed branches)
3. Store array in variables and continue

### 3. Router Execution

When executor encounters a router node:

1. Get candidates array from `candidates` input
2. Get selection data from `selection` input
3. Extract winner index/value from selection using `selectionProperty`
4. Route selected item(s) to `winner` output
5. Optionally route context via `contextProperty` to `context` output

### 4. Callback Extension

Extend `ExecutionStepResult` to include branch info:

```typescript
interface ExecutionStepResult {
  // ... existing fields
  branchId?: string; // e.g., "fanout_1_branch_0"
  branchIndex?: number; // 0, 1, 2...
  totalBranches?: number; // 3
}
```

## Acceptance Criteria

- [x] Fan-out spawns parallel executions
- [x] Collect gathers results into array
- [x] Router selects based on selection property
- [x] Callbacks report branch progress
- [x] Failed branches don't block others
- [x] Context flows through router

## Technical Notes

The current executor is sequential for real-time UI feedback. For fan-out:

- Execute branches with Promise.all for parallelism
- Each branch gets its own variable scope (inherits global read-only)
- Collect merges branch results back to global scope

## Test Cases

1. Fan-out (count mode): 1 input → 3 parallel generators
2. Fan-out (array mode): text with 3 prompts → 3 generators
3. Collect: 3 generators → 1 array
4. Router: array + selection → winner
5. Full flow: fan-out → generators → collect → vision → router → edit
