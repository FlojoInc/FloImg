# PROJECT STATUS

**Last Updated**: 2026-01-04

## Current Focus

**T-2025-007: Gemini 3 Pro Workflow Generation** (PR #64 ready for merge)

Natural language to workflow JSON using Gemini 3 Pro structured outputs.

- AI chat interface with example prompts
- Structured output support (jsonSchema → multiple output handles)
- Reference image chaining for composite workflows
- prePrompt for dynamic prompt context

## Next Up

- **T-2025-006**: Add node duplication in FloImg Studio
- Additional FloImg Studio UX improvements

## Just Completed

**Gallery → Images Rename** (2026-01-01)

- Renamed Studio "Gallery" tab to "Images" (PR #67 merged)
- Part of EPIC-2025-010 nomenclature overhaul
- Published floimg-studio-ui@0.2.1

**BUG-2025-002: Fix node drop position on canvas** (2025-12-31)

- Second node dropped on canvas now appears at correct position
- Created EditorDropZone component using `screenToFlowPosition` for proper coordinate conversion
- PR #66 merged

**BUG-2025-001: Fix cloud save node inspector** (2025-12-31)

- Cloud save nodes now show "Save to FloImg Cloud" header and "Filename" field
- Filesystem save nodes still show "Destination" and file path description
- PR #65 merged

**T-2025-005: Add Prompt Input to Gemini Generate** (2025-12-31)

- Pink text input handle on AI generator nodes
- Enables text/vision → gemini-generate workflows
- Added prePrompt parameter for combining static + dynamic prompts

**STUDIO-T-2025-001: Workflow Persistence** (2025-12-31)

- localStorage persistence via zustand/persist
- Save, load, delete, rename, duplicate workflows
- Keyboard shortcut (Cmd+S) for quick save
- Unsaved changes indicator

**STUDIO-T-2025-002: Remove Cloud Code from OSS** (2025-12-31)

- Removed authStore, useGuestUsage, TOSConsent, AuthModal
- FloImg Studio is now pure open-source
- Cloud features live in floimg-cloud repo

**T-2025-004: AI Text/Vision/Editing Nodes** (2025-12-31)

- PR #46 merged (Brandon's implementation)
- Added Gemini Text, Gemini Vision, Gemini Edit nodes
- Added Grok Text, Grok Vision nodes (floimg-xai package)
- Multi-output routing with outputSchema support
- Provider-specific naming with providerLabel field
- Published floimg-google@0.2.0 to npm

**T-2025-003: Fix Node Dragging + UX Issues** (2025-12-26)

- Fixed: Nodes can now be dragged on canvas (added `nodesDraggable` prop)
- Fixed: [object Object] display bug in node parameters
- Node width verified as reasonable (173px)
- Branch: `fix/T-2025-003-node-dragging`

**T-2025-001: AI Transforms and Community Documentation** (2025-12-25)

- Added OpenAI transforms: edit (inpaint) and variations
- Created @teamflojo/floimg-replicate package with 4 transforms
- Added comprehensive community documentation in vault/community/
- Added GitHub issue and PR templates
- PR #17 merged

## Recent Releases

**v0.8.0** (2025-12-31)

- AI text/vision nodes (Gemini Text, Vision, Edit; Grok Text, Vision)
- AI workflow generation chat (Gemini 3 Pro structured outputs)
- Node duplication (Cmd+D)
- Multi-reference image support for Gemini nodes
- Fix: node drop position accounts for viewport zoom/pan
- floimg-studio-ui@0.2.0, floimg-studio-shared@0.2.0

**v0.6.0** (2025-12-31)

- AI Chat workflow generation (Gemini 3 Pro structured outputs)
- Added reference image chaining and prePrompt parameter
- floimg-google@0.3.1, floimg-studio-ui@0.1.7, floimg-studio-shared@0.1.2

**v0.5.0** (2025-12-23)

- FloImg Studio packages published to npm
- @teamflojo/floimg-studio-ui v0.1.2
- @teamflojo/floimg-studio-shared v0.1.0
- Docker image: ghcr.io/teamflojo/floimg-studio:0.5.0

**v0.3.2** - Core library with brand refresh (teal accent)

## Package Versions

| Package                         | npm Version | Description                        |
| ------------------------------- | ----------- | ---------------------------------- |
| @teamflojo/floimg               | 0.7.1       | Core library                       |
| @teamflojo/floimg-openai        | 0.2.0       | OpenAI DALL-E + transforms         |
| @teamflojo/floimg-stability     | 0.2.1       | Stability AI SDXL/SD3 + transforms |
| @teamflojo/floimg-google        | 0.3.1       | Google Imagen + Gemini Text/Vision |
| @teamflojo/floimg-replicate     | 0.1.0       | Replicate AI transforms            |
| @teamflojo/floimg-ollama        | 0.2.1       | Ollama local AI                    |
| @teamflojo/floimg-qr            | 0.2.1       | QR code generator                  |
| @teamflojo/floimg-mermaid       | 0.2.1       | Mermaid diagrams                   |
| @teamflojo/floimg-quickchart    | 0.2.1       | Chart.js via QuickChart            |
| @teamflojo/floimg-studio-ui     | 0.2.1       | Studio React components            |
| @teamflojo/floimg-studio-shared | 0.2.0       | Studio shared types                |
| @teamflojo/floimg-xai           | 0.1.0       | Grok Text/Vision                   |

## FloImg Studio

Visual workflow builder in `apps/studio/`:

- **Self-hosted**: `docker run -p 5100:5100 ghcr.io/teamflojo/floimg-studio`
- **Cloud**: https://studio.floimg.com

## AI Transform Providers

| Provider            | Operations                                            |
| ------------------- | ----------------------------------------------------- |
| openai-transform    | edit, variations                                      |
| stability-transform | removeBackground, upscale, searchAndReplace, outpaint |
| replicate-transform | faceRestore, colorize, realEsrgan, fluxEdit           |

## Backlog

- **BUG-2026-003**: Plugin packages have stale peer dependencies (p1)
- Publish updated packages to npm (floimg-openai, floimg-replicate)
- Additional AI provider packages (Anthropic, Gemini)
- More generator plugins

## Blockers

- None

## Notes

- Open-source project (MIT license)
- GitHub Issues for external contributors
- Vault is source of truth for internal task tracking
