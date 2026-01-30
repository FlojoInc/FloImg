# Execution History Architecture

FloImg Studio maintains an execution history that allows users to review past workflow runs and their outputs.

## Overview

The execution history stores a chronological list of workflow runs with their outputs as data URLs. This approach ensures universal access regardless of deployment context (self-hosted, FSC guest, or FSC authenticated).

## Data Model

### ExecutionRun

```typescript
interface ExecutionRun {
  id: string; // Unique identifier (run_timestamp_random)
  timestamp: number; // Unix timestamp when run completed
  status: "completed" | "error";
  duration: number; // Execution time in milliseconds
  nodeCount: number; // Number of nodes in workflow
  outputs: ExecutionRunOutput[];
  error?: string; // Error message if status is "error"
  errorNodeId?: string; // Node that caused the error
}

interface ExecutionRunOutput {
  nodeId: string;
  nodeName: string; // Human-readable name (generator/transform name)
  preview: string; // Data URL (base64) - works universally
  imageId?: string; // Cloud storage ID (FSC authenticated only)
}
```

## Storage Strategy

### Why Data URLs?

Node previews already use data URLs (base64 encoded images) which work for all user types:

- **Self-hosted**: No external dependencies, images are inline
- **FSC Guests**: No auth/CORS issues since data is embedded
- **FSC Authenticated**: Works alongside optional cloud storage

### Memory Management

- History limited to **20 runs** to prevent memory bloat
- Oldest runs are removed when limit is exceeded
- Data URLs are typically 100KB-500KB per image

### Persistence

| User Type         | Storage                           | Survives Refresh | Survives Tab Close |
| ----------------- | --------------------------------- | ---------------- | ------------------ |
| Self-hosted       | In-memory                         | No               | No                 |
| FSC Guest         | In-memory                         | No               | No                 |
| FSC Authenticated | In-memory (planned: localStorage) | Planned: Yes     | No                 |

**Current implementation**: Session-only for all users. History clears on page refresh.

**Future enhancement**: Add localStorage persistence for authenticated users.

## Integration Points

### workflowStore.ts

The execution history is managed in the Zustand workflow store:

```typescript
// State
executionHistory: ExecutionRun[];

// Actions
addExecutionRun: (run: ExecutionRun) => void;
clearHistory: () => void;
```

### Execution Flow

1. `execute()` starts, records `executionStartTime`
2. SSE events stream in, `previews` accumulate
3. On `execution.completed` or `execution.error`:
   - Calculate duration from start time
   - Build outputs array from `execution.previews`
   - Create `ExecutionRun` with status and timing
   - Call `addExecutionRun()` to persist

## UI Components (Planned)

### History Tab

Replaces the "Images" tab with a list of execution runs:

- Status badges (completed/error)
- Thumbnail grid using data URLs
- Timestamp and duration
- Actions: View Details, Re-run, Delete

### Guest Notice

FSC guests see a banner indicating history is temporary with sign-up CTA.

## Integration with Showcase (EPIC-2026-017)

The History tab is the first step in the sharing journey:

```
Run Workflow → History Tab → Share to Showcase
              (internal)    (public)
```

**History** shows personal execution history (ephemeral, data URLs).
**Showcase** is the public community feed for sharing images and workflows.

The ExecutionHistory component accepts an optional `onShare` callback for FSC:

```tsx
<ExecutionHistory isGuest={false} onShare={(run) => openShareModal(run)} />
```

This allows FSC to connect the History tab to the ShareToShowcaseModal from EPIC-2026-017.

## Related

- [[Studio-Real-Time-Execution]] - SSE streaming for execution events
- [[Studio-Technical-Architecture]] - Overall Studio architecture
