---
tags: [type/task]
status: in-progress
priority: p1
created: 2025-12-22
updated: 2025-12-22
parent:
children: []
---

# Task: Workflow Persistence and Code Export

## Task Details

**Task ID**: T-2025-001
**Status**: in-progress
**Priority**: p1
**Created**: 2025-12-22
**Completed**:

## Description

Enable users to save, load, and manage workflows in Studio. Currently, workflows are lost when the browser closes - a critical gap that blocks real usage. Additionally, add JavaScript code export to help developers understand what Studio builds.

This addresses the OST opportunity: "Developers lose work when browser closes" and "Developers can't see what the visual builder actually does."

## Acceptance Criteria

- [ ] Workflows persist to localStorage via zustand/persist
- [ ] Users can save current workflow with a name
- [ ] Users can load saved workflows from a library panel
- [ ] Users can delete, rename, and duplicate workflows
- [ ] Unsaved changes indicator shows when work might be lost
- [ ] Export modal has YAML and JavaScript tabs
- [ ] JavaScript export generates valid floimg SDK code
- [ ] Cmd+S keyboard shortcut saves workflow

## Implementation Details

### Technical Approach

- Add `persist` middleware to workflowStore (pattern from settingsStore.ts)
- Create WorkflowLibrary slide-out component
- Add codeGenerator.ts for JavaScript export
- Enhance Toolbar export modal with tabs

### Packages Affected

- [x] frontend
- [ ] backend
- [ ] shared

### Testing Required

- Save/load cycle works correctly
- Data survives browser refresh
- Code export produces valid JavaScript

## Dependencies

### Blocked By

- None

### Related Tasks

- OST floimg-activation (opportunity O1, O2)

## Subtasks

<!-- Auto-populated when children are created -->

## Progress Notes

### Work Log

- **2025-12-22**: Started implementation. Added persist import and SavedWorkflow interface to workflowStore.

## Review Checklist

- [ ] Code review completed
- [ ] TypeScript types correct
- [ ] Frontend tested manually
- [ ] Backend API tested
- [ ] Documentation updated

## Notes

- Part of "ship and learn" strategy from OST revision
- Target: developers building image workflows
