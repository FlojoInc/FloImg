---
tags: [type/bug, area/studio]
status: in-progress
priority: p2
created: 2025-12-31
updated: 2025-12-31
---

# Bug: Second node dropped on canvas appears in wrong position

## Bug Details

**Bug ID**: BUG-2025-002
**Status**: in-progress
**Priority**: p2
**Created**: 2025-12-31

## Description

When dragging a second node onto the FloImg Studio canvas, it doesn't appear where the user actually dropped it. The first node works correctly, but subsequent nodes appear in unexpected positions.

## Steps to Reproduce

1. Open FloImg Studio
2. Drag a node from the palette onto the canvas
3. Drag a second node onto the canvas at a specific location
4. Observe: The node appears in a different position than where it was dropped

## Expected Behavior

Nodes should appear exactly where the user drops them on the canvas.

## Actual Behavior

Second and subsequent nodes appear in wrong positions on the canvas.

## Environment

- **Component**: FloImg Studio frontend
- **File**: `apps/studio/frontend/src/editor/WorkflowEditor.tsx` (likely)

## Technical Notes

Likely related to:
- React Flow's `screenToFlowPosition` calculation
- Canvas viewport/zoom state
- Drop event coordinate handling

## Fix Details

- [ ] Reproduce issue with Chrome DevTools MCP
- [ ] Identify root cause in drop handler
- [ ] Implement fix
- [ ] Test with multiple nodes
