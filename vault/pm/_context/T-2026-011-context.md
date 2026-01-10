# Context: T-2026-011 Terminal Interface

**Task**: [[T-2026-011-terminal-interface]]
**Created**: 2026-01-09
**Status**: In Progress

## Overview

Building a terminal-like interface as a new tab in FloImg Studio. The goal is to provide an alternative workflow creation and execution experience for users who prefer command-driven interfaces over visual node editors.

Key design goals:

- Welcoming, conversational feel (like chatting with Claude)
- Slash commands for common operations
- Dynamic views via slide-out panels (not inline cards)
- Inline execution progress and results

## Architecture Decisions

### State Management

Created a separate `terminalStore.ts` rather than extending `workflowStore`:

- Clean separation of concerns
- Terminal-specific state (messages, panels, conversation mode) distinct from workflow data
- Simpler testing and maintenance

### Message System

Six message types with specialized rendering:

- `user` - Right-aligned, teal styling for commands
- `assistant` - AI avatar, supports workflow preview with "Apply to Canvas"
- `system` - Left-aligned, supports markdown formatting
- `execution` - Live progress bar with node status indicators
- `result` - Image grid with thumbnails
- `error` - Red styling with error icon

### Panel Pattern

Slide-out panels for selection:

- WorkflowSelectorPanel - Browse/select/load saved workflows
- ImageSelectorPanel - Browse generated images with thumbnails
- Potential future: UploadSelectorPanel for file selection

## Key Files

- `stores/terminalStore.ts` - Central state management
- `components/terminal/Terminal.tsx` - Main container with panel rendering
- `components/terminal/TerminalInput.tsx` - Command parsing and execution
- `components/terminal/TerminalFeed.tsx` - Message rendering with auto-scroll

## Open Questions

1. Should the Terminal have its own AI conversation history separate from AIChat?
2. How to handle "Apply to Canvas" from terminal when workflow previews are shown?
3. Should we add keyboard shortcuts for common commands?

## Next Steps

1. Implement Phase 3: AI conversation for /new command
   - Stream AI responses inline
   - Show workflow preview in assistant messages
   - "Apply to Canvas" action switches to Editor tab

2. Consider additional commands:
   - /export - Export current workflow to YAML
   - /load <name> - Load workflow by name directly
   - /history - Show recent executions
