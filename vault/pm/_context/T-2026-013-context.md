# Context: T-2026-013 NodePalette UX Redesign

**Task**: [[T-2026-013-node-palette-ux-redesign]]
**Created**: 2026-01-11
**Status**: Planning

## Overview

The NodePalette has critical dark mode issues and design problems that hurt usability. The description text is literally black (`rgb(0,0,0)`) on dark backgrounds - completely invisible. The 7 different accent colors create visual noise and violate brand guidelines.

## Key Findings

**CSS Bug**: `.floimg-palette-item__desc` is inheriting black text color instead of using `--studio-text-subtle` in dark mode.

**Design Issues**:

- Colored left borders (3px) on every item = rainbow effect
- Colored title text = 7 different accent colors
- No drag affordances = users don't know items are draggable
- 11px description text = below WCAG minimum

## Design Direction

**Before**: Colorful, boutique, 7 accent colors
**After**: Neutral, professional, developer-tool aesthetic

Reference: VS Code, Linear, Figma - let content provide visual interest, keep UI chrome minimal.

## Files to Modify

1. `apps/studio/frontend/src/editor/studio-theme.css` - Dark mode fixes, border removal, typography
2. `apps/studio/frontend/src/components/NodePaletteItem.tsx` - Add grip dots
3. `apps/studio/frontend/src/components/NodePalette.tsx` - Category header styling
4. Toolbar component - Dark mode contrast
5. Minimap - Dark mode colors

## Next Steps

1. Run `/s T-2026-013` to start work
2. Fix critical dark mode bugs first (Phase 1)
3. Remove colored borders and simplify (Phase 2)
4. Add drag affordances (Phase 3)
5. Fix minimap (Phase 4)
