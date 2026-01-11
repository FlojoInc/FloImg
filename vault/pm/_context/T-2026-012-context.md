# Context: T-2026-012 Composable NodePalette

**Task**: [[T-2026-012-composable-node-palette]]
**Created**: 2026-01-10
**Status**: Planning

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

-

## Implementation Notes

-

## Next Steps

1. Review NodePalette.tsx structure
2. Choose extension approach
3. Add exports to library
4. Update CloudNodePalette to use library component
5. Verify visual parity
