# T-2026-013: NodePalette UX Redesign

---

tags: [task, studio-ui, ux, dark-mode]
status: backlog
priority: p1
created: 2026-01-11
updated: 2026-01-11

---

## Task Details

| Field    | Value      |
| -------- | ---------- |
| ID       | T-2026-013 |
| Priority | P1         |
| Created  | 2026-01-11 |

## Description

Redesign the NodePalette component to fix critical dark mode issues and improve overall UX. The current design has visibility problems, visual noise from colored borders, and lacks clear affordances for drag interactions.

**Critical bugs:**

- Description text is BLACK on dark backgrounds (invisible)
- Category labels (BASIC, UTILITY, etc.) nearly invisible in dark mode
- Top bar has dark mode contrast issues

**Design problems:**

- Colored left borders on every node create visual noise
- No affordances indicating items are draggable
- Colored title text (7 different accent colors) is distracting
- Small description text (11px) below WCAG recommendations
- Minimap not respecting dark mode

## Acceptance Criteria

- [ ] Description text readable in dark mode (fix black text bug)
- [ ] Category labels visible in dark mode
- [ ] Top bar readable in dark mode
- [ ] Colored left borders removed or replaced with neutral styling
- [ ] Title text uses neutral colors (not accent colors)
- [ ] Drag affordances (grip dots) visible on palette items
- [ ] Description text increased to 13px minimum
- [ ] Minimap respects dark mode
- [ ] Visual comparison confirms cleaner, less distracting left panel

## Implementation Notes

- Root cause: `.floimg-palette-item__desc` lacks proper dark mode color override
- Design direction: Neutral, developer-tool aesthetic (like VS Code, Linear)
- Typography should create hierarchy, not color
- Color reserved for state/action only (locked, primary CTA)
