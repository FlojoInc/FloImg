---
tags: [type/task]
status: backlog
priority: p3
created: 2026-01-15
updated: 2026-01-15
parent:
children: []
epic: EPIC-2026-013
---

# Task: Add Model Selector to AI Workflow Generator

## Task Details

- **Task ID**: T-2026-016
- **Status**: backlog
- **Priority**: p3
- **Created**: 2026-01-15
- **Epic**: EPIC-2026-013 (in floimg-hq)

## Description

Add a model selector dropdown to the AI Workflow Generator, allowing users to choose which AI model generates their workflows. Currently hardcoded to `gemini-3-pro-preview`.

## Current State

Model is hardcoded in 4 locations:

1. **Backend constant**: `apps/studio/backend/src/ai/workflow-generator.ts:24`

   ```typescript
   const MODEL_ID = "gemini-3-pro-preview";
   ```

2. **Frontend badge**: `apps/studio/frontend/src/components/AIChat.tsx:188-189`

   ```typescript
   <span>Gemini 3 Pro</span>
   ```

3. **SSE started event**: `apps/studio/backend/src/routes/generate.ts:79`

   ```typescript
   model: "gemini-3-pro-preview",
   ```

4. **Cloud status**: `floimg-cloud/packages/api/src/routes/generate.ts:220,226`
   ```typescript
   let backendModel = "gemini-3-pro-preview";
   ```

## Acceptance Criteria

- [ ] Model selector dropdown in AIChat header
- [ ] Model passed in request body to backend
- [ ] Backend accepts and uses requested model
- [ ] UI badge updates to show selected model
- [ ] Default model if none selected (gemini-3-pro-preview)
- [ ] Model selection persisted (localStorage or user prefs)

## Implementation Details

### Technical Approach

1. **Update API contract** - Add `model` to `GenerateWorkflowRequest`
2. **Backend changes** - Accept model param, map to provider
3. **Frontend changes** - Add dropdown, pass model in requests
4. **Cloud proxy changes** - Pass model through to OSS backend

### Models to Support (Phase 1)

| Model                  | Provider  | Notes                      |
| ---------------------- | --------- | -------------------------- |
| `gemini-3-pro-preview` | Google    | Current default            |
| `gpt-4o`               | OpenAI    | Needs OPENAI_API_KEY       |
| `claude-3-sonnet`      | Anthropic | Future - needs integration |

### Files to Modify

**Backend (apps/studio/backend)**:

- `src/ai/workflow-generator.ts` - Make MODEL_ID a parameter
- `src/routes/generate.ts` - Accept model from request
- May need provider-specific prompt adjustments

**Frontend (apps/studio/frontend)**:

- `src/components/AIChat.tsx` - Add model selector dropdown
- `src/api/client.ts` - Pass model in requests
- `src/types/` or shared types - Update request interface

**Cloud (floimg-cloud)**:

- `packages/api/src/routes/generate.ts` - Pass model through proxy

**Shared types (apps/studio/shared)**:

- Update `GenerateWorkflowRequest` interface

### UI Design

```
┌─────────────────────────────────────────┐
│ AI Workflow Generator    [Gemini 3 ▼]  │
│                                         │
│ ...                                     │
└─────────────────────────────────────────┘

Dropdown options:
- Gemini 3 Pro (default)
- GPT-4o
- (more as added)
```

### Testing Required

- [ ] Unit tests: Model selection state management
- [ ] Integration tests: Different models generate valid workflows
- [ ] Manual testing: Verify model badge updates
- [ ] Manual testing: Verify selection persists

## Dependencies

- **Blocked By**: None (can be done independently)
- **Nice to have first**: BUG-2026-006, T-2026-014, T-2026-015 (reliability first)

## Open Questions

1. Should model selection be per-user preference or per-session?
2. What happens if user selects a model but API key isn't configured?
3. Should we show model capabilities (context size, strengths)?

## Progress Notes

### Work Log

- **2026-01-15**: Task created from EPIC-2026-013 investigation

## Review Checklist

- [ ] Code review completed
- [ ] Model selection UI is intuitive
- [ ] Error handling for unavailable models
- [ ] Documentation updated
