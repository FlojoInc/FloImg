# PROJECT STATUS

**Last Updated**: 2026-01-10

## Current Focus

No active tasks. See "Next Up" for prioritized backlog.

## Next Up

- **T-2026-012**: Undo/Redo (requires zundo middleware)
- **T-2025-008**: Shape Generator UX Overhaul
- Additional FloImg Studio UX improvements

## Just Completed

**T-2026-011: Keyboard Shortcuts for FloImg Studio** (2026-01-10)

Comprehensive keyboard shortcuts with command palette (Cmd+K), full customization, and WCAG accessibility.

- Command palette with fuzzy search and keyboard navigation
- Keyboard shortcuts help modal showing all bindings
- Full customization UI in settings
- Platform-aware symbols (⌘ on Mac, Ctrl on Windows)
- Focus traps, ARIA labels, and disabled command tooltips
- Confirmation dialog for destructive actions with unsaved changes
- PR #124 merged

**T-2026-010: Enhance FloImg Studio Visual Identity** (2026-01-09)

Premium visual styling to differentiate from default React Flow appearance.

- Comprehensive visual identity refresh with custom theming system
- Gradient backgrounds for toolbar and sidebars
- Color-coded palette items by node category
- Node execution state animations (running shimmer, completed/error indicators)
- Hide right sidebar when no node selected for cleaner canvas view
- Released in floimg-studio-ui@0.6.0

**T-2026-009: Gemini Prompt Auto-Enhancement** (2026-01-09)

Automatic prompt enhancement for better AI image generation.

- `enhancePrompt` option for Gemini generate and edit nodes
- Detects prompt type (photorealistic, illustration, logo, product, etc.)
- Applies appropriate enhancement templates based on Google's best practices
- Exported utilities: `enhancePrompt()`, `detectPromptType()`, `isPromptDetailed()`
- Released in floimg-google@0.5.0

**T-2025-007: Gemini 3 Pro Workflow Generation** (2026-01-07)

Natural language to workflow JSON using Gemini 3 Pro structured outputs.

- AI chat interface with example prompts
- Structured output support (jsonSchema → multiple output handles)
- Reference image chaining for composite workflows
- prePrompt for dynamic prompt context

**BUG-2026-003: Fix stale peer dependencies** (2026-01-04)

- Updated peer deps from `^0.2.0` to `^0.8.0` in all 12 plugin packages
- Users no longer need `--legacy-peer-deps` flag
- Released as v0.9.6 (PR #88 merged)

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

**v0.14.0** (2026-01-10)

- UsageHooks for AI provider cost tracking (floimg@0.12.0)
- Usage event emission across all AI provider packages
- Backend returns usageEvents in execution results

**v0.13.0** (2026-01-09)

- Gemini prompt auto-enhancement (floimg-google@0.5.0)
- Visual identity refresh (floimg-studio-ui@0.6.0)
- Gradient backgrounds, color-coded palette items, execution animations

**v0.12.0** (2026-01-09)

- Fan-out, collect, and router pipeline primitives (floimg@0.11.0)
- Iterative workflow nodes in Studio (floimg-studio-ui@0.5.0)

**v0.10.0** (2026-01-07)

- BREAKING: Shape generator schema restructured (geometry + appearance separation)
- New shapes: ellipse, triangle, polygon, star
- Stroke support, rotation, radial gradients

**v0.9.6** (2026-01-04)

- Fix peer dependencies in all 12 plugin packages (^0.2.0 → ^0.8.0)

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

| Package                          | npm Version | Description                        |
| -------------------------------- | ----------- | ---------------------------------- |
| @teamflojo/floimg                | 0.12.0      | Core library                       |
| @teamflojo/floimg-openai         | 0.3.0       | OpenAI DALL-E + transforms         |
| @teamflojo/floimg-stability      | 0.3.0       | Stability AI SDXL/SD3 + transforms |
| @teamflojo/floimg-google         | 0.6.0       | Google Imagen + Gemini Text/Vision |
| @teamflojo/floimg-replicate      | 0.2.0       | Replicate AI transforms            |
| @teamflojo/floimg-xai            | 0.2.0       | Grok Text/Vision                   |
| @teamflojo/floimg-ollama         | 0.2.2       | Ollama local AI                    |
| @teamflojo/floimg-qr             | 0.2.3       | QR code generator                  |
| @teamflojo/floimg-mermaid        | 0.2.2       | Mermaid diagrams                   |
| @teamflojo/floimg-quickchart     | 0.2.2       | Chart.js via QuickChart            |
| @teamflojo/floimg-d3             | 0.2.2       | D3 data visualizations             |
| @teamflojo/floimg-screenshot     | 0.2.2       | Screenshot/Playwright              |
| @teamflojo/floimg-templates      | 0.2.1       | Workflow templates                 |
| @teamflojo/floimg-studio-ui      | 0.5.0       | Studio React components            |
| @teamflojo/floimg-studio-shared  | 0.5.0       | Studio shared types                |
| @teamflojo/floimg-studio-backend | 0.4.0       | Studio backend server              |
| @teamflojo/floimg-claude         | 0.2.1       | Claude Code plugin                 |

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

- Additional AI provider packages (Anthropic)
- More generator plugins

## Blockers

- None

## Notes

- Open-source project (MIT license)
- GitHub Issues for external contributors
- Vault is source of truth for internal task tracking
