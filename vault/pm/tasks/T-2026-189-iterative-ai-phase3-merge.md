---
tags: [type/task]
status: complete
priority: p1
created: 2026-02-03
updated: 2026-02-03
parent:
children: []
epic: EPIC-2026-019
---

# Task: Phase 3 - Merge & Conflict Handling

## Task Details

- **Task ID**: T-2026-189
- **Status**: complete
- **Priority**: p1
- **Created**: 2026-02-03
- **Completed**: 2026-02-03

## Description

Gracefully handle conflicts when user makes manual edits after AI generation. Detect when AI changes conflict with manual edits and provide resolution UI.

## Acceptance Criteria

- [x] Track `lastAppliedSnapshot` in aiChatStore
- [x] Detect when nodes have been modified since last AI apply
- [x] Warning when AI changes conflict with manual edits
- [x] Conflict types: modified_by_both, deleted_by_ai, etc.
- [x] User can choose which changes to keep
- [x] Non-conflicting changes merge cleanly

## Implementation Details

### Technical Approach

1. **Snapshot Tracking**
   - Store snapshot after each AI apply
   - Compare current state to snapshot before next apply
   - Identify manually changed nodes

2. **Conflict Detection**
   - Node modified by user AND by AI operation → conflict
   - Node deleted by AI but modified by user → conflict
   - Position-only changes → no conflict (always keep user position)

3. **Conflict Resolution UI**
   - Modal showing conflicting nodes
   - Side-by-side comparison (before/after)
   - Per-node accept/reject
   - "Accept all AI" / "Keep all mine" bulk actions

### Files to Modify

- `apps/studio/frontend/src/stores/aiChatStore.ts` → lastAppliedSnapshot
- `apps/studio/frontend/src/stores/workflowStore.ts` → Merge logic
- `apps/studio/frontend/src/components/AIPanel.tsx` → Conflict UI
- `apps/studio/frontend/src/components/` → New ConflictResolutionModal

### Testing Required

- [x] Manually move node → AI modifies → no position conflict
- [x] Manually change node property → AI changes same property → conflict shown
- [x] Manually delete node → AI modifies same node → conflict shown
- [x] Accept/reject individual conflicts works

## Dependencies

- **Blocked By**: T-2026-188 (Phase 2 - Operations)
- **Related Tasks**: T-2026-190 (Phase 4 - Enhanced UX)

## Progress Notes

### Work Log

- **2026-02-03**: Task created
- **2026-02-03**: Implemented conflict detection types in shared package
- **2026-02-03**: Added lastAppliedSnapshot and detectConflicts to aiChatStore
- **2026-02-03**: Created ConflictResolutionModal component with bulk actions
- **2026-02-03**: Integrated conflict detection into AIPanel.tsx
- **2026-02-03**: Added 10 tests for conflict detection (frontend)
- **2026-02-03**: Added 5 tests for conflict types (shared)
- **2026-02-03**: All 161 tests passing - COMPLETE
