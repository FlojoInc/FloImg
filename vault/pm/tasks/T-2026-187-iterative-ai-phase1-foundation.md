---
tags: [type/task]
status: in-progress
priority: p1
created: 2026-02-03
updated: 2026-02-03
parent:
children: []
epic: EPIC-2026-019
---

# Task: Phase 1 - Persistent AI Panel with Canvas Awareness

## Task Details

- **Task ID**: T-2026-187
- **Status**: in-progress
- **Priority**: p1
- **Created**: 2026-02-03
- **Completed**:

## Description

Convert the AI Workflow Generator from a modal dialog to a persistent slide-out panel. The panel should:

1. Stay open while editing the canvas
2. Maintain conversation history across interactions
3. Be aware of what's currently on the canvas
4. Include execution results in AI context

## Acceptance Criteria

- [ ] AIChat refactored to AIPanel (slide-out from right)
- [ ] Panel stays open while editing canvas
- [ ] Conversation persists in session
- [ ] AI receives currentCanvas snapshot with each request
- [ ] AI can reference existing nodes in responses
- [ ] Execution results (images, status) included in context
- [ ] Full replacement mode still works (backwards compatible)

## Implementation Details

### Technical Approach

1. **UI Component**
   - Convert AIChat modal to AIPanel slide-out
   - Use CSS transitions for smooth open/close
   - Panel width ~400px, adjustable
   - Toggle button in toolbar

2. **State Management**
   - Create aiChatStore (Zustand) for:
     - messages[]
     - canvasSnapshot (updated on send)
     - lastExecutionResults
   - Subscribe to workflowStore for canvas changes

3. **Canvas Snapshot**
   - Add `computeCanvasSnapshot()` to workflowStore
   - Serialize nodes/edges without transient data (positions OK, execution state excluded)
   - Include node types, configurations, connections

4. **Backend Changes**
   - Update `/api/generate/workflow/stream` to accept `currentCanvas`
   - Update system prompt: "The user currently has X nodes on their canvas..."
   - AI should acknowledge existing workflow when generating

### Files to Modify

- `apps/studio/frontend/src/components/AIChat.tsx` → Refactor to `AIPanel.tsx`
- `apps/studio/frontend/src/stores/` → New `aiChatStore.ts`
- `apps/studio/frontend/src/stores/workflowStore.ts` → Add `computeCanvasSnapshot()`
- `apps/studio/frontend/src/App.tsx` → Panel integration, layout changes
- `apps/studio/frontend/src/components/Toolbar.tsx` → Toggle button
- `apps/studio/backend/src/ai/workflow-generator.ts` → Accept `currentCanvas`
- `apps/studio/backend/src/routes/generate.ts` → Update request type
- `apps/studio/shared/src/index.ts` → Add canvas snapshot types

### Testing Required

- [ ] Panel stays open while dragging nodes
- [ ] Conversation persists after closing/reopening panel
- [ ] AI mentions existing nodes when generating
- [ ] Execution results appear in AI context
- [ ] Full replacement mode works as before

## Dependencies

- **Blocked By**: None
- **Related Tasks**: T-2026-188 (Phase 2 - Iterative Operations)

## Progress Notes

### Work Log

- **2026-02-03**: Task created, starting implementation
