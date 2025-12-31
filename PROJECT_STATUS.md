# PROJECT STATUS

**Last Updated**: 2025-12-31

## Current Focus

**T-2025-005**: Add prompt input handle to gemini-generate node
- Branch: `feat/T-2025-005-gemini-generate-prompt-input`
- Status: IN PROGRESS

## Next Up

- Additional FloImg Studio UX improvements

## Just Completed

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

**v0.5.0** (2025-12-23)

- FloImg Studio packages published to npm
- @teamflojo/floimg-studio-ui v0.1.2
- @teamflojo/floimg-studio-shared v0.1.0
- Docker image: ghcr.io/teamflojo/floimg-studio:0.5.0

**v0.3.2** - Core library with brand refresh (teal accent)

## Package Versions

| Package                         | npm Version | Description                        |
| ------------------------------- | ----------- | ---------------------------------- |
| @teamflojo/floimg               | 0.3.2       | Core library                       |
| @teamflojo/floimg-openai        | 0.1.0       | OpenAI DALL-E + transforms         |
| @teamflojo/floimg-stability     | 0.1.0       | Stability AI SDXL/SD3 + transforms |
| @teamflojo/floimg-google        | 0.2.0       | Google Imagen + Gemini Text/Vision |
| @teamflojo/floimg-replicate     | 0.1.0       | Replicate AI transforms            |
| @teamflojo/floimg-ollama        | 0.1.0       | Ollama local AI                    |
| @teamflojo/floimg-qr            | 0.1.0       | QR code generator                  |
| @teamflojo/floimg-mermaid       | 0.1.0       | Mermaid diagrams                   |
| @teamflojo/floimg-quickchart    | 0.1.0       | Chart.js via QuickChart            |
| @teamflojo/floimg-studio-ui     | 0.1.2       | Studio React components            |
| @teamflojo/floimg-studio-shared | 0.1.0       | Studio shared types                |
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

- Publish updated packages to npm (floimg-openai, floimg-replicate)
- Additional AI provider packages (Anthropic, Gemini)
- More generator plugins

## Blockers

- None

## Notes

- Open-source project (MIT license)
- GitHub Issues for external contributors
- Vault is source of truth for internal task tracking
