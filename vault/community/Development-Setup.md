# Development Setup

This guide covers setting up a local development environment for contributing to floimg.

## Prerequisites

### Required

- **Node.js** 18.0.0 or higher
- **pnpm** 8.0.0 or higher
- **Git**

### Optional (for specific packages)

- **Chrome/Chromium** - For floimg-mermaid and floimg-screenshot tests
- **Playwright** - Installed automatically by floimg-screenshot

## Initial Setup

### 1. Fork and Clone

```bash
# Fork on GitHub first, then:
git clone https://github.com/YOUR-USERNAME/floimg.git
cd floimg

# Add upstream remote
git remote add upstream https://github.com/TeamFlojo/floimg.git
```

### 2. Install pnpm

If you don't have pnpm installed:

```bash
npm install -g pnpm
```

### 3. Install Dependencies

```bash
pnpm install
```

This installs dependencies for all packages in the monorepo.

### 4. Build All Packages

```bash
pnpm -r build
```

### 5. Run Tests

```bash
# Fast unit tests (recommended during development)
pnpm test:unit

# All tests including browser-based integration tests
pnpm -r test
```

## Development Workflow

### Watch Mode

For active development, run TypeScript in watch mode:

```bash
# Watch all packages
pnpm -r --parallel dev

# Watch specific package
cd packages/floimg-qr
pnpm dev
```

### Running Tests

```bash
# Unit tests only (fast, ~1 second)
pnpm test:unit

# Integration tests (slower, uses browser)
pnpm test:integration

# Watch mode for TDD
pnpm test:watch

# Test specific package
cd packages/floimg-stability
pnpm test
```

See [[../architecture/Testing-Strategy]] for detailed testing documentation.

### Type Checking

```bash
# Type check all packages
pnpm -r typecheck

# Type check specific package
cd packages/floimg
pnpm typecheck
```

## Package Structure

```
floimg/
├── packages/
│   ├── floimg/              # Core library + CLI + MCP
│   ├── floimg-openai/       # OpenAI DALL-E + Vision
│   ├── floimg-stability/    # Stability AI
│   ├── floimg-google/       # Google Imagen
│   ├── floimg-replicate/    # Replicate (GFPGAN, DeOldify, etc.)
│   ├── floimg-ollama/       # Ollama local AI
│   ├── floimg-quickchart/   # Chart.js charts
│   ├── floimg-d3/           # D3 visualizations
│   ├── floimg-mermaid/      # Mermaid diagrams
│   ├── floimg-qr/           # QR codes
│   ├── floimg-screenshot/   # Playwright screenshots
│   └── floimg-claude/       # Claude Code plugin
├── apps/
│   └── studio/              # FloImg Studio visual builder
│       ├── frontend/        # React + React Flow
│       ├── backend/         # Fastify API
│       └── shared/          # Shared types
├── examples/                # Example scripts
└── vault/                   # Documentation
```

## Environment Variables

For testing AI features, set up API keys:

```bash
# Create .env file (gitignored)
cat > .env << 'EOF'
OPENAI_API_KEY=sk-...
STABILITY_API_KEY=sk-...
REPLICATE_API_TOKEN=r8_...
GOOGLE_AI_API_KEY=...
EOF
```

Keys are optional—tests mock API calls by default.

## Working on Specific Areas

### Core Library

```bash
cd packages/floimg
pnpm dev      # Watch mode
pnpm test     # Run tests
```

Key files:

- `src/core/client.ts` - Main client
- `src/core/types.ts` - Type definitions
- `src/providers/` - Transform providers

### Generators

Each generator is a separate package:

```bash
cd packages/floimg-quickchart
pnpm dev
pnpm test
```

See [[../architecture/Monorepo-Guide#Creating a New Plugin]] for creating new generators.

### FloImg Studio

```bash
# Run frontend + backend
pnpm dev:studio

# Or separately:
cd apps/studio/frontend && pnpm dev
cd apps/studio/backend && pnpm dev
```

Access at http://localhost:5173 (frontend) with API at http://localhost:5100.

### CLI

```bash
# Run CLI during development
cd packages/floimg
pnpm cli generate qr "https://example.com"

# Or use ts-node directly
npx tsx src/cli/index.ts generate qr "https://example.com"
```

## Common Tasks

### Add a Dependency

```bash
# To specific package
cd packages/floimg-qr
pnpm add qrcode

# To workspace root (dev dependencies)
pnpm add -D -w vitest
```

### Update Dependencies

```bash
pnpm update -r
```

### Clean Build Artifacts

```bash
pnpm -r clean
pnpm -r build
```

### Link Local Package

To test a package in another project:

```bash
cd packages/floimg-myplugin
pnpm build
npm link

# In other project
npm link @teamflojo/floimg-myplugin
```

## Troubleshooting

### "Cannot find module"

Rebuild all packages:

```bash
pnpm -r build
```

### Type Errors After Pull

Dependencies may have changed:

```bash
pnpm install
pnpm -r build
```

### Tests Hanging

Ensure tests use `--run` flag (already configured in package.json):

```bash
pnpm test  # Uses vitest --run
```

### Browser Tests Failing

Install Playwright browsers:

```bash
npx playwright install chromium
```

## Editor Setup

### VS Code

Recommended extensions:

- TypeScript + JavaScript
- ESLint
- Prettier

Settings for monorepo:

```json
{
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

### Obsidian

The `vault/` directory is an Obsidian vault. Open it directly in Obsidian for linked documentation browsing.

## See Also

- [[Contributing]] - Contribution guidelines
- [[../architecture/Monorepo-Guide]] - Detailed monorepo guide
- [[../architecture/Testing-Strategy]] - Testing architecture
- [[../architecture/Plugin-Architecture]] - Plugin development
