---
tags: [type/task]
status: in-progress
priority: p2
created: 2025-12-29
updated: 2025-12-29
parent:
children: []
github_issue:
---

# Task: Add AI Image Editing Node to FloImg Studio

## Task Details

**Task ID**: T-2025-004
**Status**: in-progress
**Priority**: p2
**Created**: 2025-12-29
**Completed**:
**GitHub Issue**:

## Description

Add an AI image editing node to FloImg Studio that can use the current pipeline image as a reference/input for AI models. This enables workflows where users can:

1. Generate or load an image
2. Pass it to an AI model for editing/refinement
3. Continue the pipeline with the AI-modified result

Initial target: **Gemini image generation/editing API** (gemini-2.0-flash-preview-image-generation or newer models like gemini-3-pro-image-preview).

Reference: https://ai.google.dev/gemini-api/docs/image-generation

The node should accept user-provided API keys (stored client-side or in Studio settings) to enable the feature without requiring server-side key management.

## Acceptance Criteria

- [ ] New "AI Edit" or "AI Refine" node type in FloImg Studio
- [ ] Node accepts image input from previous pipeline step
- [ ] Node accepts text prompt for editing instructions
- [ ] User can provide their own Gemini API key via Studio settings/UI
- [ ] API key stored securely (client-side localStorage or Studio settings)
- [ ] Node outputs edited image to continue pipeline
- [ ] Error handling for API failures, invalid keys, rate limits
- [ ] Basic documentation for users on how to obtain and use API keys

## Implementation Details

### Technical Approach

**Backend changes:**

- Extend floimg-google plugin or create dedicated Gemini support
- Add image editing endpoint that accepts: image, prompt, API key
- Handle Gemini's multimodal API for image input + text prompt

**Frontend changes:**

- New node type: "AI Edit" or "Gemini Edit"
- Settings panel for API key management
- Secure key storage (never send to backend logging)

**API key handling options:**

1. Client-side only (key passed with each request, never stored server-side)
2. Encrypted storage in Studio settings (if user auth exists)
3. Environment variable for self-hosted deployments

### Packages Affected

- `apps/studio/backend/` - New endpoint for AI editing
- `apps/studio/frontend/` - New node type, settings UI
- `packages/floimg-google/` - Extend with Gemini image editing (or create new package)

### Testing Required

- Unit tests for Gemini API integration
- Integration test for image editing workflow
- Manual testing of API key flow in Studio UI

## Dependencies

### Blocked By

- None

### Related Tasks

- T-2025-001 (AI Transforms) - Similar pattern for AI provider integration

## Subtasks

<!-- Auto-populated when children are created -->

## Progress Notes

### Work Log

- **2025-12-29**: Task created

## Review Checklist

- [ ] Code review completed
- [ ] Tests written and passing
- [ ] TypeScript types correct
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

- Gemini API reference: https://ai.google.dev/gemini-api/docs/image-generation
- Consider multi-turn conversation support for iterative refinement (see vault idea: Multi-Pass AI Refinement)
- May need to handle different Gemini model versions (2.0 flash, 3.0 pro, etc.)
