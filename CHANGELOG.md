# Changelog

All notable changes to FloImg will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.21.1] - 2026-01-31

### Build Fixes

- fix: Add floimg-vectorize to npm publish workflow
- fix: Add floimg-vectorize to Docker build steps

## [v0.21.0] - 2026-01-31

### @teamflojo/floimg-vectorize (0.1.0) [NEW]

- feat: New package for raster-to-SVG vectorization
  - Convert PNG, JPEG, WebP to SVG vector graphics
  - Uses vtracer via @neplex/vectorizer - fast (2-7ms), full color support
  - User-friendly parameters: colorPrecision, filterSpeckle, simplify
  - Registered in Studio backend for visual editor integration
  - Best for AI-generated logos, icons, and flat illustrations

### @teamflojo/floimg (0.16.0)

- feat: Add parameter validation API for pipelines and templates
  - `validatePipeline()` - Validate entire pipeline against schemas
  - `validateStep()` - Validate single step
  - `validateGeneratorParams()` - Validate generator parameters
  - `validateTransformParams()` - Validate transform parameters
  - Detects missing required params, unknown params (warns), type mismatches
  - Validates enum values, number min/max constraints

## [v0.20.3] - 2026-01-30

### FloImg Studio Backend

- fix: Add composite transform documentation to AI workflow generator
  - Added rule 9: composite transforms require "base" and "overlays[N]" handles
  - Added example workflow showing correct edge handle format
  - Fixes AI-generated composite workflows failing with "Overlay image missing"

## [v0.20.2] - 2026-01-30

### @teamflojo/floimg-studio-ui (0.9.1)

- fix: Update to floimg-studio-shared@0.9.1 with composite transform fixes

## [v0.20.1] - 2026-01-30

### @teamflojo/floimg-studio-shared (0.9.1)

- fix: Accept "base" targetHandle for composite transform base image input
- fix: Collect overlay images via "overlays[N]" handles with index preservation
- fix: Support sparse overlay indices (e.g., [2, 5] instead of [0, 1])

### @teamflojo/floimg-studio-backend (0.5.2)

- fix: Resolve and inject overlay images for composite transforms
- fix: Validate missing overlays with clear error message instead of cryptic Sharp error

## [v0.20.0] - 2026-01-30

### @teamflojo/floimg-studio-ui (0.9.0)

- feat: Execution Results Modal for viewing run details
  - Click history items to see full output details
  - Re-run and share actions from modal
- feat: History indicator badge on History tab
  - Shows unseen run count
  - Color-coded for errors (red) vs success (teal)
  - Auto-resets on tab view
- feat: Per-node execution timing display
  - Live elapsed counter on running nodes
  - Duration badge after completion
  - Slow node highlighting (>5s yellow, >15s red)
- feat: Compare mode for execution history
  - Side-by-side comparison of 2-4 runs
  - Output selector for multi-output workflows
  - Timing comparison footer
- feat: Pin favorite runs
  - Star runs to keep them accessible
  - Pinned section at top of history
  - Persisted in localStorage
- feat: Export history to ZIP
  - Export all runs, pinned only, or individual runs
  - ZIP includes images + metadata JSON
  - 100% client-side (uses JSZip)
- deps: Add jszip for client-side ZIP generation

## [v0.19.0] - 2026-01-30

### @teamflojo/floimg-studio-ui (0.8.0)

- **BREAKING**: "Images" tab renamed to "History" tab
- refactor: Remove "Generated images bar" from Toolbar
  - Bar showed broken thumbnails for FSC guests (used network URLs)
  - Node previews + History tab now provide complete execution feedback
  - Design principle: Results appear in context, not summary overlays
- feat: Add execution history tracking with data URLs
  - `ExecutionRun` interface for tracking past workflow runs
  - `executionHistory` array in store (limited to 20 runs)
  - `addExecutionRun()` and `clearHistory()` store actions
  - Auto-capture runs on execution completion/error
- feat: New `ExecutionHistory` component showing workflow run history
  - Chronological list with status badges (completed/error)
  - Thumbnail grid using data URLs (works for all user types)
  - Duration and node count for each run
  - Optional `isGuest` prop for ephemeral notice
  - Optional `signUpUrl` prop for guest sign-up CTA
  - Optional `onShare` callback for showcase integration
- feat: Export `ExecutionRun`, `ExecutionRunOutput`, `SavedWorkflow` types

## [v0.18.1] - 2026-01-30

### @teamflojo/floimg-studio-backend (0.5.1)

- feat: add `/api/version` endpoint for deployment visibility
  - Returns service name, version, git commit, build time, and node environment
  - Build metadata injected via Docker build args during release workflow

### Docker Image

- feat: Docker image now includes build metadata (GIT_COMMIT, BUILD_TIME, APP_VERSION)

## [v0.18.0] - 2026-01-24

### @teamflojo/floimg-studio-ui (0.7.0)

- **BREAKING**: Removed `@teamflojo/floimg-templates` package dependency
- **BREAKING**: Removed template re-exports (`templates`, `getCategories`, `getTemplateById`, `getTemplatesByCategory`, `searchTemplates`, `resolveTemplate`)
- feat: `TemplateGallery` now fetches templates from API with offline fallback
- feat: Templates cached in localStorage for offline access after first fetch
- feat: Bundled seed templates for air-gapped/offline cold starts
- feat: Added `apiUrl` prop to `TemplateGallery` for custom API endpoints

### @teamflojo/floimg-studio-shared (0.9.0)

- feat: Added `Template` and `TemplateCategory` types (migrated from floimg-templates)

### @teamflojo/floimg-templates

- **REMOVED**: This package has been deleted. Templates are now served from the API.
- Migration: Use `fetch('https://api.floimg.com/api/templates')` to get templates
- Migration: Import `Template` type from `@teamflojo/floimg-studio-shared` instead

## [v0.17.0] - 2026-01-24

### @teamflojo/floimg-studio-ui (0.6.0)

- feat: add `parentWorkflowId` state tracking for remix attribution chains
- feat: add `loadRemixImage(imageUrl)` store method for creating Input nodes from remote URLs
- feat: add `loadFromWorkflowJson(json, metadata)` store method for loading forked workflows with ID remapping
- feat: handle `?remixImage=<url>` URL parameter for external remix links
- feat: add `remixInfoSlot` prop to Toolbar for injecting attribution banners

### @teamflojo/floimg-studio-shared (0.8.0)

- feat: add `imageUrl` field to `InputNodeData` for remote image URLs in remix flows

## [v0.16.0] - 2026-01-17

### @teamflojo/floimg (0.15.0)

- feat: add `FLOIMG_SAVE_*` environment variables for storage configuration
  - `FLOIMG_SAVE_FS_BASE_DIR` for custom filesystem output directory
  - `FLOIMG_SAVE_S3_BUCKET`, `FLOIMG_SAVE_S3_REGION`, `FLOIMG_SAVE_S3_ENDPOINT` for S3-compatible storage
  - `FLOIMG_SAVE_S3_ACCESS_KEY_ID`, `FLOIMG_SAVE_S3_SECRET_ACCESS_KEY` for credentials
  - Backward compatible with `AWS_*`, `S3_*`, `TIGRIS_*` env vars

### @teamflojo/floimg-studio-backend (0.5.0)

- feat: support pluggable storage backends via environment variables
  - Filesystem storage works out of the box (zero config)
  - S3-compatible storage (MinIO, R2, Backblaze, etc.) configurable via env vars
  - Updated DEPLOYMENT.md with storage configuration examples

## [v0.15.7] - 2026-01-16

### @teamflojo/floimg-studio-shared (0.7.0)

- feat: add `nodesToPipeline()` function for converting visual workflows to Pipeline format
- feat: add `Pipeline`, `PipelineStep`, and `PipelineConversionResult` types
- feat: 21 interface consistency tests for nodesToPipeline conversion
- refactor: unified step identifiers - node IDs used as variable names throughout

### @teamflojo/floimg-mcp (0.1.1)

- refactor: use canonical Pipeline format internally for execution
  - Converts LLM-friendly step format to canonical Pipeline
  - Uses `client.run(pipeline)` for consistent execution
  - Added proper DataBlob result handling for vision/text steps
  - Preserves provider field for AI transforms

## [v0.15.6] - 2026-01-15

### @teamflojo/floimg (0.14.1)

- fix: handle undefined inputs in composite transform without crashing
  - Validates base image before processing
  - Validates all overlays and fails fast if any are invalid (consistent with other transforms)
  - Provides clear error messages identifying which inputs failed
  - Added test coverage for composite error handling

### @teamflojo/floimg-studio-ui (0.5.4)

- feat: visual error highlighting for failed workflow nodes
  - Red border/glow effect on nodes in error state
  - Error badge with tooltip showing error message
  - Error state clears automatically on re-execution
  - Dark mode support for error styling

### @teamflojo/floimg-studio-backend (0.4.1)

- feat: include nodeId in execution error events
  - Track current node during execution for error attribution
  - Pass nodeId to SSE error events for frontend highlighting

## [v0.15.5] - 2026-01-11

### @teamflojo/floimg (0.14.0)

- feat: add structured error types with categories and utilities
  - New error classes: `ValidationError`, `NetworkError`, `ProviderError`, `PipelineError`
  - Error categories: `user_input`, `provider_error`, `provider_config`, `validation`, `execution`, `network`, `internal`
  - `retryable` flag indicates if operation can be retried
  - Utility functions: `isRetryable()`, `getErrorCategory()`, `wrapError()`
  - Proper error chaining with `cause` property

### @teamflojo/floimg-studio-shared (0.6.0)

- feat: add `ErrorCategory` type for structured error handling
- feat: extend `ExecutionSSEError` with `errorCode`, `errorCategory`, `retryable` fields

## [v0.15.4] - 2026-01-11

### @teamflojo/floimg-studio-ui (0.5.3)

- fix: dark mode text visibility in NodePalette (description text was black/invisible)
- fix: category label contrast in dark mode (zinc-400 for readability)
- fix: remove colored left borders (was creating visual noise with 7 accent colors)
- fix: make title text neutral (removed accent-colored titles)
- feat: add grip dots for drag affordance (persistent visual cue that items are draggable)
- fix: improve typography (description text 13px minimum)
- fix: minimap dark mode (respects system color scheme)

## [v0.15.3] - 2026-01-11

### @teamflojo/floimg-studio-ui (0.5.2)

- feat: export composable `NodePaletteItem` component for downstream extensions
  - `disabled` prop for unavailable nodes
  - `onDisabledClick` handler for click on disabled nodes
  - `badge` prop for custom badges (icons, tags)
  - `alternateMessage` prop for custom messages
- feat: add CSS for disabled state and header layout
  - `.floimg-palette-item--disabled` for unavailable nodes
  - `.floimg-palette-item__header` for badge layout
  - `.floimg-palette-item__alternate-message` for custom messages

## [v0.15.2] - 2026-01-11

### @teamflojo/floimg-studio-ui (0.5.1)

- feat: export keyboard shortcuts components and hooks for library consumers
  - Export `CommandPalette`, `KeyboardShortcutsModal` components
  - Export `useKeyboardShortcuts` hook
  - Export `useSettingsStore` for shortcut customization
  - Export `SHORTCUT_DEFINITIONS`, `CATEGORY_NAMES` constants
  - Export keyboard types
- fix: ensure CSS theme is bundled in library build
  - Add postcss-import for proper CSS @import processing
  - Premium styling now correctly included in npm package
- chore: add verify-lib script to validate library build output
  - Checks all expected exports are present
  - Validates CSS contains theme patterns
  - Runs automatically after build

## [v0.15.1] - 2026-01-11

### @teamflojo/floimg (0.13.1)

- docs: fix package README MCP references (was pointing to old package)

## [v0.15.0] - 2026-01-11

### @teamflojo/floimg-mcp (0.1.0) - NEW PACKAGE

- feat: extract MCP server into standalone package
  - MCP server moved from `@teamflojo/floimg` core to dedicated package
  - Follows established plugin pattern (`@teamflojo/floimg-*`)
  - Reduces core bundle size by removing `@modelcontextprotocol/sdk` dependency

### @teamflojo/floimg (0.13.0)

- **BREAKING**: removed MCP server from core package
  - MCP moved to `@teamflojo/floimg-mcp`
  - Removed `floimg mcp` CLI command
  - Removed `floimg-mcp` binary entry point
  - Removed `@modelcontextprotocol/sdk` dependency

#### Migration

Before:

```bash
npx @teamflojo/floimg mcp
# or
floimg-mcp
```

After:

```bash
npx @teamflojo/floimg-mcp
```

Update `.mcp.json` configuration:

```json
{
  "mcpServers": {
    "floimg": {
      "command": "npx",
      "args": ["-y", "@teamflojo/floimg-mcp"]
    }
  }
}
```

## [v0.14.0] - 2026-01-10

### @teamflojo/floimg (0.12.0)

- feat: add `UsageEvent` and `UsageHooks` interfaces for AI cost observability
  - Enables tracking of API costs across providers for billing/chargebacks
  - Providers emit events with token counts, image dimensions, and metadata

### @teamflojo/floimg-openai (0.3.0)

- feat: add optional `hooks` config for usage event emission
  - Supports generate, vision, text, edit, and variations operations
  - Emits events with model, dimensions, quality, and token counts

### @teamflojo/floimg-stability (0.3.0)

- feat: add optional `hooks` config for usage event emission
  - Supports generate and transform operations

### @teamflojo/floimg-google (0.6.0)

- feat: add optional `hooks` config for usage event emission
  - Supports Imagen generate, Gemini vision/text, and Gemini transforms
  - Emits events with actual token counts from API responses

### @teamflojo/floimg-replicate (0.2.0)

- feat: add optional `hooks` config for usage event emission
  - Supports transform operations (upscale, remove-bg, etc.)

### @teamflojo/floimg-xai (0.2.0)

- feat: add optional `hooks` config for usage event emission
  - Supports Grok text and vision operations
  - Emits events with actual token counts from API responses

### @teamflojo/floimg-studio-backend (0.4.0)

- feat: collect and return usage events from workflow execution
  - OSS backend now returns `usageEvents` in execution results
  - Enables cloud platforms to track actual AI costs

## [v0.13.0] - 2026-01-09

### @teamflojo/floimg-google (0.5.0)

- feat: add `enhancePrompt` option for Gemini generate and edit nodes
  - Automatically expands prompts based on Google's image generation best practices
  - Detects prompt type (photorealistic, illustration, logo, product, etc.)
  - Applies appropriate enhancement templates
- feat: export prompt enhancement utilities: `enhancePrompt()`, `detectPromptType()`, `isPromptDetailed()`
- chore: improve TypeScript types with proper SDK type imports

### @teamflojo/floimg-studio-ui (0.5.0)

- feat: comprehensive visual identity refresh with custom theming system
- feat: gradient backgrounds for toolbar and sidebars
- feat: color-coded palette items by node category
- feat: node execution state animations (running shimmer, completed/error indicators)
- feat: hide right sidebar when no node selected for cleaner canvas view
- fix: rename cloud save provider from "floimg-cloud" to "cloud" for clarity

## [v0.12.0] - 2026-01-09

### @teamflojo/floimg (0.11.0)

- feat: add fan-out, collect, and router pipeline primitives for iterative workflows
  - `fan-out`: distribute input to parallel branches (count mode: N copies, array mode: iterate items)
  - `collect`: gather outputs from branches (waitMode: all or available, with minRequired option)
  - `router`: select from candidates based on AI decision (index-based or property-based selection)
- feat: add YAML example for iterative workflow pattern (`examples/pipeline-iterative.yaml`)
- fix: improve error messages for router selection property validation
- fix: add warnings when fan-out count/array length doesn't match output array length

### @teamflojo/floimg-studio-ui (0.5.0)

- feat: add Fan-Out node for parallel branch execution
- feat: add Collect node for gathering branch outputs
- feat: add Router node for AI-driven selection from candidates
- feat: add iterative workflow support to executor with SDK delegation
- feat: update node palette with Iterative Workflow section

### @teamflojo/floimg-studio-shared (0.5.0)

- feat: add FanOutNodeData, CollectNodeData, RouterNodeData types
- feat: add iterative workflow node type definitions

### @teamflojo/floimg-studio-backend (0.3.0)

- feat: add executor support for fan-out, collect, and router steps
- feat: delegate branching execution to SDK client.run()

## [v0.11.5] - 2026-01-09

### @teamflojo/floimg-studio-ui (0.4.4)

- fix: rebuild with updated floimg-templates (template thumbnails now use absolute URLs)

## [v0.11.4] - 2026-01-09

### @teamflojo/floimg-templates (0.2.1)

- fix: update template imageUrl to absolute URLs for cross-domain compatibility
- fix: correct QR template parameters to match floimg-qr schema

### @teamflojo/floimg-qr (0.2.3)

- fix: add color parameter to schema (was accepted by implementation but undocumented)

## [v0.11.3] - 2026-01-08

### @teamflojo/floimg-studio-ui (0.4.3)

- fix: populate reference image handles for all workflow loading methods

## [v0.11.2] - 2026-01-08

### @teamflojo/floimg-studio-ui (0.4.2)

- fix: ensure dark mode CSS loads after React Flow defaults (fixes minimap theming)

## [v0.11.1] - 2026-01-07

### @teamflojo/floimg-studio-ui (0.4.1)

- fix: include dark mode CSS overrides in library build (minimap now themed correctly)

## [v0.11.0] - 2026-01-07

### @teamflojo/floimg-studio-ui (0.4.0)

- feat: real-time workflow execution progress via SSE streaming
- feat: output inspector modal for viewing full text/vision node responses
- feat: AI generation cancellation support
- feat: per-node execution status indicators (running → completed/error/skipped)
- fix: add size/depth safeguards to JSON tree rendering (max depth 20, max array 500)

### @teamflojo/floimg-studio-shared (0.4.0)

- feat: add SSE event types for execution and generation streaming
- feat: add "skipped" status to ExecutionStepResult with skipReason field

### @teamflojo/floimg-studio-backend (0.2.0)

- feat: add `/api/execute/stream` SSE endpoint for real-time execution progress
- feat: add `/api/generate/workflow/stream` SSE endpoint with generation phases
- feat: sequential execution with inline moderation and real-time callbacks
- feat: partial failure handling - skip dependent steps when upstream fails

## [v0.10.0] - 2026-01-07

### @teamflojo/floimg (0.9.0)

**BREAKING CHANGE**: Shape generator schema completely restructured

The shapes generator now separates geometry (shape type) from appearance (fill type), matching the mental model from design tools like Figma/Sketch.

#### What Changed

| Old Parameter       | New Parameter(s)                                 |
| ------------------- | ------------------------------------------------ |
| `type: 'gradient'`  | `shapeType: 'rectangle'`, `fillType: 'gradient'` |
| `type: 'pattern'`   | `shapeType: 'rectangle'`, `fillType: 'pattern'`  |
| `type: 'circle'`    | `shapeType: 'circle'`, `fillType: 'solid'`       |
| `type: 'rectangle'` | `shapeType: 'rectangle'`, `fillType: 'solid'`    |
| `color1`, `color2`  | `gradientColor1`, `gradientColor2`               |
| `fill`              | `fillColor`                                      |
| `rx`                | `cornerRadius`                                   |

#### Migration

**No automatic migration.** Old parameters are removed entirely. Update your workflows manually:

```yaml
# OLD (no longer works)
- generator: shapes
  params:
    type: gradient
    color1: "#FF0000"
    color2: "#0000FF"

# NEW
- generator: shapes
  params:
    shapeType: rectangle
    fillType: gradient
    gradientColor1: "#FF0000"
    gradientColor2: "#0000FF"
```

**For Studio users**: Saved workflows using the shapes generator will need to be recreated. Delete the old workflow and create a new one with the updated node.

#### New Features

- feat: add 4 new shapes - `ellipse`, `triangle`, `polygon` (with `sides`), `star` (with `points`, `innerRadius`)
- feat: add stroke support - `strokeColor`, `strokeWidth`
- feat: add rotation parameter (0-360 degrees)
- feat: add radial gradient type (`gradientType: 'radial'`)
- feat: add checkerboard pattern (`patternType: 'checkerboard'`)

#### Why No Backwards Compatibility?

FloImg is pre-1.0. We follow the "No Backwards Compatibility" principle: delete, don't deprecate. This keeps the codebase clean and avoids technical debt. See `vault/architecture/No-Backwards-Compatibility.md`.

### @teamflojo/floimg-studio-ui (0.3.4)

- feat: add conditional field visibility for shapes generator (only show relevant params)

## [v0.9.6] - 2026-01-04

### All Plugin Packages

- fix: update peer dependency on `@teamflojo/floimg` from `^0.2.0` to `^0.8.0`
  - Fixes npm install failures due to peer dependency conflicts
  - Users no longer need `--legacy-peer-deps` flag

#### Updated Packages

| Package                      | Version |
| ---------------------------- | ------- |
| @teamflojo/floimg-mermaid    | 0.2.2   |
| @teamflojo/floimg-qr         | 0.2.2   |
| @teamflojo/floimg-quickchart | 0.2.2   |
| @teamflojo/floimg-d3         | 0.2.2   |
| @teamflojo/floimg-screenshot | 0.2.2   |
| @teamflojo/floimg-openai     | 0.2.1   |
| @teamflojo/floimg-stability  | 0.2.2   |
| @teamflojo/floimg-google     | 0.4.1   |
| @teamflojo/floimg-replicate  | 0.1.1   |
| @teamflojo/floimg-ollama     | 0.2.2   |
| @teamflojo/floimg-xai        | 0.1.1   |
| @teamflojo/floimg-claude     | 0.2.1   |

## [v0.9.5] - 2026-01-04

### @teamflojo/floimg-studio-ui (0.3.3)

- fix: update floimg-templates dependency to 0.2.0 (multi-node templates)

## [v0.9.4] - 2026-01-04

### @teamflojo/floimg-templates (0.2.0)

- feat: enhance all 12 single-node templates to multi-node workflows (4 nodes each)
  - QR templates: add resize, roundCorners/extend, format conversion
  - Chart templates: add resize for platform, captions, WebP export
  - Diagram templates: add padding, captions, PNG export
  - AI templates: add removeBackground, resize, format conversion
- feat: add 6 new multi-node workflow templates
  - `responsiveImages`: srcset generation (6 nodes, parallel branching)
  - `teamHeadshots`: standardized profile photos (5 nodes)
  - `screenshotDocs`: documentation screenshots (5 nodes)
  - `blogOgImage`: blog header optimization (4 nodes)
  - `emailBanner`: email-safe banners (4 nodes)
  - `appIcons`: multi-platform icon generation (6 nodes, parallel)
- feat: add `nodeCount` field to Template type
- feat: add `getNodeCount()`, `getPipelineTemplates()`, `getTemplatesByComplexity()` helpers
- chore: update template descriptions with clear JTBDs

## [v0.9.3] - 2026-01-04

### Repository

- fix: add floimg-templates to Docker build

## [v0.9.2] - 2026-01-04

### @teamflojo/floimg-templates (0.1.0)

- fix: actually publish to npm (was missing from release workflow in v0.9.1)
- docs: clean up OSS documentation (remove internal acronyms)

### @teamflojo/floimg-studio-ui (0.3.2)

- fix: use workspace dependency for floimg-studio-shared (was pulling outdated npm version)

### Repository

- chore: add floimg-templates to release workflow
- docs: improve OSS boundaries in templates package documentation

## [v0.9.1] - 2026-01-04

### @teamflojo/floimg-templates (0.1.0) - NEW

- feat: new shared package for workflow templates
- feat: templates organized by category (AI Workflows, Data Viz, Marketing, Utilities)
- feat: `coreTemplates` for OSS (offline-compatible) vs `allTemplates` for FSC
- feat: `resolveTemplate()` for legacy ID mapping
- feat: `getStudioUrl()` helper for template deep links

### @teamflojo/floimg-studio-ui (0.3.1)

- refactor: use `@teamflojo/floimg-templates` as single source of truth
- feat: template loading uses `resolveTemplate()` for backwards compatibility
- chore: remove local template definitions (now in shared package)

## [v0.9.0] - 2026-01-03

### Breaking Changes

- **GEMINI_API_KEY no longer supported** - Use `GOOGLE_AI_API_KEY` instead for all Google AI features including AI Workflow Generator

### @teamflojo/floimg-studio-ui (0.3.0)

- feat: context-aware AI generation error UI
- feat: show "View Setup Guide" link for OSS self-hosted deployments
- feat: show "View Plans" link for FSC tier limit errors
- feat: show "Contact Support" link for FSC service errors (paid users only)

### @teamflojo/floimg-studio-shared (0.3.0)

- feat: add `GenerateStatusResponse` and `GenerateStatusReason` types
- feat: add `reason`, `isCloudDeployment`, and `supportUrl` fields to status response

### @teamflojo/floimg-studio-backend

- feat: add `reason` and `isCloudDeployment` fields to `/api/generate/status`
- feat: server-side logging when GOOGLE_AI_API_KEY is not configured
- breaking: use `GOOGLE_AI_API_KEY` instead of `GEMINI_API_KEY` for workflow generation

### @teamflojo/floimg-google (0.4.0)

- breaking: remove `GEMINI_API_KEY` fallback, use `GOOGLE_AI_API_KEY` only

### @teamflojo/floimg (0.8.0)

- fix: update MCP server error messages to reference `GOOGLE_AI_API_KEY`

## [v0.8.3] - 2026-01-01

### @teamflojo/floimg (0.7.2)

- docs: add README.md for npm package page

### @teamflojo/floimg-studio-ui (0.2.3)

- docs: add README.md for npm package page

### @teamflojo/floimg-studio-shared (0.2.1)

- docs: add README.md for npm package page
- chore: add README.md to package.json files array

### Repository

- docs: add Repository Structure section to main README
- docs: update Monorepo Guide with current package list

## [v0.8.2] - 2026-01-01

### @teamflojo/floimg-studio-ui (0.2.2)

- feat: add `hideWorkflowLibrary` prop to Toolbar for embedding

## [v0.8.1] - 2026-01-01

### @teamflojo/floimg-studio-ui (0.2.1)

- chore: rename Gallery tab to Images
- fix: add pull_policy always to oss service in docker-compose

## [v0.8.0] - 2026-01-01

### @teamflojo/floimg-studio-ui (0.2.0)

- feat: AI-powered workflow generation with Gemini 3 Pro
- feat: add node duplication with Cmd+D
- feat: add prompt input handle to gemini-generate node
- feat: multi-reference image support for Gemini nodes
- feat: support generator/transform outputs as reference images
- feat: enhance AI workflow generator with structured output examples
- feat: add advanced workflow examples for AI generation
- fix: use screenToFlowPosition for correct node drop coordinates
- fix: set outputSchema on text nodes when loading AI workflows
- fix: transform Gemini parametersJson to parameters object
- fix: distinguish cloud save from filesystem save in inspector

### @teamflojo/floimg-google (0.3.1)

- feat: support GEMINI_API_KEY env var as fallback

## [0.7.1] - 2025-12-31

### Fixed

- Added `@teamflojo/floimg-xai` to npm publish workflow
- Added floimg-xai to Docker build for FloImg Studio

## [0.7.0] - 2025-12-31

### Added

#### New Plugin: xAI Grok

- **`@teamflojo/floimg-xai`** - xAI integration (NEW)
  - Grok text generation
  - Grok vision analysis

#### CLI AI Commands

- **`floimg ai text`** - Generate text using configured AI providers
- **`floimg ai vision`** - Analyze images using configured AI vision models
- **MCP provider discovery** - Dynamic provider detection for MCP server

#### Google AI Enhancements

- **Gemini Generate** - Text-to-image generation with Gemini
- **Gemini Edit** - AI-powered image editing transform with dynamic prePrompt
- **New parameters**: `aspectRatio`, `imageSize`, `groundingWithSearch`
- **Updated models**: Gemini 2.5-flash and 3-flash-preview

#### FloImg Studio

- **AI text/vision nodes** - Multi-output support for AI transforms
- **Dynamic text inputs** - Text input support for AI transforms
- **Provider routing** - AI transform provider routing and API key injection
- **providerLabel** - Cleaner display names for AI nodes

## [0.6.0] - 2025-12-28

### Added

#### Fluent API

- **FluentBuilder class**: Chainable syntax for building image workflows
  - Entry points: `floimg.from()`, `floimg.generate()`
  - Chaining: `.transform()`, `.analyze()`, `.text()`
  - Terminal methods: `.to()`, `.toBlob()`, `.run()`
- **createFluent() factory**: Create fluent facade for custom client configurations
- **floimg singleton**: Pre-configured fluent API export for quick usage

```typescript
await floimg.from("./input.png").transform("resize", { width: 800 }).to("./output.png");
```

#### AI Provider Packages

- **`@teamflojo/floimg-openai`** - OpenAI integration (extracted from core)
  - DALL-E 2/3 image generation
  - GPT-4 Vision image analysis
  - GPT-4 text generation
  - AI transforms: edit (inpainting), variations
- **`@teamflojo/floimg-stability`** - Stability AI integration
  - SDXL and SD3 image generation
  - AI transforms: removeBackground, upscale, searchAndReplace, outpaint
- **`@teamflojo/floimg-google`** - Google AI integration
  - Imagen 4.0 image generation
- **`@teamflojo/floimg-replicate`** - Replicate integration (NEW)
  - AI transforms: faceRestore (GFPGAN), colorize (DeOldify), realEsrgan (upscale), fluxEdit (text-guided editing)
- **`@teamflojo/floimg-ollama`** - Ollama local AI integration
  - LLaVA vision analysis
  - Llama text generation

#### Transform Provider Architecture

- **Self-dispatching providers**: TransformProvider now handles its own operation routing
- **I/O type metadata**: Schemas include inputType/outputType for visual builder validation
- **AI transforms**: Support for AI-powered image transformations
- **Four transform providers**: sharp (built-in), stability-transform, openai-transform, replicate-transform

### Changed

- **Studio executor refactored**: Now uses floimg's core pipeline runner instead of custom wave execution
- **Pipeline runner**: Vision and text step kinds now properly tracked in dependency graph
- Extracted OpenAI provider to separate `@teamflojo/floimg-openai` package
- TransformProvider interface now requires `transform()` method
- Class renamed from `Floimg` to `FloImg` for consistency

## [0.5.0] - 2025-12-23

### Added

#### FloImg Studio

- **Visual workflow builder**: Drag-and-drop interface for creating image pipelines
- **Node-based editor**: React Flow canvas with 20+ node types
- **Template gallery**: Pre-built workflows for common tasks
- **Real-time preview**: See results as you build

#### npm Packages

- `@teamflojo/floimg-studio-ui` - React components for building custom studio UIs
- `@teamflojo/floimg-studio-shared` - Shared TypeScript types

#### Docker Support

- Pre-built Docker images on GitHub Container Registry
- `docker run ghcr.io/flojoinc/floimg-studio` for instant deployment

#### CI/CD

- GitHub Actions workflow for npm publishing
- Docker image builds on release

### Changed

- Migrated FloImg Studio into monorepo (previously separate repo)
- Updated documentation for self-hosting options

## [0.2.0] - 2025-12-21

### Added

#### AI Vision & Text Generation

- **Vision analysis**: `analyzeImage()` method for AI-powered image understanding
- **Text generation**: `generateText()` method for LLM text completion
- **DataBlob type**: New output type for text/JSON results from AI operations
- **VisionProvider interface**: Standardized interface for vision AI providers
- **TextProvider interface**: Standardized interface for text AI providers

#### AI Providers

- **OpenAI**: GPT-4 Vision for image analysis, GPT-4 for text generation
- **Anthropic**: Claude vision and text support (via config)
- **Google Gemini**: Gemini vision and text support (via config)
- **Ollama**: Local AI models (LLaVA for vision, Llama for text)
- **LM Studio**: Local model support via OpenAI-compatible API

#### New Package

- `@teamflojo/floimg-ollama`: Plugin for local AI models via Ollama
  - LLaVA vision model support
  - Llama text model support
  - Zero-cloud-dependency AI workflows

#### MCP Server

- `analyze_image` tool: AI vision analysis in MCP workflows
- `generate_text` tool: AI text generation in MCP workflows

### Changed

- Extended `getCapabilities()` to include AI provider information
- Updated config types for multi-provider AI support

### Notes

- All AI features are optional - FloImg works without any AI configured
- AI providers require respective API keys or local model setup

## [0.1.0] - 2025-12-20

### Added

#### Core Library

- **Three core operations**: generate, transform, save
- **Multiple interfaces**: JavaScript API, CLI, YAML pipelines, MCP server
- **Capability discovery**: Runtime schema inspection via `getCapabilities()`
- **Parallel pipeline execution**: Automatic dependency graph analysis and wave-based execution

#### Built-in Generators

- `shapes` - SVG gradients, circles, rectangles, patterns
- `openai` - DALL-E image generation

#### Transform Operations

- Format conversion (SVG to PNG/JPEG/WebP/AVIF)
- Resize with fit modes
- Composite (layer images)
- Filters: blur, sharpen, grayscale, negate, normalize, threshold, modulate, tint
- Borders: extend, extract, roundCorners
- Text: addText, addCaption
- 8 preset filters: vintage, vibrant, blackAndWhite, dramatic, soft, cool, warm, highContrast

#### Save Providers

- Filesystem (default, zero-config)
- S3-compatible storage (AWS S3, Tigris, Cloudflare R2)
- Smart URI routing: `./local/path` vs `s3://bucket/key`

#### CLI

- `floimg generate` - Generate images
- `floimg transform` - Transform images
- `floimg save` - Save to filesystem or cloud
- `floimg run` - Execute YAML pipelines
- `floimg doctor` - Check configuration
- `floimg mcp install` - Set up MCP integration

#### MCP Server

- Session workspace for efficient multi-step workflows
- Image ID tracking (no byte passing between operations)
- `generate_image`, `transform_image`, `save_image`, `run_pipeline` tools

#### Plugins

- `@teamflojo/floimg-quickchart` - Chart.js charts via QuickChart API
- `@teamflojo/floimg-d3` - D3 data visualizations
- `@teamflojo/floimg-mermaid` - Mermaid diagrams
- `@teamflojo/floimg-qr` - QR code generation
- `@teamflojo/floimg-screenshot` - Website screenshots via Playwright

### Dependencies

- `sharp` - Image processing
- `@resvg/resvg-js` - SVG rendering
- `@napi-rs/canvas` - Text rendering
- `@aws-sdk/client-s3` - S3 uploads
- `openai` - DALL-E integration
- `@modelcontextprotocol/sdk` - MCP server

---

## Version Numbering

floimg follows [Semantic Versioning](https://semver.org/):

- **Major** (x.0.0): Breaking changes to API
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

## Links

- [GitHub Repository](https://github.com/FlojoInc/floimg)
- [npm Package](https://www.npmjs.com/package/@teamflojo/floimg)
- [Documentation](https://github.com/FlojoInc/floimg#readme)
