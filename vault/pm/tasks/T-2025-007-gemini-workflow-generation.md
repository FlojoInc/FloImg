---
tags: [type/task]
status: in-progress
priority: p1
created: 2025-12-31
updated: 2025-12-31
parent:
children: []
github_issue:
---

# Task: Gemini 3 Pro Workflow Generation

## Task Details

**Task ID**: T-2025-007
**Status**: in-progress
**Priority**: p1
**Created**: 2025-12-31
**Completed**:
**GitHub Issue**:

## Description

Add AI-powered workflow generation to FloImg Studio using Gemini 3 Pro. Users describe what they want in natural language (e.g., "resize my image to 800x600 and convert to webp") and Gemini returns structured JSON matching the FloImg workflow schema.

This leverages Gemini 3's structured output capability (`response_json_schema`) to ensure the AI returns valid, executable workflow definitions that can be directly loaded into the Studio canvas.

### Why Gemini 3 Pro?

- **Structured outputs**: Native `response_json_schema` support ensures valid JSON matching our workflow schema
- **Reasoning**: Built-in thinking for understanding complex multi-step workflow requests
- **1M token context**: Can include full workflow schema + examples in context
- **Cost-effective**: $2/$12 per 1M tokens (input/output)

## Acceptance Criteria

- [x] Chat interface in Studio to describe workflows in natural language
- [x] Gemini 3 Pro integration with structured output returning valid workflow JSON
- [x] Workflow schema definition that Gemini can target (nodes, edges, parameters)
- [x] Generated workflows load directly onto the Studio canvas
- [x] Error handling for invalid/incomplete workflow descriptions
- [x] Loading states and user feedback during generation

## Implementation Details

### Technical Approach

1. **Workflow JSON Schema**: Define a JSON schema representing valid Studio workflows
   - Node types, positions, parameters
   - Edge connections between nodes
   - Validation rules

2. **Gemini Integration**: Backend endpoint calling Gemini 3 Pro API
   - Use `response_mime_type: "application/json"` + `response_json_schema`
   - Include workflow schema and examples in system prompt
   - Handle thought signatures for multi-turn conversations

3. **Chat UI**: Conversational interface for workflow creation
   - Text input for natural language descriptions
   - Preview of generated workflow before applying
   - Ability to refine ("make the output larger", "add a watermark step")

4. **Canvas Integration**: Load generated workflow onto React Flow canvas
   - Parse Gemini response into node/edge format
   - Auto-layout nodes if positions not specified
   - Validate before rendering

### Packages Affected

- `apps/studio/frontend` - Chat UI, workflow loading
- `apps/studio/backend` - Gemini API integration
- `apps/studio/shared` - Workflow schema types

### Testing Required

- [ ] Unit tests for workflow schema validation
- [ ] Integration tests for Gemini API calls
- [ ] E2E tests for chat-to-canvas flow
- [ ] Edge cases: invalid descriptions, partial workflows, API errors

## Dependencies

### Blocked By

- None

### Related Tasks

- T-2025-005 (Gemini generate prompt input) - Related AI integration work

## Subtasks

<!-- Auto-populated when children are created -->
<!-- Format: - [ ] [[T-YYYY-NNN.N]] - Description -->

## Progress Notes

### Work Log

- **2025-12-31**: Task created
- **2025-12-31**: Implementation complete
  - Added GeneratedWorkflowData types to shared package
  - Created AI workflow generator service using @google/genai
  - Added /api/generate/workflow endpoint
  - Built AIChat component with chat UI, loading states, error handling
  - Integrated workflow loading into canvas with auto-layout
  - Added "AI Generate" button to Studio UI

## Review Checklist

- [ ] Code review completed
- [ ] Tests written and passing
- [ ] TypeScript types correct
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

### Gemini 3 API Key Points

- Model ID: `gemini-3-pro-preview`
- Structured output: `response_mime_type: "application/json"` + `response_json_schema`
- Thinking: Default `thinking_level: "high"` is good for complex workflow reasoning
- Temperature: Keep at 1.0 (default) per Gemini 3 recommendations

### Example API Call

```typescript
const response = await client.models.generateContent({
  model: "gemini-3-pro-preview",
  contents: userDescription,
  config: {
    responseMimeType: "application/json",
    responseJsonSchema: workflowSchema,
  },
});
```
