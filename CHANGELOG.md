# Changelog

All notable changes to FloImg will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

_No unreleased changes._

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
- `docker run ghcr.io/teamflojo/floimg-studio` for instant deployment

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

- [GitHub Repository](https://github.com/TeamFlojo/floimg)
- [npm Package](https://www.npmjs.com/package/@teamflojo/floimg)
- [Documentation](https://github.com/TeamFlojo/floimg#readme)
