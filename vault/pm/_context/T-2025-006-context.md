# Context: T-2025-006 Node Duplication

**Task**: [[T-2025-006-node-duplication]]
**Created**: 2025-12-31
**Status**: In Progress

## Overview

Add the ability to duplicate nodes in FloImg Studio. Users should be able to select a node and quickly create a copy with all the same parameters.

## Key Files

- `apps/studio/frontend/src/stores/workflowStore.ts` - Add duplicateNode action
- `apps/studio/frontend/src/editor/WorkflowEditor.tsx` - Keyboard shortcut handler

## Implementation Notes

Standard pattern:
1. Get selected node
2. Deep clone node data
3. Generate new ID
4. Offset position (e.g., +50px x and y)
5. Add to nodes array

## Key Decisions

-

## Open Questions

- Should we also copy connected edges? (Probably not for single node duplicate)

## Next Steps

1. Run `/s T-2025-006` to start work
