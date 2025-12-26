# Context: T-2025-003 Fix Node Dragging

**Task**: [[T-2025-003-fix-node-dragging]]
**Created**: 2025-12-26
**Status**: Planning

## Overview

Critical bug in FloImg Studio where nodes cannot be dragged on the canvas. Root cause identified: missing `nodesDraggable` prop on ReactFlow component.

## Key Decisions

- Use explicit ReactFlow props rather than relying on defaults
- Add all three props together: `nodesDraggable`, `nodesConnectable`, `elementsSelectable`

## Root Cause Analysis

Investigated by full-stack-dev agent on 2025-12-26:

1. ReactFlow v11.11.4 requires explicit `nodesDraggable={true}` prop
2. Without this prop, ReactFlow doesn't apply the `draggable` class to nodes
3. Without the `draggable` class, ReactFlow's internal drag event handlers never activate
4. Result: Position changes never fire in `onNodesChange`

## Fix Location

File: `apps/studio/frontend/src/editor/WorkflowEditor.tsx`
Line: ~106 (ReactFlow component)

```tsx
<ReactFlow
  nodesDraggable={true}      // ADD THIS
  nodesConnectable={true}    // ADD THIS
  elementsSelectable={true}  // ADD THIS
  nodes={nodes}
  edges={edges}
  // ... rest of existing props
>
```

## Testing Checklist

After fix, verify with Chrome DevTools MCP:

- [ ] Navigate to https://studio.floimg.com/
- [ ] Load a template with nodes
- [ ] Take snapshot - verify nodes have `draggable` class
- [ ] Drag a node - verify transform value changes
- [ ] Screenshot to confirm visual movement

## Open Questions

- None - root cause is clear

## Next Steps

1. Run `/s T-2025-003` to start work
2. Make the code change
3. Test with Chrome DevTools MCP
4. Commit and create PR
