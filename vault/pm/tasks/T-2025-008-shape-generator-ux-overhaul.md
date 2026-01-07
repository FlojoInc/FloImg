---
tags: [type/task]
status: complete
priority: p2
created: 2025-01-07
updated: 2026-01-07
completed: 2026-01-07
parent:
children: []
epic:
---

# Task: Shape Generator UX Overhaul

## Task Details

- **Task ID**: T-2025-008
- **Status**: complete
- **Priority**: p2
- **Created**: 2025-01-07
- **Completed**: 2026-01-07

## Description

Redesign the Shape generator to fix the conceptual confusion where "gradient" is treated as a shape type instead of a fill type. The current implementation mixes geometry (circle, rectangle) with fill types (gradient, pattern) in a single `type` parameter, which breaks users' mental model.

**Core principle**: FloImg aims for end-to-end consistency across SDK → YAML → Studio → CLI → MCP. Fixing the abstraction at the SDK level ensures clarity flows through every interface.

**Current state**: Shape generator has 4 "types": `gradient`, `circle`, `rectangle`, `pattern`

- "Gradient" is actually a rectangle with a gradient fill
- "Pattern" is also a fill type, not a shape
- Only 2 actual geometric shapes

**Target state**: Separate shape type from fill type

```
Shape Type: [Rectangle | Circle | Ellipse | Triangle | Polygon | Star]
Fill Type:  [Solid | Gradient | Pattern | None]
```

## Acceptance Criteria

- [x] Shape type and fill type are separate parameters in the schema
- [x] Default is "Rectangle with Solid fill" (not gradient)
- [x] New shapes available: ellipse, triangle, polygon (with `sides` param), star (with `points` param)
- [x] Old schema parameters removed entirely (no backwards compatibility per [[No-Backwards-Compatibility]] principle)
- [x] All tests pass (113 tests, including 19 new shape tests)
- [x] Studio UI shows conditional fields based on shape/fill selection
- [x] Stroke support added (strokeColor, strokeWidth)

## Implementation Details

### Technical Approach

**Phase 1: Schema Restructure**

1. Replace `type` enum with `shapeType` and `fillType` parameters
2. Update fill-specific parameters:
   - Solid: `fillColor`
   - Gradient: `gradientColor1`, `gradientColor2`, `gradientDirection`
   - Pattern: `patternType`, `patternColor`, `patternBackground`
3. Add backward compatibility migration

**Phase 2: Add Missing Shapes**

- Ellipse (rx/ry radii)
- Triangle (equilateral)
- Polygon (with `sides` parameter, 3-20)
- Star (with `points` parameter)

**Phase 3: Studio UI Updates**

- Conditional field rendering based on shape/fill selection
- Progressive disclosure (basic → advanced options)

**Phase 4: Advanced Options**

- Stroke support (strokeColor, strokeWidth)
- Corner radius for rectangle
- Rotation parameter

### Files to Modify

- `packages/floimg/src/providers/svg/shapes.ts` - Schema + generation logic
- `packages/floimg/src/providers/svg/index.ts` - Exports (if needed)
- `apps/studio/frontend/src/components/NodeInspector.tsx` - Conditional field rendering
- `packages/floimg/test/` - Test updates

### Testing Required

- [ ] Unit tests for new shape types (ellipse, triangle, polygon, star)
- [ ] Unit tests for fill type combinations
- [ ] Integration tests for backward compatibility
- [ ] Manual testing in Studio UI

## Dependencies

- **Blocked By**: None
- **Related Tasks**: None

## Subtasks

<!-- Children auto-populated when subtasks are created -->

## Progress Notes

### Work Log

- **2025-01-07**: Task created from product triad review. PM, UI/UX, and dev perspectives synthesized.
- **2026-01-07**: Started implementation. Branch: feat/T-2025-008-shape-ux-overhaul
- **2026-01-07**: Implementation complete. Decided to remove backwards compatibility entirely per new "No Backwards Compatibility (Pre-1.0)" principle. Added vault/architecture/No-Backwards-Compatibility.md. PR #93 created and reviewed.
- **2026-01-07**: PR #93 merged, v0.10.0 released (npm publish successful). floimg-cloud updated to 0.9.0/0.3.4. floimg-web docs updated (PR #69). Task complete.

## Review Checklist

- [x] Code review completed (pr-reviewer agent approved)
- [x] Tests written and passing (113 tests, 19 new)
- [x] TypeScript types correct
- [x] Documentation updated (No-Backwards-Compatibility.md, CLAUDE.md, agent configs)
- [x] CHANGELOG updated (v0.10.0 released)
