# floimg Monorepo

This repository uses a pnpm workspace monorepo structure to manage the core library and plugin packages.

## Structure

```
floimg/
├── packages/
│   ├── floimg/              # Core library
│   ├── floimg-d3/           # D3 visualization plugin
│   ├── floimg-mermaid/      # Mermaid diagram plugin
│   ├── floimg-qr/           # QR code plugin
│   ├── floimg-quickchart/   # QuickChart plugin
│   └── floimg-screenshot/   # Screenshot plugin
├── vault/                   # Documentation (Obsidian-compatible)
├── pnpm-workspace.yaml      # Workspace config
├── package.json             # Root scripts
└── README.md                # Main documentation
```

## Why Monorepo?

1. **Plugin Architecture**: Each generator can be a separate package
2. **Independent Versioning**: Plugins can release independently
3. **Shared Development**: Easy to test changes across packages
4. **Workspace Protocol**: Local packages link together automatically
5. **Lean Core**: Users only install what they need

## Development

### Prerequisites

```bash
# Install pnpm globally
npm install -g pnpm
```

### Setup

```bash
# Clone the repository
git clone https://github.com/bcooke/floimg.git
cd floimg

# Install all dependencies (automatically installs for all packages)
pnpm install

# Build all packages
pnpm build

# Dev mode (watch all packages)
pnpm dev

# Run all tests
pnpm test

# Run fast unit tests only (recommended during development)
pnpm test:unit

# Run browser-based integration tests
pnpm test:integration

# Watch mode for TDD
pnpm test:watch
```

📖 See [[Testing-Strategy]] for detailed testing documentation.

### Package Commands

```bash
# Build all packages
pnpm -r build

# Build specific package
cd packages/floimg-quickchart
pnpm build

# Dev mode for all packages (parallel)
pnpm -r --parallel dev

# Clean all packages
pnpm -r clean
```

## Creating a New Plugin

### 1. Create Package Directory

```bash
mkdir -p packages/floimg-myplugin/src
cd packages/floimg-myplugin
```

### 2. Create package.json

```json
{
  "name": "floimg-myplugin",
  "version": "0.1.0",
  "description": "Description of your generator",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "files": ["dist", "README.md", "LICENSE"],
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "peerDependencies": {
    "floimg": "workspace:*"
  },
  "devDependencies": {
    "floimg": "workspace:*",
    "typescript": "^5.7.2"
  }
}
```

### 3. Create tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true
  }
}
```

### 4. Implement Generator

```typescript
// src/index.ts
import type { ImageGenerator, ImageBlob } from "floimg";

export default function myGenerator(config = {}): ImageGenerator {
  return {
    name: "myplugin",

    async generate(params: Record<string, unknown>): Promise<ImageBlob> {
      // Your implementation here
      const bytes = Buffer.from("...");

      return {
        bytes,
        mime: "image/png",
        width: 800,
        height: 600,
        source: "myplugin",
      };
    },
  };
}

export { myGenerator };
```

### 5. Add README

Document your plugin thoroughly, including:

- Installation instructions
- Usage examples
- Configuration options
- All parameters
- Links to upstream library docs (if pass-through)

### 6. Install and Build

```bash
# From monorepo root
pnpm install
pnpm -r build
```

## Workspace Protocol

The `workspace:*` protocol in `package.json` means "use the local version during development":

```json
{
  "peerDependencies": {
    "floimg": "workspace:*" // Links to local packages/floimg
  }
}
```

When published to npm, this becomes:

```json
{
  "peerDependencies": {
    "floimg": "^0.1.0" // Real version number
  }
}
```

## Publishing

### Publishing Core

```bash
cd packages/floimg
npm version patch  # or minor, major
pnpm build
npm publish
```

### Publishing Plugins

Each plugin publishes independently:

```bash
cd packages/floimg-quickchart
npm version patch
pnpm build
npm publish
```

## Testing Locally

To test a plugin in another project before publishing:

```bash
# In the monorepo
cd packages/floimg-myplugin
pnpm build
npm link

# In your test project
npm link floimg-myplugin

# Use it
import myplugin from 'floimg-myplugin';
```

## Adding Dependencies

### Add to Specific Package

```bash
cd packages/floimg-quickchart
pnpm add some-dependency
```

### Add to Root (DevDependencies)

```bash
# From monorepo root
pnpm add -D -w some-dev-tool
```

The `-w` flag adds to workspace root.

## Package Relationships

```
floimg (core)
  ↑ peer dependency
  │
  ├── floimg-d3
  ├── floimg-mermaid
  ├── floimg-qr
  ├── floimg-quickchart
  └── floimg-screenshot
```

- **Core**: Provides ImageGenerator interface and base functionality
- **Plugins**: Depend on core as peer dependency
- **Users**: Install core + whichever plugins they need

## Best Practices

### 1. Core vs Plugins Architecture

**📖 See [Core vs Plugins Guide](./vault/architecture/Core-vs-Plugins.md) for detailed decision-making framework.**

Key principle:

- **Core**: Fundamental image operations using dependencies we already need (< 5MB new deps)
- **Plugins**: Specialized generation or heavy dependencies (> 5MB)

Examples:

- ✅ Core: Filters (Sharp-based), text rendering (@napi-rs/canvas, 2MB)
- ✅ Plugin: Screenshots (Playwright, 200MB), QR codes (specialized library)

### 2. Follow Pass-Through Pattern

Generators should accept native library formats:

```typescript
// ✅ Good: Chart.js format directly
params: {
  type: 'bar',
  data: { labels: [...], datasets: [...] }
}

// ❌ Bad: floimg abstraction
params: {
  chartType: 'bar',  // Custom floimg format
  xAxis: [...],
  yAxis: [...]
}
```

### 3. Document Thoroughly

Each plugin README should include:

- What it does
- Installation
- Basic usage
- All parameters
- Advanced examples
- Link to upstream docs

### 4. Minimal Implementation

Keep generator code simple (~20-100 lines):

```typescript
export default function (config) {
  return {
    name: "myplugin",
    async generate(params) {
      // 1. Accept native format
      // 2. Call underlying library/API
      // 3. Return ImageBlob
    },
  };
}
```

## CI/CD

### Build All Packages

```bash
pnpm install
pnpm -r build
pnpm -r test
```

### Versioning Strategy

- **Core**: Follows semver strictly
- **Plugins**: Can version independently
- **Breaking Changes**: Coordinate major versions

## Troubleshooting

### "Cannot find module 'floimg'"

```bash
# Rebuild all packages
pnpm -r build
```

### Workspace not resolving

```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### TypeScript errors in plugins

Make sure you've built the core package first:

```bash
cd packages/floimg
pnpm build
cd ../floimg-myplugin
pnpm build
```

## Contributing

When contributing a new plugin:

1. Fork the repository
2. Create plugin package following structure above
3. Add documentation
4. Add examples
5. Test locally
6. Submit PR

## See Also

- [[Generator-Strategy]] - How generators work
- [[Core-vs-Plugins]] - What belongs in core vs plugins
- [[Testing-Strategy]] - Test architecture and best practices
- [[Plugin-Architecture]] - Plugin development guide
- [pnpm Workspaces](https://pnpm.io/workspaces)
