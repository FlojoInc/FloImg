# Context: T-2025-004 Add AI Image Editing Node to FloImg Studio

**Task**: [[T-2025-004-studio-ai-image-editing]]
**Created**: 2025-12-29
**Status**: In Progress

## Overview

FloImg Studio currently has generators (create images), transforms (modify images deterministically), and save nodes. What's missing is the ability to use AI models to edit/refine images within the pipeline.

The goal is to add a node that:

1. Takes an image from the previous step
2. Sends it to an AI model (starting with Gemini) along with a text prompt
3. Returns the AI-edited image to continue the pipeline

This unlocks workflows like:

- Generate → AI refine → Save
- Load photo → AI enhance → Resize → Save
- Generate logo → AI iterate ("make it more minimal") → Export

## Key Decisions

### API Key Handling

**Decision needed**: How should users provide their API keys?

Options:

1. **Per-request** - User enters key in node settings, passed with each execution
2. **Studio settings** - Global settings panel, key stored in localStorage
3. **Environment variable** - For self-hosted, read from GEMINI_API_KEY env var
4. **Hybrid** - Support all three with priority order

Recommendation: Start with **Studio settings + per-request override**. This gives flexibility without complexity.

### Node Design

**Single node vs. provider-specific nodes?**

Options:

1. Generic "AI Edit" node with provider dropdown (Gemini, OpenAI, etc.)
2. Separate nodes per provider ("Gemini Edit", "DALL-E Edit", etc.)

Recommendation: Start with **Gemini-specific node**, generalize later. Keeps scope focused.

## Open Questions

1. Which Gemini model to target? (gemini-2.0-flash-preview-image-generation vs gemini-3-pro-image-preview)
2. Should we support multi-turn refinement in a single node, or require chaining nodes?
3. How to handle rate limits and quotas gracefully?
4. Should API key validation happen on save or on execution?

## Gemini API Research

From https://ai.google.dev/gemini-api/docs/image-generation:

- Gemini can generate AND edit images
- Uses `generateContent` with image parts
- Supports text + image input for editing
- Response includes generated image as base64

Example API shape:

```javascript
const result = await model.generateContent([
  { text: "Edit this image to make the sky more vibrant" },
  { inlineData: { mimeType: "image/png", data: base64Image } },
]);
```

## Next Steps

1. Review plan with user
2. Run `/s T-2025-004` to start work
3. Research Gemini API authentication and rate limits
4. Design Studio settings UI for API keys
5. Implement backend endpoint
6. Add frontend node type
