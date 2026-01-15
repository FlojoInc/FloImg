---
tags: [type/task]
status: done
priority: p2
created: 2026-01-15
updated: 2026-01-15
---

# Task: Highlight Failed Nodes in Workflow Canvas

## Task Details

- **Task ID**: T-2026-017
- **Status**: backlog
- **Priority**: p2
- **Created**: 2026-01-15

## Problem

When workflow execution fails, the error message appears at the top of the screen but doesn't indicate which specific node(s) failed. Users have to guess or manually inspect each node.

## Solution

Visually highlight failed nodes in the workflow canvas:

1. Add red border/glow to nodes that errored
2. Show error icon badge on failed nodes
3. Clicking failed node shows error details
4. Consider: highlight the path that led to the failure

## Design Considerations

- Error state should be visually distinct (red border, error icon)
- Don't clutter the UI - only show on execution failure
- Clear error state when user re-executes or modifies workflow
- Consider animating to draw attention to the failed node

## Acceptance Criteria

- [x] Failed nodes have distinct visual treatment (red border/icon)
- [x] Hovering error badge shows error message (tooltip)
- [x] Error state clears on re-execution
- [x] Works for multiple failures (first node gets detailed error, others show generic message)

## Implementation Notes

- Added `errorNodeId` to `ExecutionState` in `workflowStore.ts`
- Created `ErrorBadge` component in `nodeTypes.tsx` (added to all 9 node types)
- Added CSS styling in `studio-theme.css`: red glow effect, error pulse animation, positioned badge
- Using `title` tooltip instead of `alert()` per PR reviewer suggestion (better UX)

**Backend changes:** Updated `ExecutionCallbacks.onError` signature to include optional `nodeId` parameter. Executor now tracks `currentNodeId` during execution and passes it to onError when errors occur. Route handler includes nodeId in SSE error events.

## Related

- BUG-2026-002 (composite undefined error)
- Workflow execution feedback
