# Changelog

All notable changes to imgflo will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-01-XX

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
