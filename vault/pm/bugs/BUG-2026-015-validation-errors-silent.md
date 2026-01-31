---
tags: [bug, studio, ux]
status: backlog
priority: p1
created: 2026-01-30
repo: floimg
---

# BUG-2026-015: Workflow Validation Errors Are Silent

## Bug Details

| Field    | Value                  |
| -------- | ---------------------- |
| ID       | BUG-2026-015           |
| Priority | P1 (critical UX issue) |
| Created  | 2026-01-30             |
| Status   | Backlog                |

## Description

When a workflow fails validation (e.g., missing input connections), clicking Execute does nothing with no feedback to the user. Errors are only logged to browser console.

## Reproduction Steps

1. Create a workflow with an unconnected transform node
2. Click Execute
3. Observe: nothing happens, no error shown
4. Open browser DevTools → Console
5. See: "Transform node requires an input image connection"

## Expected Behavior

- Validation errors shown prominently in UI
- Specific nodes with issues highlighted
- Actionable error messages (e.g., "Resize node needs an image input - connect a generator or another transform")

## Root Cause

The `nodesToPipeline()` function throws an error, which is caught but not surfaced to the user. The execution just silently fails.

## Fix Approach

1. Catch validation errors from `nodesToPipeline()` in the Execute handler
2. Show error in a toast/modal
3. Optionally highlight the problematic node(s)

```typescript
try {
  const { pipeline } = nodesToPipeline(nodes, edges);
  // ... execute
} catch (error) {
  showError(error.message); // Surface to user
  // Optionally: highlightNode(error.nodeId);
}
```

## Files to Modify

- `apps/studio/frontend/src/editor/WorkflowEditor.tsx` or wherever Execute is handled
- Consider adding node ID to error messages in `nodesToPipeline()` for better debugging

## Acceptance Criteria

- [ ] Validation errors shown in UI (toast, modal, or inline)
- [ ] Error message is actionable (tells user what to fix)
- [ ] User doesn't need to open DevTools to understand the problem
- [ ] (Nice to have) Problematic node highlighted on canvas
