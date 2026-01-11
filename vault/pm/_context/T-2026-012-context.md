# Context: T-2026-012 Composable NodePalette

**Task**: [[T-2026-012-composable-node-palette]]
**Created**: 2026-01-10
**Status**: In Progress (awaiting FSC deployment)

## Overview

CloudNodePalette (in floimg-cloud) reimplements the entire node palette with inline Tailwind classes instead of using the library's themed CSS classes. This causes FSC to look visually different from OSS Studio.

The fix is to make NodePalette composable with extension points so cloud-specific features (locking, upgrade prompts) can be added without reimplementing the entire component.

## Current State

**OSS NodePalette** (`apps/studio/frontend/src/components/NodePalette.tsx`):

- Uses `floimg-palette-item`, `floimg-palette-item--amber`, etc.
- Styled via `studio-theme.css`
- Clean, consistent theming

**CloudNodePalette** (`floimg-cloud/packages/studio-cloud/src/components/CloudNodePalette.tsx`):

- Uses inline Tailwind: `bg-amber-50`, `bg-blue-50`, `bg-teal-50`
- ~580 lines reimplementing what OSS has
- Adds: locked state, upgrade prompts, cloud API fetching

## Design Approach

### Option A: Render Props

```tsx
<NodePalette
  isNodeLocked={(node) => node.locked}
  onLockedNodeClick={(node) => showUpgradeModal()}
  renderNodeBadge={(node) => node.locked && <LockIcon />}
/>
```

### Option B: Composition with Slots

```tsx
<NodePalette
  nodeItemWrapper={({ node, children }) => <LockedWrapper node={node}>{children}</LockedWrapper>}
/>
```

### Option C: Export NodePaletteItem

```tsx
// CloudNodePalette uses library's item component
import { NodePaletteItem } from "@teamflojo/floimg-studio-ui";

// Add locking logic around it
<NodePaletteItem node={node} locked={node.locked} onLockedClick={() => showUpgrade()} />;
```

## Key Decisions

- Chose Option C (Export NodePaletteItem) as it's the most flexible
- NodePaletteItem is the building block; NodePalette internally uses it
- Cloud provides locked state, badges, and handlers via props

## Implementation Notes

- Created `NodePaletteItem.tsx` with OSS-neutral extension props (disabled, badge, alternateMessage)
- Added CSS: `.floimg-palette-item--disabled`, `.floimg-palette-item__header`, `.floimg-palette-item__alternate-message`
- Refactored `NodePalette.tsx` to use `NodePaletteItem` internally
- Updated `CloudNodePalette.tsx` to use library component (582 → 390 lines)
- PR review caught OSS boundary violation: renamed `locked` → `disabled`, `upgradeMessage` → `alternateMessage`
- Removed purple variant per brand guidelines

## Next Steps

1. ~~Review NodePalette.tsx structure~~ ✓
2. ~~Choose extension approach~~ ✓ (NodePaletteItem)
3. ~~Add exports to library~~ ✓
4. ~~Update CloudNodePalette~~ ✓
5. ~~Create PR for floimg → merge → release~~ ✓ (PR #129, v0.15.3)
6. ~~Update floimg-cloud pnpm-lock → create PR~~ ✓ (PR #4)
7. Verify visual parity after FSC deployment
