---
tags: [bug, studio, ai-generator]
status: backlog
priority: p1
created: 2026-01-30
repo: floimg
---

# BUG-2026-014: AI Generator Creates Invalid Composite Node Handles

## Bug Details

| Field    | Value                           |
| -------- | ------------------------------- |
| ID       | BUG-2026-014                    |
| Priority | P1 (blocks AI workflow feature) |
| Created  | 2026-01-30                      |
| Status   | Backlog                         |

## Description

The AI Workflow Generator creates edges with incorrect `targetHandle` values for composite nodes, causing workflow validation to fail when executing.

## Reproduction Steps

1. Open AI Generate in FloImg Studio
2. Request a workflow involving composite operations (e.g., "create logo lockup by compositing symbol and text")
3. AI generates workflow with composite node
4. Click Execute
5. Nothing happens (silent failure)
6. Console shows: "Transform node requires an input image connection"

## Root Cause

**Handle name mismatch between AI generator and validation:**

AI Generator creates edges like:

```json
{"source":"base_canvas","target":"c1_lockup","targetHandle":"base"}
{"source":"c1_resize_symbol","target":"c1_lockup","targetHandle":"overlays[0]"}
```

But `nodesToPipeline()` validation only accepts:

```typescript
const imageEdge = edges.find(
  (e) => e.target === node.id && (e.targetHandle === "image" || !e.targetHandle)
);
```

The validation expects `targetHandle === "image"` or undefined, but composite nodes use `"base"` and `"overlays[N]"`.

## Fix Approach

Two options:

### Option A: Fix AI Generator (Recommended)

Update the system prompt examples in `workflow-generator.ts` to use correct handle names that match what the actual nodes expect.

### Option B: Fix Validation

Update `nodesToPipeline()` in `apps/studio/shared/src/index.ts` to handle composite nodes specially, accepting their unique handle names.

### Option C: Both

Do both for defense in depth.

## Files to Modify

- `apps/studio/backend/src/ai/workflow-generator.ts` - Fix examples in system prompt
- `apps/studio/shared/src/index.ts` - Consider special handling for composite

## Investigation Needed

- What are the ACTUAL handle names the composite node expects?
- Are there other nodes with similar handle mismatches?

## Acceptance Criteria

- [ ] AI-generated workflows with composite nodes execute successfully
- [ ] Validation error messages are shown in UI (not just console)
- [ ] Handle names in AI prompt match actual node definitions
