---
tags: [type/task, area/studio, priority/p0]
status: backlog
priority: p0
created: 2025-12-26
updated: 2025-12-26
parent:
children: []
github_issue:
---

# Task: Fix Node Dragging in FloImg Studio

## Task Details

**Task ID**: T-2025-003
**Status**: backlog
**Priority**: p0 (CRITICAL)
**Created**: 2025-12-26
**Completed**:
**GitHub Issue**:

## Description

Node dragging is completely broken in FloImg Studio. Users cannot reposition nodes on the canvas after placing them. This is a P0 bug that blocks core workflow functionality.

**Root Cause**: Missing `nodesDraggable={true}` prop on the ReactFlow component in WorkflowEditor.tsx.

**Evidence**:

- Simulated drag events show transform stays at `translate(100px, 100px)` - no movement
- Nodes have `selectable` class but NOT `draggable` class
- ReactFlow `onNodesChange` handler exists but drag events aren't triggering

## Acceptance Criteria

- [ ] Nodes can be dragged and repositioned on the canvas
- [ ] Nodes have `draggable` class applied by ReactFlow
- [ ] Position changes persist in Zustand store
- [ ] Snap-to-grid still works (15px intervals)
- [ ] Edge connections (handles) still work after fix

## Implementation Details

### Technical Approach

Add three explicit props to ReactFlow component:

```tsx
<ReactFlow
  nodesDraggable={true}      // Enable node dragging
  nodesConnectable={true}    // Ensure edges still work
  elementsSelectable={true}  // Enable selection
  // ... existing props
>
```

### Packages Affected

- `apps/studio/frontend` - WorkflowEditor.tsx

### Testing Required

- Test with Chrome DevTools MCP
- Load template with multiple nodes
- Verify drag behavior and position persistence
- Verify snap-to-grid functionality
- Verify edge connections still work

## Dependencies

### Blocked By

- None (can start immediately)

### Related Tasks

- Node selection issues (likely fixed by same change)

## Subtasks

<!-- None - this is a quick fix -->

## Progress Notes

### Work Log

- **2025-12-26**: Task created. Root cause identified by full-stack dev agent.

## Review Checklist

- [ ] Code review completed
- [ ] Tests written and passing
- [ ] TypeScript types correct
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

- This is a 5-minute fix that unblocks the entire conversion funnel
- Test with Chrome DevTools MCP after fix to verify
