# floimg - Claude Code Quick Reference

Universal image workflow engine for developers and AI agents.

## Project Overview

- **Type**: Open-source monorepo
- **Stack**: TypeScript, pnpm workspaces
- **Packages**: `packages/*` - Core library + 6 plugins (npm @teamflojo/\*)
- **Apps**: `apps/studio/*` - Visual workflow builder (React 19, Fastify 5)

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

## Studio (Visual Workflow Builder)

The Studio visual editor lives in `apps/studio/`.

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

- `coordinator` - Multi-package work spanning core + plugins + studio
- `full-stack-dev` - Plugin development, core library, and studio work
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
