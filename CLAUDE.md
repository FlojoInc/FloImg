# floimg - Claude Code Quick Reference

Composable image workflow engine — any source, any transforms, any destination.

## What FloImg Is

**FloImg is a composable workflow engine** that solves three core problems:

### 1. The Probabilistic Editing Problem

When you ask ChatGPT to modify an image, DALL-E generates a new image—it doesn't edit pixels. Even AI "editing" like inpainting is probabilistic. "Change the colors" might give you a different composition. FloImg applies **deterministic transforms**: adjust hue mathematically, guaranteed to preserve everything else.

### 2. The Tool Fragmentation Problem

People wrangle remove.bg, Photoshop, Figma, format converters, cloud services. Each requires learning and sign-ups. FloImg consolidates into one pipeline.

### 3. Better Than Glue Code

FloImg isn't just integration code—it's accessible through multiple modalities: visual builder, natural language, SDK/CLI, MCP, YAML. Use whichever fits how you think.

### The Pipeline

```
Any source → Any transforms → Any destination
```

| Workflow Type     | Example                                      |
| ----------------- | -------------------------------------------- |
| AI + Professional | Generate with DALL-E → resize → caption → S3 |
| Purely Creative   | AI generate → AI refine → variations         |
| Purely Practical  | Chart → resize → format convert → CDN        |

**Lead with AI image workflows** in examples, not charts/diagrams/QR.

## Project Overview

- **Type**: Open-source monorepo
- **Stack**: TypeScript, pnpm workspaces
- **Packages**: `packages/*` - Core library + plugins (npm @teamflojo/\*)
- **Apps**: `apps/studio/*` - Visual workflow builder (React 19, Fastify 5)

## Git Conventions

### Commits

- **No AI co-authorship**: Do not add `Co-Authored-By: Claude` or similar footers
- **Conventional style**: `type: description` (e.g., `feat: add QR code rotation`)

### Pull Requests

- **Always use PRs** - No direct pushes to main
- **Linear history** - Use "Rebase and merge" (not merge commits)
- **Branch naming**: `type/description` (e.g., `feat/add-export`, `fix/auth-bug`)

**Branch prefixes:** `feat/`, `fix/`, `chore/`, `refactor/`, `docs/`

## Quick Start

```bash
pnpm install          # Install all dependencies
pnpm -r build         # Build all packages
pnpm -r test          # Test all packages
pnpm -r typecheck     # TypeScript validation
```

## Workflow Commands

### Task Lifecycle

- `/p [description]` - Plan new work (creates vault task)
- `/s T-YYYY-NNN` - Start task (creates branch, updates status)
- `/c` - Close current task (validates, optionally creates PR)
- `/ctx [note]` - Update context doc with decisions/notes
- `/st` - Quick status check (~500 tokens)
- `/w` - End-of-session wrap (saves context)

### GitHub Integration (OSS)

- `/gh link T-YYYY-NNN #123` - Link vault task to GitHub Issue
- `/gh create T-YYYY-NNN` - Create GitHub Issue from vault task
- `/gh sync` - Sync status between vault and GitHub Issues
- `/gh import #123` - Create vault task from GitHub Issue

### Escape Hatch

- `/x [request]` - Bypass PM workflow for quick tasks

## File Locations

```
packages/
├── floimg/             # Core library (exports: lib, CLI, MCP)
├── floimg-claude/      # Claude Code plugin
├── floimg-d3/          # D3 visualization plugin
├── floimg-mermaid/     # Mermaid diagram plugin
├── floimg-qr/          # QR code generator plugin
├── floimg-quickchart/  # QuickChart plugin
├── floimg-ollama/      # Ollama local AI provider
└── floimg-screenshot/  # Screenshot/Playwright plugin

apps/
└── studio/
    ├── frontend/       # React 19 + React Flow visual editor
    ├── backend/        # Fastify 5 API server
    └── shared/         # TypeScript types

vault/
├── _meta/              # Guidelines and conventions
├── _templates/         # Task/bug templates
├── architecture/       # Technical docs (evergreen)
└── pm/
    ├── tasks/          # Task files (T-YYYY-NNN)
    ├── bugs/           # Bug files (BUG-YYYY-NNN)
    └── _context/       # Working context docs
```

## Key Principles

1. **Read PROJECT_STATUS.md first** - Before scanning vault or asking questions
2. **Use /p before starting work** - Multi-step work needs task tracking
3. **Evergreen docs have no temporal language** - No "will", "recently", "soon"
4. **Link GitHub Issues to vault tasks** - Vault is source of truth, GH is public interface

## Releases

Packages in `packages/*` are published to npm as `@teamflojo/*`. After making changes:

1. **Check if a release is needed** - Any runtime behavior change in a published package requires a release
2. **Version bump**:
   - Patch (0.0.x): Bug fixes, type fixes that affect runtime
   - Minor (0.x.0): New features, non-breaking additions
   - Major (x.0.0): Breaking API changes
3. **Release process**:
   ```bash
   # Bump version in package.json
   # Commit: chore(package-name): release vX.Y.Z
   # Tag: @teamflojo/package-name@X.Y.Z
   # Push with tags
   # Publish: cd packages/package-name && pnpm publish --access public
   ```

**Proactive rule**: When fixing bugs in published packages, always check if a patch release is needed before closing out the work.

## Plugin Development

See `vault/architecture/Monorepo-Guide.md` for plugin creation guide. Quick pattern:

```typescript
// packages/floimg-{name}/src/index.ts
import { createGenerator, GeneratorSchema } from "@teamflojo/floimg";

const schema: GeneratorSchema = {
  name: "my-generator",
  description: "What it does",
  parameters: {
    // Define parameters
  },
};

export const myGenerator = createGenerator(schema, async (params, ctx) => {
  // Implementation
  return ctx.createImageFromBuffer(buffer, "output.png");
});
```

## FloImg Studio (Visual Workflow Builder)

The FloImg Studio visual editor lives in `apps/studio/`.

### Quick Start

```bash
pnpm dev:studio     # Run frontend (5173) + backend (5100)
pnpm build:studio   # Build studio packages
```

### Structure

- `apps/studio/frontend/` - React 19, React Flow, Zustand, TanStack Query
- `apps/studio/backend/` - Fastify 5, floimg integration, WebSocket support
- `apps/studio/shared/` - TypeScript types shared between frontend/backend

### Key Files

- `apps/studio/frontend/src/editor/WorkflowEditor.tsx` - Main canvas
- `apps/studio/backend/src/floimg/executor.ts` - Workflow execution
- `apps/studio/backend/src/floimg/registry.ts` - Node type discovery

## Agents

- `coordinator` - Multi-package work spanning core + plugins + FloImg Studio
- `full-stack-dev` - Plugin development, core library, and FloImg Studio work
- `code-reviewer` - PR reviews and code quality
- `vault-organizer` - Documentation maintenance

## External Contributors

External contributors use GitHub Issues. When triaging:

1. Simple bug fix -> Direct PR welcome
2. Complex work -> Create vault task, link with `/gh link`
3. Feature request -> Discuss in issue, then vault task if approved

## Resources

- [[MONOREPO]] - Development guide
- [[README]] - Public docs
- [[CHANGELOG]] - Version history
- [[vault/architecture/Plugin-Architecture]] - Plugin system design
