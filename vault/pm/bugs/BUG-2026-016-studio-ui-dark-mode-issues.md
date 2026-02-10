---
tags: [type/bug]
status: completed
priority: p2
created: 2026-02-03
updated: 2026-02-03
completed: 2026-02-03
github_issue:
---

# Bug: Studio UI issues - dark mode, upload, toolbar hover

## Bug Details

**Bug ID**: BUG-2026-016
**Status**: completed
**Priority**: p2
**Created**: 2026-02-03
**Fixed**: 2026-02-03
**GitHub Issue**:

## Description

Three related UI issues found in FloImg Studio (FSC):

### Issue 1: White box behind Input node in dark mode

A white rectangular box appears behind the Upload Image (Input) node in dark mode, visible around the node's dashed selection border. The node content itself is correctly styled dark, but React Flow's wrapper has a white background.

### Issue 2: Upload click not working in FSC

Clicking the "Drop or click" area in an Input node doesn't open the file picker dialog. The file input ref click isn't being triggered, likely due to event propagation being captured by React Flow before reaching the onClick handler.

### Issue 3: Inconsistent toolbar hover effects

The top-right icon buttons have inconsistent hover effects:

- Workspace & My Images buttons: Gray hover (inline Tailwind)
- AI Settings & Save Workflow buttons: Teal hover (`floimg-toolbar__btn` class)

## Steps to Reproduce

### Issue 1

1. Go to studio.floimg.com
2. Enable dark mode (system preference or OS setting)
3. Drag an "Upload Image" node onto the canvas
4. Select the node
5. Observe white box behind node, visible around the dashed selection border

### Issue 2

1. Go to studio.floimg.com
2. Drag an "Upload Image" node onto the canvas
3. Click the "Drop or click" area
4. Expected: File picker dialog opens
5. Actual: Nothing happens

### Issue 3

1. Go to studio.floimg.com in dark mode
2. Hover over the Workspace icon (folder) - gray background
3. Hover over the AI Settings icon (gear) - teal background
4. The inconsistency is visually apparent

## Expected Behavior

1. All nodes should have transparent/dark backgrounds in dark mode
2. Clicking the drop zone should open the native file picker
3. All toolbar icon buttons should have consistent hover styling

## Actual Behavior

1. White box visible behind Input node in dark mode
2. Click does nothing - file picker doesn't open
3. Some buttons have gray hover, others have teal hover

## Environment

- **Package**: @teamflojo/floimg-studio-frontend
- **Version**: 0.10.3
- **Deployment**: studio.floimg.com (FSC)
- **OS**: macOS (dark mode)
- **Browser**: Chrome

## Root Cause Analysis

### Issue 1 - White box

React Flow's `.react-flow__node` has default `background-color: rgb(255, 255, 255)` which is not overridden in dark mode CSS.

**Affected Code**: `apps/studio/frontend/src/editor/studio-theme.css`

### Issue 2 - Upload click

The onClick handler on the drop zone div at line 467 of nodeTypes.tsx may have its event captured by React Flow before execution. Missing `e.stopPropagation()`.

**Affected Code**: `apps/studio/frontend/src/editor/nodeTypes.tsx:467`

### Issue 3 - Inconsistent hover

- Workspace button: `hover:bg-zinc-100 dark:hover:bg-zinc-700` (inline Tailwind)
- My Images button: `hover:bg-zinc-200 dark:hover:bg-zinc-700` (inline Tailwind)
- AI Settings button: `floimg-toolbar__btn` class (teal hover from CSS)
- Save Workflow button: `floimg-toolbar__btn` class (teal hover from CSS)

**Affected Code**: `apps/studio/frontend/src/components/Toolbar.tsx` (or wherever these buttons are defined)

## Fix Details

### Technical Approach

**Issue 1 - Add dark mode override for React Flow node wrapper:**

```css
@media (prefers-color-scheme: dark) {
  .react-flow__node {
    background: transparent;
  }
}
```

**Issue 2 - Add stopPropagation to onClick handler:**

```tsx
onClick={(e) => {
  e.stopPropagation();
  fileInputRef.current?.click();
}}
```

**Issue 3 - Standardize on `floimg-toolbar__btn` class for all icon buttons**

### Testing Required

- [x] Visual test: Input node in dark mode - no white box
- [x] Functional test: Click drop zone - file picker opens
- [x] Visual test: All toolbar icons have same hover effect

## Review Checklist

- [x] Root cause identified
- [x] Fix implemented
- [ ] Tests added to prevent regression
- [x] No breaking changes introduced
- [ ] CHANGELOG updated (minor styling fix, not user-facing feature)

## Fix Summary

All three issues resolved across two PRs:

### PR #238 (floimg) - Issues 1 & 2

- **Dark mode fix**: Added CSS override in `studio-theme.css` for `.react-flow__node { background: transparent }` in dark mode media query
- **Upload click fix**: Added `e.stopPropagation()` to the drop zone click handler in `nodeTypes.tsx`

### PR #127 (floimg-cloud) - Issue 3

- **Toolbar hover fix**: Replaced inline Tailwind classes with `floimg-toolbar__btn` CSS class on WorkspaceButton and MyImagesButton components

## Notes

- All three issues were found during visual debugging session
- Used Chrome DevTools MCP to identify React Flow's default white background
- Issue 3 required changes to floimg-cloud (FSC-specific components)
