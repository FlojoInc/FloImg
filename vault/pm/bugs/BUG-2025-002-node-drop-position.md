---
tags: [type/bug, area/studio]
status: completed
priority: p2
created: 2025-12-31
updated: 2025-12-31
pr: 66
---

# Bug: Second node dropped on canvas appears in wrong position

## Bug Details

**Bug ID**: BUG-2025-002
**Status**: completed
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

- [x] Reproduce issue with Chrome DevTools MCP
- [x] Identify root cause in drop handler
- [x] Implement fix
- [x] Test with multiple nodes

## Resolution

**Root Cause**: The drop handler in `App.tsx` calculated position using simple subtraction (`clientX - reactFlowBounds.left`) which didn't account for React Flow's viewport transform (zoom/pan).

**Fix**: Created `EditorDropZone` component that uses `useReactFlow` hook's `screenToFlowPosition()` to correctly convert screen coordinates to flow coordinates, accounting for zoom and pan.

**PR**: #66 (merged)
**Verified**: Tested on studio.floimg.com - nodes now appear at correct drop positions
