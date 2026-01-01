# Context: T-2025-007 Gemini Workflow Generation

**Task**: [[T-2025-007-gemini-workflow-generation]]
**Created**: 2025-12-31
**Status**: Implementation Complete

## Overview

This feature transforms how users create workflows in FloImg Studio. Instead of manually dragging nodes and configuring parameters, users describe what they want in plain English, and Gemini 3 Pro returns a complete workflow definition.

**User flow:**

1. User opens chat panel: "I want to resize my image to 800x600, convert to webp, and upload to S3"
2. Gemini understands the request and returns structured JSON
3. Workflow appears on canvas with: Source → Resize → Format → S3 nodes connected
4. User can refine via chat: "Make the resize step use 'cover' mode instead"

## Key Decisions

### Gemini 3 Pro vs Flash

**Decision**: Use `gemini-3-pro-preview` for initial implementation

**Rationale**:

- Complex workflow understanding benefits from Pro's reasoning capabilities
- Structured output works identically on both
- Can add Flash as a "quick mode" later for simpler workflows
- Cost difference is manageable for conversational use

### Schema Strategy

**Decision**: Define a JSON Schema that maps directly to React Flow node/edge format

**Rationale**:

- Gemini's `response_json_schema` ensures valid output
- Direct mapping to React Flow reduces transformation code
- Schema can include valid node types from registry

### Conversation Mode

**Decision**: Support multi-turn refinement

**Rationale**:

- Users rarely get it perfect first try
- Gemini 3's thought signatures enable context preservation
- Matches natural "design by conversation" UX

## Open Questions

1. **Node registry**: How do we expose available node types to Gemini?
   - Option A: Embed full registry in system prompt
   - Option B: Use function calling to query registry
   - Option C: Static schema with common node types

2. **Layout**: Should Gemini specify node positions or use auto-layout?
   - Option A: Gemini provides rough positions
   - Option B: Always auto-layout after generation
   - Option C: User preference

3. **API key management**: Where does the Gemini API key live?
   - Cloud users: Server-side, managed by FloImg Cloud
   - Self-hosted: User provides their own key

4. **Rate limiting**: How do we handle API quota?

## Technical Notes

### Workflow Schema Draft

```typescript
interface GeneratedWorkflow {
  nodes: {
    id: string;
    type: string; // Must match registry: 'generate', 'resize', 'format', etc.
    label?: string;
    parameters: Record<string, unknown>;
    position?: { x: number; y: number };
  }[];
  edges: {
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
  }[];
}
```

### System Prompt Strategy

The system prompt should include:

1. Workflow schema definition
2. Available node types with their parameters
3. Example workflows (few-shot learning)
4. Instructions for handling ambiguity

### Gemini 3 Integration Notes

From the docs:

- Use `thinking_level: "high"` for complex workflow planning
- Keep `temperature: 1.0` (default)
- Handle thought signatures in multi-turn conversations
- Structured output: combine `responseMimeType` + `responseJsonSchema`

## Next Steps

1. ~~Define the workflow JSON schema~~ - Done
2. ~~Build backend Gemini integration~~ - Done
3. ~~Create chat UI component~~ - Done
4. ~~Integrate with canvas~~ - Done
5. Create PR for review
6. Test with real Gemini API key

## Implementation Summary

### Files Created/Modified

**Backend:**

- `apps/studio/backend/src/ai/workflow-generator.ts` - Gemini 3 Pro integration
- `apps/studio/backend/src/routes/generate.ts` - API endpoints
- `apps/studio/backend/src/routes/index.ts` - Route registration

**Frontend:**

- `apps/studio/frontend/src/components/AIChat.tsx` - Chat UI component
- `apps/studio/frontend/src/api/client.ts` - API client functions
- `apps/studio/frontend/src/stores/workflowStore.ts` - loadGeneratedWorkflow method
- `apps/studio/frontend/src/App.tsx` - Integration and "AI Generate" button

**Shared:**

- `apps/studio/shared/src/index.ts` - GeneratedWorkflowData types
