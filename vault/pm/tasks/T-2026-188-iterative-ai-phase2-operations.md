---
tags: [type/task]
status: complete
priority: p1
created: 2026-02-03
updated: 2026-02-03
parent:
children: []
epic: EPIC-2026-019
---

# Task: Phase 2 - AI Iterative Operations

## Task Details

- **Task ID**: T-2026-188
- **Status**: complete
- **Priority**: p1
- **Created**: 2026-02-03
- **Completed**: 2026-02-03

## Description

Enable the AI to make targeted changes to the existing canvas rather than full replacement. The AI should support add, modify, delete, connect, and disconnect operations.

## Acceptance Criteria

- [x] New operation types defined in shared package
- [x] AI can add new nodes to existing workflow
- [x] AI can modify properties of existing nodes
- [x] AI can delete nodes
- [x] AI can add/remove connections between nodes
- [x] Operations shown as summary in conversation
- [ ] User can undo AI changes (deferred - standard React Flow undo works)

## Implementation Details

### Technical Approach

1. **New Types** (in shared package):

```typescript
interface AIWorkflowOperation {
  type: "add" | "modify" | "delete" | "connect" | "disconnect";
  nodeId?: string;
  edgeId?: string;
  data?: Partial<StudioNodeData>;
  nodeType?: string;
  source?: string;
  target?: string;
}

interface AIIterativeResponse {
  workflow?: GeneratedWorkflowData; // Full (backwards compat)
  operations?: AIWorkflowOperation[]; // Incremental (preferred)
  explanation: string;
  suggestions?: string[];
}
```

2. **Backend Changes**
   - New endpoint `/api/generate/workflow/iterative` or enhance existing
   - System prompt guidance for when to use operations vs full replacement
   - Generate JSON operations array

3. **Frontend Changes**
   - `applyAIOperations()` in workflowStore
   - Undo stack integration
   - Operation visualization in AIPanel

### Files to Modify

- `apps/studio/shared/src/index.ts` → Add operation types
- `apps/studio/backend/src/routes/generate.ts` → Update/new endpoint
- `apps/studio/backend/src/ai/workflow-generator.ts` → Operation generation
- `apps/studio/frontend/src/stores/workflowStore.ts` → `applyAIOperations()`, undo
- `apps/studio/frontend/src/components/AIPanel.tsx` → Operation visualization

### Testing Required

- [ ] "Add resize to the output" creates resize node connected to output
- [ ] "Change the fan-out to 5" modifies existing node
- [ ] "Remove the grayscale transform" deletes node and reconnects edges
- [ ] Undo reverts AI change

## Dependencies

- **Blocked By**: T-2026-187 (Phase 1 - Foundation)
- **Related Tasks**: T-2026-189 (Phase 3 - Merge & Conflict)

## Progress Notes

### Work Log

- **2026-02-03**: Task created
- **2026-02-03**: COMPLETE - PR #250
  - Added `AIWorkflowOperation` and `AIIterativeResponse` types to shared package
  - Added `generateIterativeWorkflow()` function using Gemini structured output
  - Added `OPERATIONS_SCHEMA` for AI operation generation
  - Added `GenerationSSEIterative` event type
  - Added `applyAIOperations()` to workflowStore
  - Updated AIPanel to handle iterative responses
  - Added nodeType validation with console warnings
  - Added `safeJsonParse()` helper for defensive JSON parsing
  - Operations auto-apply with change summary shown to user
