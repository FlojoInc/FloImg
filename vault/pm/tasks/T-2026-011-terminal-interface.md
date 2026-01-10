---
tags: [type/task]
status: in-progress
priority: p1
created: 2026-01-09
updated: 2026-01-09
parent:
children: []
github_issue:
---

# Task: Terminal Interface for FloImg Studio

## Task Details

**Task ID**: T-2026-011
**Status**: in-progress
**Priority**: p1
**Created**: 2026-01-09
**Completed**:
**GitHub Issue**:

## Description

Build a conversational, command-driven terminal interface as a new tab in FloImg Studio. This provides an alternative to the visual node-based canvas editor, with slash commands for workflow operations and AI-assisted workflow creation.

The terminal interface should feel welcoming and conversational, similar to chatting with Claude in a terminal - with slash commands, dynamic views that appear when warranted (like slide-out panels for image/workflow selection), and inline execution progress and results.

## Acceptance Criteria

- [x] Terminal tab accessible in FloImg Studio navigation
- [x] Slash commands for workflow operations: /help, /clear, /workflows, /run, /images, /status
- [x] Slide-out panels for workflow and image selection
- [x] Inline execution progress with live node status updates
- [x] Image results displayed inline with thumbnails
- [ ] AI conversation mode for /new command to create workflows
- [x] Dark terminal aesthetic with teal accents

## Implementation Details

### Technical Approach

- Zustand store (terminalStore) for terminal-specific state management
- SSE streaming for live execution progress updates
- Slide-out panel pattern for async selection (workflows, images)
- Message type system: user, assistant, system, execution, result, error
- Command parsing with switch statement for extensibility

### Packages Affected

- apps/studio/frontend - New terminal components and store

### Testing Required

- Unit tests for command parsing
- Integration tests for workflow execution flow
- Visual verification of terminal styling

## Files Created

```
apps/studio/frontend/src/
├── stores/
│   └── terminalStore.ts           # Terminal-specific state
└── components/
    └── terminal/
        ├── Terminal.tsx           # Main container
        ├── TerminalFeed.tsx       # Auto-scrolling message list
        ├── TerminalInput.tsx      # Input with command parsing
        └── messages/
        │   ├── UserMessage.tsx
        │   ├── AssistantMessage.tsx
        │   ├── SystemMessage.tsx
        │   ├── ExecutionProgress.tsx
        │   ├── ImageResult.tsx
        │   └── ErrorMessage.tsx
        └── panels/
            ├── WorkflowSelectorPanel.tsx
            └── ImageSelectorPanel.tsx
```

## Dependencies

### Blocked By

- None

### Related Tasks

- None

## Subtasks

- [x] Phase 1: Foundation (store, components, basic commands)
- [x] Phase 2: Workflow Operations (selector panel, /run with SSE)
- [ ] Phase 3: AI Integration (/new with conversation mode)
- [x] Phase 4: Image Selection (gallery panel, /images)

## Progress Notes

### Work Log

- **2026-01-09**: Implemented Phase 1-2 and Phase 4. Terminal tab now functional with slash commands, workflow execution, and image selection. Phase 3 (AI conversation for /new) pending.

## Review Checklist

- [ ] Code review completed
- [x] TypeScript types correct
- [ ] Tests written and passing
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

- The /new command currently shows a placeholder message pointing to the AI Generate button. Full AI conversation integration is Phase 3.
- Uses same SSE patterns as existing execution in workflowStore.
