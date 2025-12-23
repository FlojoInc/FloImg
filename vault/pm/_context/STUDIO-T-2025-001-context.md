# Context: T-2025-001 Workflow Persistence

**Task**: [[T-2025-001-workflow-persistence]]
**Created**: 2025-12-22
**Status**: Complete

## Overview

Studio looks polished but is functionally incomplete - users can build workflows but can't save them. This is the #1 blocker to real usage.

Two features for tonight:

1. **Workflow Persistence** - Save/load workflows to localStorage
2. **Code Export** - Show JavaScript equivalent in export modal

## Files to Modify

1. `packages/frontend/src/stores/workflowStore.ts`
   - Add zustand/persist middleware
   - Add SavedWorkflow type
   - Add save/load/delete/rename/duplicate methods
   - Track activeWorkflowId and hasUnsavedChanges

2. `packages/frontend/src/components/Toolbar.tsx`
   - Add tabs to export modal (YAML | JavaScript)
   - Add Save button with Cmd+S shortcut
   - Add "My Workflows" button

3. `packages/frontend/src/App.tsx`
   - Integrate WorkflowLibrary panel

## Files to Create

1. `packages/frontend/src/components/WorkflowLibrary.tsx`
   - Slide-out panel with workflow list
   - Save/Load/Delete/Rename/Duplicate actions

2. `packages/frontend/src/utils/codeGenerator.ts`
   - Generate JavaScript code from nodes/edges
   - Topological sort for dependency order

## Data Schema

```typescript
interface SavedWorkflow {
  id: string; // e.g., "wf_1703289600_abc123"
  name: string; // User-provided name
  nodes: Node<NodeData>[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
  templateId?: string; // If loaded from template
}
```

## Key Decisions

- Use localStorage (not cloud) for v1 - simplest path
- Storage key: `floimg-studio-workflows`
- Pattern: follow settingsStore.ts persist implementation

## Open Questions

- None for v1 - ship and learn

## Implementation Complete

All features implemented and tested on 2025-12-22:

### Files Created

- `packages/frontend/src/components/WorkflowLibrary.tsx` - Slide-out panel
- `packages/frontend/src/utils/codeGenerator.ts` - JS code generation

### Files Modified

- `packages/frontend/src/stores/workflowStore.ts` - Added persist middleware
- `packages/frontend/src/components/Toolbar.tsx` - Added tabs, save button
- `packages/frontend/src/App.tsx` - Integrated WorkflowLibrary

### Tested Features

- [x] WorkflowLibrary panel opens/closes correctly
- [x] New Workflow button clears canvas and closes panel
- [x] Save workflow persists to localStorage
- [x] Saved workflows appear in library with metadata
- [x] Export modal has YAML and JavaScript tabs
- [x] JavaScript code generation produces valid code
- [x] Cmd+S keyboard shortcut for save

### No Postgres Required

All persistence uses browser localStorage - no backend database needed.
