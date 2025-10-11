# Documentation Organization

This document explains how documentation is organized in the imgflo monorepo.

## Structure

```
imgflo/
├── docs/                           # Monorepo-wide documentation
│   ├── USAGE.md                    # Comprehensive usage guide
│   ├── STATUS.md                   # Project status and roadmap
│   └── development/
│       └── GENERATOR_STRATEGY.md   # Architecture philosophy
│
├── packages/imgflo/docs/           # Core package documentation
│   └── guides/
│       ├── QUICK_START.md          # Core quick start
│       ├── CONFIGURATION.md        # Core configuration
│       ├── OPENAI_GENERATOR.md     # OpenAI (built-in)
│       ├── MCP_SERVER.md           # MCP server (built-in)
│       └── S3_PROVIDERS.md         # Storage (core)
│
├── packages/imgflo-quickchart/
│   └── README.md                   # Plugin documentation
│
├── packages/imgflo-d3/
│   └── README.md                   # Plugin documentation
│
├── packages/imgflo-screenshot/
│   └── README.md                   # Plugin documentation
│
├── packages/imgflo-mermaid/
│   └── README.md                   # Plugin documentation
│
├── packages/imgflo-qr/
│   └── README.md                   # Plugin documentation
│
├── examples/
│   └── *.ts                        # Working examples
│
├── README.md                       # Main entry point (three usage patterns)
├── MONOREPO.md                     # Development guide
└── DOCUMENTATION.md                # This file (meta-documentation)
```

## Documentation Types

### Root Level (Monorepo-wide)

**When to put docs here**: Only for immediately visible entry points.

- **README.md** - Main project overview with three usage patterns (Library, CLI, MCP)
- **MONOREPO.md** - Development guide for contributors
- **DOCUMENTATION.md** - This file (meta-documentation)

### `docs/` - Shared Documentation

**When to put docs here**: Reference documentation that spans packages.

- **docs/USAGE.md** - Comprehensive usage guide for all three patterns
- **docs/STATUS.md** - Project status, roadmap, next steps
- **docs/development/GENERATOR_STRATEGY.md** - Architecture philosophy (applies to all generators)

### `packages/imgflo/docs/` - Core Package Docs

**When to put docs here**: Documentation specific to the core package features.

Core package includes:
- Built-in generators (shapes, openai)
- Transform system (Sharp, Resvg)
- Storage system (S3, filesystem)
- MCP server
- CLI

Core-specific documentation:
- **QUICK_START.md** - Quick reference for core features
- **CONFIGURATION.md** - Core configuration system
- **OPENAI_GENERATOR.md** - OpenAI built-in generator
- **MCP_SERVER.md** - MCP server setup and usage
- **S3_PROVIDERS.md** - Storage configuration
- **PUBLISHING.md** - Publishing core package

### `packages/{plugin}/README.md` - Plugin Docs

**When to put docs here**: Documentation specific to a plugin.

Each plugin should have comprehensive README with:
- Installation instructions
- Usage examples
- Configuration options
- All parameters documented
- Links to upstream library docs
- Troubleshooting

Examples:
- **imgflo-quickchart/README.md** - Chart.js integration
- **imgflo-screenshot/README.md** - Playwright screenshots
- **imgflo-mermaid/README.md** - Mermaid diagrams

## Finding Documentation

### I want to...

**Get started quickly**
- → [Main README](./README.md) - Overview and three usage patterns
- → [docs/USAGE.md](./docs/USAGE.md) - Comprehensive usage guide

**Learn about the architecture**
- → [docs/development/GENERATOR_STRATEGY.md](./docs/development/GENERATOR_STRATEGY.md)
- → [MONOREPO.md](./MONOREPO.md)

**Use core features**
- → [packages/imgflo/docs/guides/](./packages/imgflo/docs/guides/)

**Use a specific plugin**
- → Check that plugin's README:
  - [imgflo-quickchart/README.md](./packages/imgflo-quickchart/README.md)
  - [imgflo-d3/README.md](./packages/imgflo-d3/README.md)
  - [imgflo-screenshot/README.md](./packages/imgflo-screenshot/README.md)
  - [imgflo-mermaid/README.md](./packages/imgflo-mermaid/README.md)
  - [imgflo-qr/README.md](./packages/imgflo-qr/README.md)

**Develop/contribute**
- → [MONOREPO.md](./MONOREPO.md)
- → [docs/STATUS.md](./docs/STATUS.md)

**See examples**
- → [examples/](./examples/) - Working code examples

## Contributing Documentation

### When creating new docs:

1. **Is it about a specific plugin?**
   - ✅ Add to that plugin's README
   - ❌ Don't put in shared docs

2. **Is it about core features?**
   - ✅ Add to `packages/imgflo/docs/guides/`
   - ❌ Don't put in root docs

3. **Is it conceptual/architectural?**
   - ✅ Add to `docs/development/`
   - ❌ Don't put in package docs

4. **Is it about the monorepo itself?**
   - ✅ Add to root level
   - ❌ Don't put in package docs

### Documentation Standards

All documentation should:
- Be written in Markdown
- Include a clear title
- Have a table of contents for long docs
- Show code examples
- Link to related documentation
- Be kept up to date with code changes

## Historical Documents

`packages/imgflo/docs/development/` contains historical development documents:
- **SPEC.md** - Original specification
- **PROJECT_SUMMARY.md** - Early project summary
- **SUMMARY_v2.md** - Updated summary
- **FINAL_SUMMARY.md** - Pre-monorepo summary
- **MCP_IMPLEMENTATION.md** - MCP implementation notes
- **STATUS.md** - Old status (superseded by root STATUS.md)

These are kept for historical reference but may be outdated.

## Updating This Guide

When adding new documentation:
1. Create the document in the appropriate location
2. Update the relevant index (docs/README.md, package README, etc.)
3. Update this guide if it changes the organization
4. Link to it from relevant places

---

**Quick Links:**
- [Main README](./README.md)
- [Usage Guide](./docs/USAGE.md)
- [Status & Roadmap](./docs/STATUS.md)
- [Development Guide](./MONOREPO.md)
