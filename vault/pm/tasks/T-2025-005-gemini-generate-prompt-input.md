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

# Task: Add Prompt Input Handle to Gemini Generate Node

## Task Details

**Task ID**: T-2025-005
**Status**: in-progress
**Priority**: p2
**Created**: 2025-12-31
**Completed**:
**GitHub Issue**:

## Description

Add a prompt input handle to the gemini-generate node in FloImg Studio, matching the pattern used by gemini-edit. This allows users to pipe in a dynamically generated prompt from upstream text/vision nodes rather than only using static text in the node's parameter field.

Currently, gemini-edit accepts a prompt via an input handle, enabling workflows like:
- Vision node analyzes image → outputs description → pipes to gemini-edit prompt

The gemini-generate node should support the same pattern:
- Text node generates creative prompt → pipes to gemini-generate prompt

## Acceptance Criteria

- [ ] gemini-generate node accepts prompt via input handle (like gemini-edit)
- [ ] Prompt handle appears on the node in Studio UI
- [ ] Piped prompt overrides/supplements the static prompt parameter
- [ ] Existing static prompt functionality continues to work
- [ ] Backend executor resolves prompt from connected nodes

## Implementation Details

### Technical Approach

1. Update floimg-google schema to mark gemini-generate as accepting text input
2. Add prompt input handle to GeneratorNode in Studio frontend
3. Update executor to resolve prompt from connected text/vision node outputs

### Packages Affected

- `packages/floimg-google` - Generator schema update
- `apps/studio/frontend` - Add prompt handle to generator nodes
- `apps/studio/backend` - Executor to resolve prompt inputs

### Testing Required

- Manual: Connect text node → gemini-generate, verify prompt flows through
- Manual: Static prompt still works when no input connected

## Dependencies

### Blocked By

- None

### Related Tasks

- T-2025-004 (AI Text/Vision/Editing nodes - provides text output capability)

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

- Pattern should match gemini-edit which already accepts prompt input
- Consider whether other generators should also accept prompt input
