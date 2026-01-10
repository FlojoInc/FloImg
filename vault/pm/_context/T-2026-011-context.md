# Context: T-2026-011 Keyboard Shortcuts

**Task**: [[T-2026-011-keyboard-shortcuts]]
**Created**: 2026-01-10
**Status**: In Progress

## Overview

Add comprehensive keyboard shortcuts to FloImg Studio for power users. This enables keyboard-driven workflow editing with a slick implementation that follows accessibility standards.

## Requirements Gathered

From user request:

- Core workflow editing tasks should have shortcuts
- Settings interface for full customization (users can remap any shortcut)
- Some defaults pre-set, others user-assignable (empty by default)
- Must avoid OS/browser/system shortcut conflicts
- Works across both self-hosted and Studio Cloud
- Should feel slick and professional
- Must follow WCAG accessibility standards

## Scope Decisions

1. **Undo/redo deferred** to T-2026-012 (requires zundo middleware)
2. **Full customization** included (not just fixed defaults)
3. **Full shortcut set** (~20 shortcuts, not minimal MVP)

## Key Decisions

1. **Library choice**: react-hotkeys-hook
   - 1.7M weekly downloads
   - Modern hooks API
   - Automatic platform detection (mod+s → Cmd on Mac, Ctrl on Windows)
   - Focus-awareness built-in

2. **Architecture**: Centralized keyboard manager at `src/lib/keyboard/`
   - Single source of truth for all shortcuts
   - Easy to maintain and extend

3. **Customization**: VS Code-style recording UI
   - Click shortcut badge → "Press keys..." → validates and saves

## Default Shortcuts

**Workflow**: Save (Cmd+S), Execute (Cmd+Enter), New (Cmd+N), Export (Cmd+E), Import (Cmd+I)
**Editing**: Duplicate (Cmd+D), Delete (Del/Backspace), Select All (Cmd+A), Deselect (Esc)
**Canvas**: Zoom In (Cmd+=), Zoom Out (Cmd+-), Zoom Fit (Cmd+0), Pan (Space hold)
**UI**: Command Palette (Cmd+K), Shortcuts Help (Cmd+?), AI Chat (Cmd+/), Library (Cmd+B), Settings (Cmd+,)

## Files to Create

- `src/lib/keyboard/shortcuts.ts` - Shortcut definitions + defaults
- `src/lib/keyboard/useKeyboardShortcuts.tsx` - Global keyboard hook
- `src/lib/keyboard/types.ts` - TypeScript types
- `src/lib/keyboard/platformUtils.ts` - Platform detection
- `src/lib/keyboard/conflicts.ts` - Browser conflict detection
- `src/components/CommandPalette.tsx` - Cmd+K palette
- `src/components/KeyboardShortcutsModal.tsx` - Cmd+? help modal
- `src/components/KeyboardSettings.tsx` - Customization UI
- `src/components/KeyBadge.tsx` - Shortcut key display
- `src/components/ShortcutRecorder.tsx` - Recording widget

## Files to Modify

- `package.json` - Add react-hotkeys-hook
- `src/App.tsx` - Consume useKeyboardShortcuts hook
- `src/components/Toolbar.tsx` - Remove existing shortcuts (lines 102-116)
- `src/stores/settingsStore.ts` - Add keyboard settings

## Open Questions

None - all questions resolved in planning phase.

## Implementation Status

All implementation complete:

- [x] Install react-hotkeys-hook
- [x] Create keyboard manager module (`src/lib/keyboard/`)
- [x] Build KeyBadge component
- [x] Build ShortcutRecorder component
- [x] Build KeyboardSettings component
- [x] Build CommandPalette component (Cmd+K)
- [x] Build KeyboardShortcutsModal component (Cmd+?)
- [x] Integrate in App.tsx
- [x] Remove old shortcuts from Toolbar.tsx
- [x] Add 83 unit tests
- [ ] Cross-platform testing (manual)

## Files Created

```
src/lib/keyboard/
├── types.ts              # ShortcutAction, ShortcutCategory, etc.
├── platformUtils.ts      # isMac(), bindingToDisplay(), etc.
├── platformUtils.test.ts # 37 tests
├── shortcuts.ts          # SHORTCUT_DEFINITIONS, defaults
├── shortcuts.test.ts     # 15 tests
├── conflicts.ts          # Browser reserved, React Flow defaults
├── conflicts.test.ts     # 31 tests
├── useKeyboardShortcuts.tsx # Main hook
└── index.ts              # Exports

src/components/
├── KeyBadge.tsx           # Platform-aware key display
├── ShortcutRecorder.tsx   # VS Code-style recording
├── KeyboardSettings.tsx   # Full customization UI
├── CommandPalette.tsx     # Cmd+K Raycast-style palette
└── KeyboardShortcutsModal.tsx # Cmd+? help modal
```

## Next Steps

1. PR review
2. Cross-platform testing
3. Merge to main
