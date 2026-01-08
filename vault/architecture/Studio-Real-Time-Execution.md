# Studio Real-Time Execution Architecture

This document describes the real-time execution system in FloImg Studio, including SSE streaming, sequential execution, and the rationale behind these design decisions.

## Overview

FloImg Studio provides real-time visibility into workflow execution through Server-Sent Events (SSE) streaming. Users see each step's progress as it happens, rather than waiting for the entire workflow to complete.

## SSE Architecture

### POST-Based SSE

Standard SSE uses GET requests, but Studio needs to send workflow data (nodes, edges, AI provider configs) to the server. We implement manual SSE parsing over a POST request with streaming response:

```typescript
// Frontend: apps/studio/frontend/src/api/sse.ts
export function createSSEConnection<T>(
  url: string,
  body: unknown,
  handlers: SSEConnectionHandlers<T>
): SSEConnection {
  const controller = new AbortController();

  // POST request with JSON body, streaming response
  fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: controller.signal,
  });
  // ... manual SSE parsing

  return { abort: () => controller.abort() };
}
```

### SSE Event Types

**Execution events** (`/api/execute/stream`):

- `execution.started` - Includes total step count and node IDs
- `execution.step` - Per-step progress with status, imageId, preview, or data output
- `execution.completed` - Final image IDs and URLs
- `execution.error` - Error with optional node ID

**Generation events** (`/api/generate/workflow/stream`):

- `generation.started` - Model info
- `generation.progress` - Phase (analyzing, selecting_nodes, generating, validating)
- `generation.completed` - Generated workflow data
- `generation.error` - Error message

### Abort Handling

Both execution and generation support cancellation via `AbortController`:

```typescript
// Module-level reference (not in React state - SSEConnection isn't serializable)
let activeConnection: SSEConnection | null = null;

// Store when starting
activeConnection = createSSEConnection(...);

// Cancel when needed
if (activeConnection) {
  activeConnection.abort();
  activeConnection = null;
}
```

The SSE utility handles AbortError gracefully, calling `onClose()` instead of `onError()`.

## Sequential Execution

### Why Sequential Instead of Parallel?

The executor runs workflow steps **sequentially** rather than in parallel. This is an intentional design decision with these tradeoffs:

**Benefits of sequential execution:**

1. **Real-time progress** - Each step fires a callback immediately after completion
2. **Per-step moderation** - Content is checked before saving, preventing policy-violating images from being stored
3. **Predictable UX** - Users see clear step-by-step progress
4. **Simpler error handling** - Failed steps can be tracked and downstream dependencies skipped

**Cost:**

- Workflows with independent branches run slower than they could in parallel
- Example: A workflow with 3 independent generators takes 3x longer than parallel execution

**Rationale:**
For the Studio use case, immediate visual feedback is more valuable than raw execution speed. Users building workflows interactively benefit from seeing each step complete. Batch/headless execution (via CLI or API) can use the core `client.run()` which does parallel execution.

### Implementation

```typescript
// Backend: apps/studio/backend/src/floimg/executor.ts

// Track failed outputs to skip dependent steps
const failedOutputVars = new Set<string>();

for (let i = 0; i < remainingSteps.length; i++) {
  const step = remainingSteps[i];

  // Check if input dependency failed
  if (stepIn && failedOutputVars.has(stepIn)) {
    failedOutputVars.add(stepOut); // Propagate failure
    callbacks?.onStep?.({ status: "skipped", ... });
    continue;
  }

  callbacks?.onStep?.({ status: "running", ... });

  // Execute single step
  const results = await client.run(singleStepPipeline);

  // Moderate, save, callback
  if (moderationResult.flagged) {
    failedOutputVars.add(stepOut);
    callbacks?.onStep?.({ status: "error", ... });
    continue;
  }

  callbacks?.onStep?.({ status: "completed", ... });
}
```

### Partial Failure Handling

When a step fails (moderation or otherwise):

1. Its output variable is added to `failedOutputVars`
2. Dependent steps check their input against `failedOutputVars`
3. If input is failed, step fires `status: "skipped"` with reason and propagates failure
4. Independent steps continue executing

This prevents cryptic "variable not found" errors and gives users clear feedback about why steps were skipped.

## Frontend Integration

### Zustand Store

The `workflowStore` manages execution state:

```typescript
// Store structure
execution: {
  status: "idle" | "running" | "completed" | "error",
  nodeStates: Map<nodeId, "running" | "completed" | "error" | "skipped">,
  dataOutputs: Map<nodeId, { dataType, content, parsed }>,
}
```

### Real-Time Node Updates

When SSE events arrive:

1. Node border color changes (running = teal pulse, completed = green, error = red, skipped = gray)
2. Image previews appear immediately in the output inspector
3. Text/vision outputs show truncated preview with "View Full Output" button

## Extending This Pattern

To add real-time features to new endpoints:

1. **Backend**: Use `sendSSE()` helper in route handler
2. **Frontend**: Use `createSSEConnection()` with typed events
3. **Store**: Track connection reference at module level for cancellation
4. **UI**: Show progress indicator with cancel button during streaming

## Related Documentation

- [[Studio-Technical-Architecture]] - Overall Studio architecture
- [[Pipeline-Execution-Engine]] - Core floimg execution (parallel)
- [[Content-Moderation]] - Moderation system details
