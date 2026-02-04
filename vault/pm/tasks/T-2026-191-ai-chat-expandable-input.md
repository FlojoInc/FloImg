---
tags: [type/task]
status: backlog
priority: p2
created: 2026-02-03
updated: 2026-02-03
parent:
children: []
epic: EPIC-2026-019
---

# Task: AI Chat Expandable/Scrollable Text Input

## Task Details

- **Task ID**: T-2026-191
- **Status**: backlog
- **Priority**: p2
- **Created**: 2026-02-03
- **Completed**:

## Description

The AI Workflow Generator text entry field is currently small, not expandable, and not easily scrollable. Users writing longer prompts (especially for complex workflows) struggle to see and edit their full input.

## Acceptance Criteria

- [ ] Text area auto-expands as user types (up to a max height)
- [ ] Max height allows ~6-8 lines before scrolling
- [ ] Smooth scrolling within the text area
- [ ] Resize handle for manual expansion
- [ ] Collapsed state shows 2-3 lines minimum
- [ ] Works in both modal (current) and panel (future) layouts

## Implementation Details

### Technical Approach

1. Replace fixed-height input with auto-expanding textarea
2. Use CSS `resize: vertical` with `min-height` and `max-height`
3. Or use JS-based auto-resize on input event
4. Ensure proper scrollbar styling in dark mode

### Files to Modify

- `apps/studio/frontend/src/components/AIChat.tsx` → Textarea implementation
- `apps/studio/frontend/src/index.css` → Scrollbar/resize styles

### Testing Required

- [ ] Short prompts show compact input
- [ ] Long prompts auto-expand
- [ ] Very long prompts scroll
- [ ] Manual resize works
- [ ] Dark mode scrollbar visible

## Dependencies

- **Blocked By**: None (can be done in parallel with Phase 1)
- **Related Tasks**: T-2026-187 (will benefit from this when becoming AIPanel)

## Progress Notes

### Work Log

- **2026-02-03**: Task created from user feedback
