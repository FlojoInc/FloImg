# T-2026-012: Export Composable NodePalette from Library

---

tags: [task, studio-ui, architecture]
status: in-progress
priority: p1
created: 2026-01-10
updated: 2026-01-11

---

## Task Details

| Field    | Value      |
| -------- | ---------- |
| ID       | T-2026-012 |
| Priority | P1         |
| Created  | 2026-01-10 |

## Description

Export a composable `NodePalette` from `@teamflojo/floimg-studio-ui` with extension points for cloud-specific features (node locking, upgrade prompts). This allows CloudNodePalette to wrap the library component instead of reimplementing it entirely.

Currently, CloudNodePalette reimplements all styling with inline Tailwind classes (`bg-amber-50`, `bg-blue-50`, etc.) instead of using the library's `floimg-palette-item` CSS classes. This causes visual inconsistency between OSS Studio and FSC.

## Acceptance Criteria

- [x] NodePaletteItem exported from floimg-studio-ui index.ts
- [x] NodePaletteItem accepts extension props (OSS-neutral naming):
  - `disabled?: boolean` - determines if node shows disabled state
  - `onDisabledClick?: (node: NodeDefinition) => void` - called when disabled node clicked
  - `badge?: ReactNode` - custom badge (lock icon, "Cloud" tag, etc.)
  - `alternateMessage?: string` - message shown for disabled nodes
- [x] NodePaletteItem uses `floimg-palette-item` CSS classes (consistent theming)
- [x] CSS updated with disabled state and header styles
- [x] CloudNodePalette updated to use NodePaletteItem (floimg-cloud PR #4)
- [ ] Visual parity between OSS and FSC node palettes confirmed (pending FSC deployment)

## Implementation Notes

- Implemented granular NodePaletteItem (more flexible than modifying NodePalette)
- NodePalette refactored to use NodePaletteItem internally
- Cloud-specific features are opt-in via props
- Reduced CloudNodePalette from 582 lines to 390 lines
