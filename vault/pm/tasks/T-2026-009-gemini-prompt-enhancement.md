---
tags: [type/task]
status: in-progress
priority: p2
created: 2026-01-09
updated: 2026-01-09
parent:
children: []
github_issue:
---

# Task: Add Prompt Enhancement Toggle to Gemini Nodes

## Task Details

**Task ID**: T-2026-009
**Status**: in-progress
**Priority**: p2
**Created**: 2026-01-09
**Completed**:
**GitHub Issue**:

## Description

Add a toggle to Gemini generate and Gemini edit nodes that automatically enhances user prompts based on Google's image generation best practices from their official documentation.

When enabled, the enhancement should transform simple prompts into detailed, descriptive prompts following Google's guidance:

- **Be Hyper-Specific**: Convert keywords into narrative descriptions with specific details
- **Provide Context and Intent**: Explain the purpose of the image (e.g., "for a minimalist skincare brand")
- **Use Photographic Language**: Add camera angles, lens types, lighting descriptions for realistic images
- **Step-by-Step Instructions**: Break complex scenes into ordered elements
- **Semantic Negative Prompts**: Convert "no X" into positive scene descriptions
- **Camera Control**: Use terms like `wide-angle shot`, `macro shot`, `low-angle perspective`

## Acceptance Criteria

- [ ] Add `enhancePrompt` boolean parameter to `geminiGenerateSchema`
- [ ] Add `enhancePrompt` boolean parameter to `geminiEditSchema`
- [ ] Implement prompt enhancement logic that:
  - Expands terse prompts into descriptive narratives
  - Adds appropriate photographic/artistic terminology
  - Preserves user intent while adding detail
  - Works for both generation and editing contexts
- [ ] Enhancement happens before API call (not a separate LLM call initially)
- [ ] Default to `false` to preserve current behavior
- [ ] Update Studio UI to show toggle in node inspector

## Implementation Details

### Technical Approach

Option A: **Rule-based enhancement** (recommended for MVP)

- Pattern matching to detect prompt type (photorealistic, illustration, logo, etc.)
- Template-based expansion using Google's prompt templates
- Fast, no additional API calls, predictable results

Option B: **LLM-assisted enhancement** (future consideration)

- Use Gemini text model to enhance prompts
- More flexible but adds latency and cost
- Could be a separate "Pro" mode

### Packages Affected

- `packages/floimg-google` - Add enhancement logic and schema parameters
- `apps/studio/frontend` - Update node inspector to show toggle (if not auto-generated from schema)

### Testing Required

- Unit tests for prompt enhancement logic
- Test various prompt types:
  - Simple keywords ("cat")
  - Partial descriptions ("a red car on a road")
  - Already detailed prompts (should pass through mostly unchanged)
  - Edit prompts ("make the sky blue")

## Dependencies

### Blocked By

- None

### Related Tasks

- T-2025-007: Gemini 3 Pro Workflow Generation (uses similar prompt patterns)

## Subtasks

<!-- Auto-populated when children are created -->

## Progress Notes

### Work Log

- **2026-01-09**: Task created

## Review Checklist

- [ ] Code review completed
- [ ] Tests written and passing
- [ ] TypeScript types correct
- [ ] Documentation updated (if applicable)
- [ ] CHANGELOG updated (if user-facing)

## Notes

- Reference: Google's image generation prompting guide (user-provided docs)
- Key templates from Google's guide:
  - Photorealistic: "A photorealistic [shot type] of [subject], [action], set in [environment]..."
  - Stylized: "A [style] sticker of a [subject], featuring [characteristics]..."
  - Product: "A high-resolution, studio-lit product photograph of [product]..."
