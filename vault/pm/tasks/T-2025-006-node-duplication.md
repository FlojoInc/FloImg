---
tags: [type/task]
status: in-progress
priority: p2
created: 2025-12-31
updated: 2025-12-31
parent:
children: []
github_issue:
---

# Task: Add Node Duplication in FloImg Studio

## Task Details

**Task ID**: T-2025-006
**Status**: backlog
**Priority**: p2
**Created**: 2025-12-31
**Completed**:
**GitHub Issue**:

## Description

Allow users to easily duplicate/copy nodes that are already placed on the canvas in FloImg Studio. This improves workflow building efficiency by letting users quickly create copies of configured nodes rather than adding new ones from the palette and reconfiguring them.

## Acceptance Criteria

- [ ] Users can duplicate a selected node via keyboard shortcut (Cmd/Ctrl+D)
- [ ] Users can duplicate a selected node via right-click context menu
- [ ] Duplicated node appears offset from the original (not stacked on top)
- [ ] Duplicated node copies all parameters from the original
- [ ] Duplicated node gets a new unique ID

## Implementation Details

### Technical Approach

1. Add `duplicateNode` action to workflowStore
2. Implement keyboard shortcut handler (Cmd/Ctrl+D)
3. Optionally add context menu with "Duplicate" option

### Packages Affected

- `apps/studio/frontend` - workflowStore, keyboard handlers

### Testing Required

- Manual: Select node, press Cmd+D, verify duplicate appears
- Manual: Verify all params copied correctly
- Manual: Verify new node has unique ID and can be edited independently

## Dependencies

### Blocked By

- None

### Related Tasks

- None

## Subtasks

<!-- Auto-populated when children are created -->

## Progress Notes

### Work Log

- **2025-12-31**: Task created

## Review Checklist

- [ ] Code review completed
- [ ] Tests written and passing
- [ ] TypeScript types correct
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

- Consider also supporting multi-select duplication in the future
