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

1. Skip undefined images instead of crashing
2. Provide a clear error message indicating which input failed
3. Allow partial success if some inputs are valid

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
- Overlay filtering: skips invalid overlays, allows partial success
- Descriptive errors: identifies which overlay indices failed
- If all overlays invalid, throws error with indices list

## Acceptance Criteria

- [x] Composite handles undefined inputs without crashing
- [x] Error message identifies which input was undefined
- [x] Partial success allowed when some overlays are valid

## Related

- Composite transform implementation
