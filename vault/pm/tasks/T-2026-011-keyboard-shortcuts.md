---
tags: [type/task]
status: completed
priority: p1
created: 2026-01-10
updated: 2026-01-10
parent:
children: []
github_issue:
---

# Task: Keyboard Shortcuts for FloImg Studio

## Task Details

**Task ID**: T-2026-011
**Status**: completed
**Priority**: p1
**Created**: 2026-01-10
**Completed**: 2026-01-10
**GitHub Issue**:

## Description

Add comprehensive keyboard shortcuts to FloImg Studio for power users. Includes a command palette (Cmd+K) for discoverability, full customization in settings, and follows WCAG accessibility standards.

Works in both self-hosted (OSS) and FloImg Studio Cloud (FSC).

Key features:

- Full shortcut set (~20 shortcuts across Workflow, Editing, Canvas, UI)
- Command palette (Cmd+K) for discoverability
- Full customization UI (users can remap any shortcut)
- Platform-aware display (⌘ on Mac, Ctrl on Windows)
- WCAG 2.1 accessibility compliance

## Acceptance Criteria

- [x] Core workflow operations have default keyboard shortcuts
- [x] Command palette (Cmd+K) with fuzzy search for all actions
- [x] Settings UI allows viewing and customizing keyboard shortcuts
- [x] Shortcuts avoid conflicts with common browser/OS defaults
- [ ] Shortcuts work consistently across macOS, Windows, and Linux (needs manual testing)
- [x] Help modal (Cmd+?) shows all available shortcuts
- [x] Shortcuts persist across sessions (localStorage)
- [x] Shortcuts don't fire when typing in input fields

## Implementation Details

### Technical Approach

- Use react-hotkeys-hook library for keyboard handling
- Centralized keyboard manager at src/lib/keyboard/
- Extend settingsStore with keyboard settings
- VS Code-style shortcut recording UI

### Packages Affected

- @teamflojo/floimg-studio-ui (frontend only)

### Testing Required

- Cross-platform testing (macOS Cmd, Windows/Linux Ctrl)
- Focus-awareness (skip shortcuts when in input fields)
- Browser testing (Chrome, Firefox, Safari)
- Screen reader compatibility

## Dependencies

### Blocked By

- None

### Related Tasks

- T-2026-012: Undo/Redo (deferred - requires zundo middleware)

## Subtasks

<!-- Auto-populated when children are created -->

## Progress Notes

### Work Log

- **2026-01-10**: Task created, plan approved, starting implementation
- **2026-01-10**: Implementation complete:
  - Created keyboard module (`src/lib/keyboard/`) with types, shortcuts, conflicts, platform utils
  - Built all UI components: KeyBadge, ShortcutRecorder, KeyboardSettings, CommandPalette, KeyboardShortcutsModal
  - Integrated into App.tsx and removed old shortcuts from Toolbar.tsx
  - Added 83 unit tests for keyboard utilities
  - Updated settingsStore with keyboard settings and persistence
  - PR ready for review on feat/keyboard-shortcuts branch

## Review Checklist

- [ ] Code review completed
- [ ] Tests written and passing
- [ ] TypeScript types correct
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

- Undo/redo deferred to T-2026-012 (requires zundo middleware for workflowStore)
- Using react-hotkeys-hook (1.7M weekly downloads, modern hooks API)
- AI-first differentiation: Cmd+/ for AI chat toggle
