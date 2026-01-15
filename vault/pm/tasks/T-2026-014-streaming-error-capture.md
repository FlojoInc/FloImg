---
tags: [type/task]
status: backlog
priority: p2
created: 2026-01-15
updated: 2026-01-15
parent:
children: []
epic: EPIC-2026-013
---

# Task: Add Error Capture to Streaming Handlers

## Task Details

- **Task ID**: T-2026-014
- **Status**: backlog
- **Priority**: p2
- **Created**: 2026-01-15
- **Epic**: EPIC-2026-013 (in floimg-hq)

## Description

Add `Sentry.captureException()` calls to SSE streaming error handlers so that network errors and AI generation failures are captured in error monitoring (GlitchTip for FSC, any Sentry-compatible service for self-hosted).

Currently, streaming errors only update UI state and are not reported to error monitoring.

## Acceptance Criteria

- [ ] SSE `onError` handlers call `Sentry.captureException()` with context
- [ ] Error captures include: component name, error type, relevant state
- [ ] Works safely when Sentry not initialized (no-op)
- [ ] Test: trigger network error, verify appears in GlitchTip

## Implementation Details

### Technical Approach

Add Sentry error capture to streaming error handlers. `Sentry.captureException()` is a no-op if Sentry isn't initialized, making this safe for self-hosted deployments.

### Files to Modify

1. **`apps/studio/frontend/src/components/AIChat.tsx`** (lines 108-113)

   ```typescript
   onError: (err) => {
     // ADD: Capture error in Sentry with context
     import * as Sentry from "@sentry/react";
     Sentry.captureException(err, {
       tags: { component: "AIWorkflowGenerator", type: "streaming" },
       extra: { phase: generationPhase, prompt: currentPrompt },
     });

     activeGenerationConnection = null;
     setError(err.message || "Failed to generate workflow");
     setIsLoading(false);
     setGenerationPhase(null);
   },
   ```

2. **`apps/studio/frontend/src/stores/workflowStore.ts`** (lines 578-594)

   ```typescript
   onError: (error) => {
     // ADD: Capture error in Sentry
     import * as Sentry from "@sentry/react";
     Sentry.captureException(error, {
       tags: { component: "WorkflowExecution", type: "streaming" },
       extra: { workflowId: state.workflow?.id },
     });

     // ... existing error handling
   },
   ```

3. **`apps/studio/frontend/src/api/sse.ts`** (optional - for all SSE errors)
   Consider adding capture at the SSE utility level for comprehensive coverage.

### Testing Required

- [ ] Manual testing: Disconnect network during streaming, verify error in GlitchTip
- [ ] Manual testing: Verify self-hosted (no Sentry) doesn't break
- [ ] Unit tests: Mock Sentry and verify captureException called on error

## Dependencies

- **Blocked By**: BUG-2026-007 (DSN must be set for errors to appear in GlitchTip)
- **Related Tasks**: T-2026-015 (non-streaming fallback)

## Progress Notes

### Work Log

- **2026-01-15**: Task created from EPIC-2026-013 investigation

## Review Checklist

- [ ] Code review completed
- [ ] Sentry import is conditional/safe
- [ ] Error context is useful for debugging
- [ ] No PII in error context
