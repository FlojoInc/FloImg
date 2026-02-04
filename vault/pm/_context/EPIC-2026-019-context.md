# EPIC-2026-019: Iterative AI Workflow Editing - Context

## Overview

This document tracks technical context and decisions for the Iterative AI Workflow Editing epic.

## Architecture

### State Flow

```
User types prompt in AIPanel
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  AIPanel sends to /api/generate/workflow/stream         │
│  Request body includes:                                 │
│    - prompt: user's text                                │
│    - history: conversation messages                     │
│    - model: selected Gemini model                       │
│    - currentCanvas: { nodes, edges, nodeCount }         │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Backend detects canvas content:                        │
│    hasCanvasContent = currentCanvas?.hasContent         │
│                                                         │
│  If NO canvas content:                                  │
│    → generateWorkflow() - full replacement mode         │
│    → Returns: GeneratedWorkflowData                     │
│                                                         │
│  If HAS canvas content:                                 │
│    → generateIterativeWorkflow() - operations mode      │
│    → Returns: { operations, explanation, suggestions }  │
└─────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────┐
│  Frontend handles SSE events:                           │
│                                                         │
│  generation.completed → User clicks "Apply to Canvas"   │
│  generation.iterative → Auto-apply via applyAIOperations│
└─────────────────────────────────────────────────────────┘
```

### Operation Types

```typescript
type AIOperationType = "add" | "modify" | "delete" | "connect" | "disconnect";

interface AIWorkflowOperation {
  type: AIOperationType;
  nodeId?: string; // Target node for modify/delete
  nodeType?: string; // e.g., "transform:sharp:resize" for add
  label?: string; // Human-readable label
  parameters?: Record<string, unknown>;
  source?: string; // For connect/disconnect
  target?: string;
  sourceHandle?: string;
  targetHandle?: string;
  explanation?: string; // Per-operation explanation
}
```

### Gemini Structured Output Schema

The AI uses `OPERATIONS_SCHEMA` to generate valid operations:

```typescript
{
  type: Type.OBJECT,
  properties: {
    mode: { enum: ["replace", "operations"] },
    explanation: { type: Type.STRING },
    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    operations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { enum: ["add", "modify", "delete", "connect", "disconnect"] },
          // ... see OPERATIONS_SCHEMA in workflow-generator.ts
        }
      }
    }
  }
}
```

## Key Files

### Backend

- `apps/studio/backend/src/ai/workflow-generator.ts`
  - `generateIterativeWorkflow()` - Main iterative generation function
  - `OPERATIONS_SCHEMA` - Gemini structured output schema
  - `buildIterativeSystemPrompt()` - Canvas-aware system prompt

- `apps/studio/backend/src/routes/generate.ts`
  - `/workflow/stream` endpoint handles both modes

### Frontend

- `apps/studio/frontend/src/stores/aiChatStore.ts`
  - Conversation persistence
  - Canvas snapshot storage
  - Execution context tracking

- `apps/studio/frontend/src/stores/workflowStore.ts`
  - `applyAIOperations()` - Applies operations to canvas

- `apps/studio/frontend/src/components/AIPanel.tsx`
  - Slide-out panel UI
  - SSE event handling
  - Change summary display

### Shared Types

- `apps/studio/shared/src/index.ts`
  - `AIWorkflowOperation`, `AIIterativeResponse`
  - `CanvasSnapshot`, `GenerationSSEIterative`
  - `GenerateWorkflowRequestWithCanvas`

## Design Decisions

### Why Operations Instead of Diffs?

**Decision**: Use explicit operations (add/modify/delete) instead of JSON diff format.

**Rationale**:

1. More semantic - AI understands "add resize node" better than "add object at path /nodes/3"
2. Easier validation - Each operation type has clear schema requirements
3. Better UX - Can show "1 node added, 1 modified" instead of raw diffs
4. Simpler merge - Operations are atomic, easier to apply/undo

### Why Auto-Apply for Operations?

**Decision**: Operations auto-apply without "Apply to Canvas" button.

**Rationale**:

1. Full workflow generation is a big change - needs explicit confirmation
2. Operations are targeted changes - user explicitly asked for them
3. Undo is always available (React Flow handles this)
4. Reduces friction for iterative editing

### Why Separate SSE Event Type?

**Decision**: Added `generation.iterative` event instead of reusing `generation.completed`.

**Rationale**:

1. Different response shape (operations vs workflow)
2. Different frontend handling (auto-apply vs user-confirm)
3. Clear distinction for analytics/logging
4. Backwards compatible - old clients ignore unknown events

## Testing Checklist

### Phase 1 - Foundation

- [ ] Panel stays open while dragging nodes on canvas
- [ ] Conversation persists after closing/reopening panel
- [ ] AI mentions existing nodes when generating
- [ ] Keyboard shortcut (Cmd+J) toggles panel

### Phase 2 - Operations

- [ ] "Add resize node" creates and connects node
- [ ] "Change the generator to use DALL-E" modifies existing node
- [ ] "Remove the grayscale transform" deletes node + edges
- [ ] "Disconnect the resize from output" removes specific edge
- [ ] Operations apply without losing manual node positions

### Phase 3 - Merge (COMPLETE)

- [x] Warning when AI modifies manually-changed nodes
- [x] Conflict resolution UI shows before/after
- [x] Position-only changes don't trigger conflicts

### Phase 4 - UX (COMPLETE)

- [x] Quick action buttons based on canvas state
- [x] Conversation saved with workflow (localStorage persistence)
- [x] Keyboard shortcuts for common actions (⌘/ toggle AI panel)

## Known Issues

1. **Position stacking**: Multiple added nodes may overlap (mitigated with vertical offset)
2. **No explicit undo**: Relies on React Flow's built-in undo (works but not AI-aware)

## Phase 3 - Conflict Detection Architecture

### Conflict Types

```typescript
type ConflictType =
  | "modified_by_both" // User and AI both modified the same node
  | "deleted_by_ai" // User modified a node, AI wants to delete it
  | "deleted_by_user" // User deleted a node, AI wants to modify it
  | "reconnect_conflict"; // User disconnected edge, AI wants to reconnect
```

### Snapshot Comparison Flow

```
AI applies operations → saveAppliedSnapshot() → stores current canvas state
                                                     │
User makes edits (or not) ─────────────────────────►│
                                                     │
AI sends new operations → detectConflicts() ────────┘
         │                      │
         ▼                      ▼
Compare currentSnapshot to lastAppliedSnapshot:
  - Find nodes user modified (params or label changed)
  - Find nodes user deleted
  - Find edges user disconnected
                                │
                                ▼
For each AI operation, check if it conflicts:
  - modify + user modified same node → conflict
  - modify + user deleted target → conflict
  - delete + user modified target → conflict
  - connect + user disconnected same edge → conflict
                                │
                                ▼
        ┌───────────────────────┴───────────────────────┐
        ▼                                               ▼
  hasConflicts: true                            hasConflicts: false
  Show ConflictResolutionModal                  Apply all operations
```

### Resolution Options

| Resolution  | Behavior                                         |
| ----------- | ------------------------------------------------ |
| `keep_mine` | Skip the AI operation, keep user's version       |
| `accept_ai` | Apply the AI operation, overwrite user's changes |
| `skip`      | Skip the operation entirely (neither applies)    |

### Key Files (Phase 3)

- `apps/studio/shared/src/index.ts` - Conflict type definitions
- `apps/studio/frontend/src/stores/aiChatStore.ts` - detectConflicts(), lastAppliedSnapshot
- `apps/studio/frontend/src/components/ConflictResolutionModal.tsx` - Resolution UI
- `apps/studio/frontend/src/components/AIPanel.tsx` - Integration
- `apps/studio/frontend/test/conflictDetection.test.ts` - 10 conflict detection tests
- `apps/studio/shared/test/ai-operations.test.ts` - 5 conflict type tests

## Phase 4 - Enhanced UX Implementation

### Quick Actions

Quick actions provide contextual suggestions based on canvas state and execution context:

| Canvas State               | Quick Actions                          |
| -------------------------- | -------------------------------------- |
| Empty canvas               | "Generate new workflow"                |
| Only generators            | "Add post-processing", "Add save node" |
| Missing save node          | "Add save node"                        |
| After successful execution | "Improve results"                      |
| After failed execution     | "Fix errors"                           |
| 2+ nodes                   | "Add variations"                       |

Quick actions are limited to 3 maximum to avoid overwhelming the user.

### Keyboard Shortcuts

The AI panel integrates with the broader keyboard shortcut system:

- `⌘/` or `Ctrl+/`: Toggle AI panel (configurable in settings)
- Shortcuts defined in `src/lib/keyboard/shortcuts.ts`
- User-customizable via settings UI

### Apply as New Workflow

When applying a generated workflow, users can choose:

- **Replace**: Apply to current canvas (default behavior)
- **As New**: Apply as a new workflow, treating it as unsaved

This allows users to fork their workflow without losing the original.

### Key Files (Phase 4)

- `apps/studio/frontend/src/components/AIPanel.tsx` - Quick actions UI
- `apps/studio/frontend/src/lib/keyboard/shortcuts.ts` - Shortcut definitions
- `apps/studio/frontend/test/quickActions.test.ts` - 10 quick action tests

## Related PRs

- PR #249: Phase 1 - Persistent AI Panel with Canvas Awareness
- PR #250: Phase 2 - AI Iterative Operations
- PR #251: Phase 3 - Merge & Conflict Handling
- PR #252: Phase 4 - Enhanced UX
