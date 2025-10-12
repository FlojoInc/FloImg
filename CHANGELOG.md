# Changelog

All notable changes to imgflo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2025-01-12

### Improved

#### MCP UX Enhancements
- **Intent auto-fill for simple cases**:
  - AI images: `intent` automatically becomes `prompt` if params.prompt not provided
  - QR codes: URLs extracted from `intent` if params.text not provided
  - Eliminates duplication for common use cases
- **Clearer tool descriptions**: Updated MCP tool descriptions to clarify:
  - AI images & QR codes: params optional (auto-filled from intent)
  - Charts & diagrams: params REQUIRED (must provide structured data)
  - Better examples and error messages
- **Documentation refresh**: Updated README to emphasize workflow abstraction and LLM integration patterns

### Changed
- MCP `generate_image` tool now auto-fills params for AI images and QR codes
- MCP `run_pipeline` generate steps apply same auto-fill logic
- Better error messages when required params are missing for charts/diagrams

### Fixed
- Reduced duplication when using MCP tools (no longer need to provide both intent and params.prompt for AI images)
- Clearer mental model: LLMs parse natural language → imgflo executes structured workflows

### Documentation
- Added "Core Concept" section to README
- Added "Using with LLMs" section explaining LLM/imgflo division of responsibilities
- Updated "Workflow Abstraction in Action" table with clearer examples
- Emphasized that imgflo is a workflow execution engine, not a natural language parser

### Technical Details
- No breaking changes (fully backward compatible with v0.4.0)
- All 44 tests passing
- Auto-fill logic in `/packages/imgflo/src/mcp/server.ts` (lines 452-487, 703-712)

## [0.4.0] - 2025-01-12

### BREAKING CHANGES - MCP Server Redesign

The MCP server has been completely redesigned based on real-world usability feedback. This is a **breaking change** for MCP users, but makes imgflo actually practical for production use.

### Added

#### MCP Session Workspace
- **Image ID tracking**: Images are stored in session workspace (`.imgflo/mcp-session/`) with unique IDs
- **No byte passing**: Transform and save operations reference images by ID, not by re-uploading base64
- **Efficient chaining**: Generate → transform → transform → save works without hitting MCP token limits
- **File path support**: All MCP tools accept `imageId`, `imagePath`, or `imageBytes` for maximum flexibility

#### run_pipeline Tool
- **Multi-step workflows**: Execute generate → transform → save in a single MCP call
- **Automatic chaining**: Each step receives output from previous step
- **Perfect for complex workflows**: "Generate AI image, resize, add caption, upload to S3" in one call
- **Returns all results**: Get finalImageId and location/URL from the pipeline execution

#### Improved Intent Routing
- **Better AI detection**: Recognizes "photo of", "illustration", "scene", "stadium", "sunset" as AI requests
- **Descriptive intent detection**: Long descriptions (>5 words) auto-route to OpenAI instead of shapes
- **Keyword matching**: Added 20+ AI-related keywords (photo, picture, painting, realistic, etc.)
- **Fixed default behavior**: No longer defaults everything to shapes/gradients

#### Enhanced MCP Tools

**generate_image**:
- Returns `imageId` for use in subsequent operations
- Optional `saveTo` parameter for also saving to cloud/filesystem
- Session path included in response

**transform_image**:
- Accepts `imageId` (from session), `imagePath` (any file), or `imageBytes` (base64)
- Returns new `imageId` after transformation
- Optional `saveTo` parameter
- MIME type auto-detected for imagePath/imageId

**save_image**:
- Accepts `imageId`, `imagePath`, or `imageBytes`
- Works with session images without re-uploading
- Returns `location` (file path or cloud URL)

### Changed

- MCP server version updated to 0.4.0
- MCP tools no longer pass large image bytes between calls
- Session workspace created automatically on server start
- Tool parameter `destination` renamed to `saveTo` for clarity in generate/transform

### Fixed

- **Critical**: Can now transform generated images without hitting MCP token limits
- **Critical**: Can chain multiple operations (generate → transform → save)
- **Critical**: Cloud upload works through MCP (via saveTo or save_image tool)
- AI image intent routing now works correctly (was defaulting to shapes)
- Transform operations no longer require re-uploading multi-megabyte base64 blobs

### Real-World Use Case Enabled

Before v0.4.0 (❌ Broken):
```
1. Generate AI image → get local file
2. Want to resize? ❌ Can't reference file, must re-upload 2MB base64
3. Want to add caption? ❌ Would hit MCP token limit
4. Want cloud URL? ❌ Have to drop to TypeScript
```

After v0.4.0 (✅ Works):
```javascript
// Step 1: Generate
const img = generate_image({ intent: "Baseball stadium at sunset" })
// Returns: { imageId: "img_123...", session: { path: "..." } }

// Step 2: Resize
const resized = transform_image({
  imageId: img.imageId,
  operation: "resize",
  params: { width: 800, height: 600 }
})
// Returns: { imageId: "img_456...", session: { path: "..." } }

// Step 3: Add caption
const captioned = transform_image({
  imageId: resized.imageId,
  operation: "addCaption",
  params: { text: "Game Day", position: "bottom" }
})

// Step 4: Upload to cloud
const final = save_image({
  imageId: captioned.imageId,
  destination: "s3://my-bucket/stadium.png"
})
// Returns: { location: "https://bucket.s3.amazonaws.com/stadium.png" }
```

Or use the pipeline API:
```javascript
run_pipeline({
  steps: [
    { generate: { intent: "Baseball stadium at sunset" } },
    { transform: { operation: "resize", params: { width: 800, height: 600 } } },
    { transform: { operation: "addCaption", params: { text: "Game Day" } } },
    { save: { destination: "s3://my-bucket/stadium.png" } }
  ]
})
```

### Technical Details

- Session workspace: `.imgflo/mcp-session/` in working directory
- Image IDs: `img_{timestamp}_{random}` format
- Registry stored in memory (per MCP server instance)
- File references prioritized over byte passing
- MIME type detection from file extensions
- Backward compatible: imageBytes still supported for external images

### Migration Guide for MCP Users

**Breaking changes**:
1. `destination` parameter renamed to `saveTo` in generate_image and transform_image
2. Return values now include `imageId` and `session` object
3. Must use `imageId` to reference previously generated/transformed images

**Benefits**:
- Multi-step workflows now actually work
- No more MCP token limit issues
- Can chain unlimited operations
- Cloud upload integrated into workflow

## [0.3.0] - 2025-01-11

### Added

#### Transform Operations - Image Filters & Effects
- **8 Filter Operations** (using Sharp's built-in capabilities):
  - `blur` - Gaussian blur with configurable sigma
  - `sharpen` - Edge sharpening with configurable parameters
  - `grayscale` - Convert images to black & white
  - `negate` - Invert colors
  - `normalize` - Auto-enhance contrast
  - `threshold` - Pure black & white threshold
  - `modulate` - Adjust brightness, saturation, hue, and lightness
  - `tint` - Apply color overlay/tinting

#### Border & Frame Operations
- `extend` - Add borders with custom backgrounds and colors
- `extract` - Crop specific regions from images
- `roundCorners` - Round image corners using SVG masking

#### Text Rendering
- `addText` - Add styled text to images with:
  - Custom positioning (x, y coordinates)
  - Font family and size
  - Text color and alignment (left, center, right)
  - Text shadows for readability
  - Text strokes/outlines
  - Maximum width for text wrapping
- `addCaption` - Add caption bars with:
  - Top or bottom positioning
  - Custom background colors
  - Custom text colors and sizes
  - Configurable padding

#### Preset Filters
8 ready-to-use preset filters built from Sharp primitives:
- `vintage` - Retro/sepia look with warm tones
- `vibrant` - Enhanced saturation and brightness
- `blackAndWhite` - High-quality B&W conversion with contrast enhancement
- `dramatic` - High contrast with boosted saturation
- `soft` - Dreamy/blurred effect
- `cool` - Blue tint for cool tones
- `warm` - Orange/red tint for warm tones
- `highContrast` - Sharp black & white with maximum contrast

#### CLI Commands
- `imgflo filter` - Apply filter operations from command line
- `imgflo preset` - Apply preset filters by name
- `imgflo text add` - Add text to images with full styling options
- `imgflo text caption` - Add caption bars to images
- Updated `imgflo transform` to support all new operations

#### MCP Integration
- Updated `transform_image` tool to support all new filter, border, text, and preset operations
- Enhanced parameter documentation for AI-driven image manipulation
- Full natural language support for new operations

#### Documentation
- Created comprehensive architecture guide: `CORE_VS_PLUGINS.md`
- Added decision tree for determining when features belong in core vs plugins
- Created `filters-example.ts` demonstrating all v0.3.0 capabilities
- Updated MONOREPO.md with architecture references

### Changed
- Updated package version to 0.3.0
- Updated MCP server version to 0.3.0
- Enhanced TypeScript types to include all new transform operations

### Dependencies
- **Added**: `@napi-rs/canvas` (^0.1.80) - Native Rust bindings for text rendering (~2MB)
  - High-performance text rendering using Skia
  - Full font support with `GlobalFonts.registerFromPath()`
  - 13% faster than node-canvas
  - Actively maintained (3.9M weekly downloads)

### Technical Details
- All filter operations leverage Sharp's existing capabilities (zero new dependencies for filters)
- Preset filters use Sharp operation chaining (zero new dependencies)
- Text rendering is the only feature requiring a new dependency (@napi-rs/canvas)
- 20 new integration tests covering all transform operations
- All 44 tests passing
- No breaking changes to existing APIs

### Use Cases Enabled
- **Local Development**: Generate placeholder images with filters and text on-demand
- **Content Creation**: Apply professional filters and add captions to generated images
- **Design Assets**: Create avatars, icons, and graphics with rounded corners and borders
- **Automated Workflows**: Chain filters, effects, and text in YAML pipelines
- **AI Integration**: Natural language image manipulation via MCP

## [0.2.0] - 2025-01-10

### Added
- **Unified `save()` API** - Smart destination routing for filesystem and cloud storage
- **Filesystem Save Provider** - Zero-config local file saving (default provider)
- **S3 Save Provider** - Cloud storage support with smart URI routing
- **YAML Pipelines** - Declarative workflows with `imgflo run pipeline.yaml`
- **MCP Auto-save** - Automatically save generated images to avoid 25K token limit
- **Smart Destination Routing** - Auto-detect provider from path format:
  - `./local/path` → filesystem
  - `s3://bucket/key` → S3
  - `r2://bucket/key` → Cloudflare R2

### Changed
- Renamed `upload()` to `save()` for clearer semantics
- Renamed config `store` to `save` for consistency
- Updated all CLI commands: `imgflo upload` → `imgflo save`
- Updated all documentation to reflect new API

### Deprecated
- `upload()` method (use `save()` instead)
- `store` config option (use `save` instead)

### Fixed
- MCP server now returns saved file locations instead of large base64 blobs
- Resolved 25K token limit issues in MCP by auto-saving images

## [0.1.0] - 2025-01-05

### Added
- Initial release
- Core image generation API
- Built-in generators:
  - `shapes` - SVG gradients, circles, rectangles
  - `openai` - DALL-E integration
- Transform operations:
  - `convert` - Format conversion (SVG → PNG/JPEG/WebP/AVIF)
  - `resize` - Image resizing with fit modes
  - `composite` - Layer images together
  - `optimizeSvg` - SVG optimization
- Plugins:
  - `imgflo-quickchart` - Chart.js charts
  - `imgflo-d3` - D3 data visualizations
  - `imgflo-mermaid` - Mermaid diagrams
  - `imgflo-qr` - QR code generation
  - `imgflo-screenshot` - Website screenshots
- CLI interface with commands:
  - `imgflo generate` - Generate images
  - `imgflo transform` - Transform images
  - `imgflo upload` - Upload to cloud storage
  - `imgflo config` - Configure imgflo
  - `imgflo plugins` - List available plugins
  - `imgflo mcp` - MCP server setup
  - `imgflo doctor` - Check configuration
- MCP Server integration for Claude Code
- TypeScript support throughout
- Full documentation

### Dependencies
- `sharp` (^0.33.5) - Image processing
- `@resvg/resvg-js` (^2.6.2) - SVG rendering
- `@aws-sdk/client-s3` (^3.709.0) - S3 uploads
- `openai` (^4.77.3) - DALL-E integration
- `@modelcontextprotocol/sdk` (^1.20.0) - MCP server
- `commander` (^12.1.0) - CLI framework
- `yaml` (^2.6.1) - YAML parsing
- `dotenv` (^16.4.7) - Environment variables

---

## Version Numbering

imgflo follows [Semantic Versioning](https://semver.org/):
- **Major** (x.0.0): Breaking changes to API
- **Minor** (0.x.0): New features, backward compatible
- **Patch** (0.0.x): Bug fixes, backward compatible

## Links
- [GitHub Repository](https://github.com/bcooke/imgflo)
- [npm Package](https://www.npmjs.com/package/imgflo)
- [Documentation](https://github.com/bcooke/imgflo#readme)
