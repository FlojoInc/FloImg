---
tags: [type/bug]
status: resolved
priority: p2
created: 2026-01-15
updated: 2026-01-15
---

# Bug: Composite Node Crashes on Undefined Input

## Bug Details

- **Bug ID**: BUG-2026-002
- **Status**: resolved
- **Priority**: p2
- **Created**: 2026-01-15

## Problem

When an upstream node fails (returns undefined), the composite node crashes with:

```
Cannot read properties of undefined (reading 'bytes')
```

## Expected Behavior

The composite node should gracefully handle undefined inputs:

1. Fail fast with clear error message (consistent with other transforms)
2. Identify which specific input(s) failed
3. Never crash with cryptic "undefined" errors

## Root Cause

The composite transform assumes all input images are valid and tries to access `.bytes` without checking for undefined.

## Reproduction

1. Create a workflow with multiple parallel branches feeding into a composite node
2. Have one branch fail (e.g., AI generation error)
3. Execute workflow
4. Composite crashes instead of handling the failure gracefully

## Resolution

Added validation in `packages/floimg/src/providers/transform/sharp.ts`:

- Base image validation: throws clear error if base is missing
- Overlay validation: fails fast if ANY overlay is invalid (consistent with other transforms)
- Descriptive errors: identifies which overlay indices are invalid
- Empty overlays array returns base unchanged

This follows the **fail-fast** pattern used by all other transforms, ensuring end-to-end consistency across SDK/Studio/CLI/MCP.

## Acceptance Criteria

- [x] Composite handles undefined inputs without crashing
- [x] Error message identifies which input was undefined
- [x] Behavior is consistent with other transforms (fail-fast)

## Related

- Composite transform implementation
