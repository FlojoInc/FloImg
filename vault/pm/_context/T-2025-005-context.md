# Context: T-2025-005 Gemini Generate Prompt Input

**Task**: [[T-2025-005-gemini-generate-prompt-input]]
**Created**: 2025-12-31
**Status**: In Progress

## Overview

Enable gemini-generate to accept a prompt via input handle, matching gemini-edit's capability. This enables dynamic prompt workflows where upstream nodes generate prompts that flow into image generation.

## Key Files

- `packages/floimg-google/src/transforms.ts` - gemini-generate schema and implementation
- `apps/studio/frontend/src/editor/nodeTypes.tsx` - GeneratorNode component
- `apps/studio/backend/src/floimg/executor.ts` - Pipeline execution

## Pattern Reference

gemini-edit already accepts prompt input. Need to replicate:
1. Schema flag indicating it accepts text input
2. Handle on the node UI
3. Executor logic to resolve prompt from connected nodes

## Key Decisions

-

## Open Questions

- Should prompt handle completely override static prompt, or append/combine?
- Should this be a generator-level flag or specific to gemini-generate?

## Next Steps

1. Review plan with user
2. Run `/s T-2025-005` to start work
