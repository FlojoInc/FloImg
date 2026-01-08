---
tags: [type/bug]
status: done
priority: p1
created: 2026-01-07
updated: 2026-01-07
github_issue:
---

# Bug: Minimap shows light background in dark mode

## Bug Details

**Bug ID**: BUG-2025-003
**Status**: done
**Priority**: p1
**Created**: 2026-01-07
**Fixed**: 2026-01-08
**GitHub Issue**:

## Description

The React Flow minimap in FloImg Studio displays a white/light background when the browser is in dark mode, making it the only element on screen that isn't correctly themed.

## Steps to Reproduce

1. Open FloImg Studio (studio.floimg.com or self-hosted)
2. Have browser/OS set to dark mode
3. Look at the minimap in the bottom-right corner of the canvas

## Expected Behavior

Minimap should have a dark background (`#27272a` / zinc-800) matching the rest of the dark theme.

## Actual Behavior

Minimap has a white background (`rgb(255, 255, 255)`), creating a jarring visual inconsistency.

## Environment

- **Package**: @teamflojo/floimg-studio-ui
- **Version**: 0.4.0
- **Affects**: FloImg Studio Cloud (studio.floimg.com) and any consumer of the library

## Root Cause Analysis

### Cause

The dark mode CSS rules exist in `index.css` but are not included in the library build:

1. `index.css` contains correct dark mode minimap overrides (lines 43-53)
2. `main.tsx` imports `index.css` (for standalone app mode)
3. `index.ts` (library entry point) does NOT import `index.css`
4. Library build (`vite build --mode lib`) excludes `main.tsx`
5. Result: dark mode CSS never reaches `dist/styles.css`
6. Consumers import `@teamflojo/floimg-studio-ui/styles.css` which lacks the rules

### Affected Code

- `apps/studio/frontend/src/index.ts` - missing CSS import
- `apps/studio/frontend/src/index.css` - has the rules but they don't ship

## Fix Details

### Technical Approach

Add `import "./index.css";` to `apps/studio/frontend/src/index.ts` so the dark mode CSS is bundled into the library's `dist/styles.css`.

### Testing Required

1. Build library and verify `grep "minimap" dist/styles.css` shows dark mode rules
2. Update floimg-cloud and visually verify minimap is dark
3. Use Chrome DevTools to confirm `backgroundColor` is `#27272a` not white

## Review Checklist

- [x] Root cause identified
- [x] Fix implemented
- [ ] Tests added to prevent regression
- [x] No breaking changes introduced
- [x] CHANGELOG updated

## Notes

- Single line fix
- Requires npm publish to fully deploy
