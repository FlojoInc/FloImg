# T-2026-012: Export Composable NodePalette from Library

---

tags: [task, studio-ui, architecture]
status: backlog
priority: p1
created: 2026-01-10
updated: 2026-01-10

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

- [ ] NodePalette exported from floimg-studio-ui index.ts
- [ ] NodePalette accepts render props or callbacks for:
  - `onNodeLocked?: (node: NodeDefinition) => void` - called when locked node clicked
  - `isNodeLocked?: (node: NodeDefinition) => boolean` - determines if node shows locked state
  - `renderLockedBadge?: (node: NodeDefinition) => ReactNode` - custom locked indicator
- [ ] NodePalette uses `floimg-palette-item` CSS classes (consistent theming)
- [ ] CloudNodePalette updated to wrap NodePalette, only providing cloud-specific logic
- [ ] Visual parity between OSS and FSC node palettes confirmed

## Implementation Notes

- Keep backwards compatible - existing OSS usage should work unchanged
- Cloud-specific features are opt-in via props
- Consider exporting `NodePaletteItem` component separately for more granular customization
