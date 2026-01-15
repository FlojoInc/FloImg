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

# Task: Add Non-Streaming Fallback for AI Workflow Generator

## Task Details

- **Task ID**: T-2026-015
- **Status**: backlog
- **Priority**: p2
- **Created**: 2026-01-15
- **Epic**: EPIC-2026-013 (in floimg-hq)

## Description

When SSE streaming fails, automatically retry with the non-streaming endpoint instead of showing an error immediately. This provides resilience against proxy/network issues that affect streaming but not standard HTTP requests.

## Context

Investigation confirmed:

- Non-streaming endpoint (`POST /api/generate/workflow`) works
- Streaming endpoint (`POST /api/generate/workflow/stream`) times out
- `client.ts` already has `generateWorkflow()` method for non-streaming (currently unused)

## Acceptance Criteria

- [ ] On streaming error, automatically retry with non-streaming endpoint
- [ ] Show appropriate UI feedback during fallback (e.g., "Retrying...")
- [ ] If both streaming and non-streaming fail, show error
- [ ] User doesn't need to know fallback happened (seamless experience)
- [ ] Progress phases still shown for streaming when it works

## Implementation Details

### Technical Approach

1. Wrap streaming call in try-catch
2. On error, call non-streaming `generateWorkflow()` from client
3. Transform response to match expected format
4. Handle both success and failure of fallback

### Files to Modify

1. **`apps/studio/frontend/src/components/AIChat.tsx`**
   - Modify streaming `onError` handler to trigger fallback
   - Add state for fallback attempt
   - Use `client.generateWorkflow()` as fallback

2. **`apps/studio/frontend/src/api/client.ts`**
   - Verify `generateWorkflow()` method works correctly
   - May need to ensure response format matches expectations

### Example Implementation

```typescript
// In AIChat.tsx onError handler
onError: async (err) => {
  // Try non-streaming fallback
  try {
    setGenerationPhase("retrying");
    const result = await client.generateWorkflow({ prompt, history });
    if (result.success && result.workflow) {
      // Success! Process workflow as if streaming completed
      handleWorkflowGenerated(result.workflow, result.message);
      return;
    }
    // Non-streaming also failed
    setError(result.error || "Failed to generate workflow");
  } catch (fallbackErr) {
    // Both failed - show original error
    Sentry.captureException(err, { extra: { fallbackError: fallbackErr } });
    setError(err.message || "Failed to generate workflow");
  }
  setIsLoading(false);
  setGenerationPhase(null);
},
```

### Testing Required

- [ ] Manual testing: Simulate streaming failure, verify fallback works
- [ ] Manual testing: Simulate both endpoints failing, verify error shown
- [ ] Unit tests: Mock SSE failure, verify client.generateWorkflow called
- [ ] Integration tests: Test full flow with network issues

## Dependencies

- **Related Tasks**:
  - T-2026-014 (error capture - capture fallback attempts)
  - BUG-2026-006 (fixing SSE timeout is better, but fallback provides resilience)

## Progress Notes

### Work Log

- **2026-01-15**: Task created from EPIC-2026-013 investigation

## Review Checklist

- [ ] Code review completed
- [ ] Fallback is seamless to user
- [ ] Both endpoints can fail gracefully
- [ ] Error context captures fallback attempt
