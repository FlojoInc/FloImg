# floimg - Claude Code Quick Reference

Composable image workflow engine — any source, any transforms, any destination.

## What FloImg Is

**FloImg is a composable workflow engine for images** with two core differentiators:

### 1. Deterministic Transforms

When you ask ChatGPT to modify an image, DALL-E generates a new image—it doesn't edit pixels. Even AI "editing" like inpainting is probabilistic. FloImg applies deterministic transforms: adjust hue mathematically, resize to exact dimensions, add caption at precise position. The image stays intact except for exactly what you requested.

### 2. A Unified API

FloImg models image manipulation as a series of composable steps—each transform takes an image and returns an image. This functional approach consolidates the patchwork of tools and SDKs into one abstraction layer.

The same workflow definition is portable across interfaces:

- **SDK**: Embed in any JS/TS application
- **CLI**: Terminal workflows and CI/CD pipelines
- **Visual builder**: Prototyping and non-technical users
- **MCP**: AI agents and LLM-driven automation

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
├── floimg/             # Core library (exports: lib, CLI)
├── floimg-mcp/         # MCP server for AI agents
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
5. **No backwards compatibility (pre-1.0)** - Delete, don't deprecate. Remove old code entirely rather than keeping legacy paths. See [[No-Backwards-Compatibility]]
6. **Self-documenting code** - No PM artifact references in source code (see below)

## PM Artifacts in Code (CRITICAL)

**Source code should never reference PM artifacts.** Code must be self-documenting.

| Location                  | Task/Bug IDs (T-/BUG-) | Epics | ADRs  |
| ------------------------- | ---------------------- | ----- | ----- |
| Source code (_.ts, _.tsx) | Never                  | Never | Never |
| Vault docs                | OK (local tasks only)  | Never | Never |
| Commits / PRs             | OK                     | OK    | OK    |

**Why?** This is a public repo. External contributors can't see ecosystem-level EPICs or ADRs (they exist elsewhere). Even local task references in code require looking up the PM system to understand the code.

```typescript
// BAD - requires PM system lookup
// Implements T-2026-001 iterative node types

// GOOD - self-documenting
// Creates a fan-out node that splits workflow execution into parallel branches
```

**Where PM artifacts belong:**

- Commit messages: `feat(studio): add fan-out node (T-2026-001)`
- PR descriptions: "Implements T-2026-001"
- Vault docs: `Related: [[T-2025-007]]`

## Releases

Packages in `packages/*` are published to npm as `@teamflojo/*`.

### Naming Clarification

**Important**: The name "floimg" is used in two contexts:

| Term                  | Meaning                                     | Example                         |
| --------------------- | ------------------------------------------- | ------------------------------- |
| **floimg monorepo**   | This git repository containing all packages | `github.com/FlojoInc/floimg`    |
| **@teamflojo/floimg** | The core library npm package                | `npm install @teamflojo/floimg` |

**Git tags (vX.Y.Z) represent monorepo releases**, not individual package versions. The root `package.json` version is kept in sync with git tags as a "monorepo release identifier". Each package has its own independent semver. See `vault/architecture/Versioning.md` for full details.

### When to Release

**Release immediately:**

- Bug fixes affecting users in production
- Security patches
- Breaking changes (let users migrate promptly)

**Batch for later:**

- New features (accumulate until meaningful value)
- Non-urgent improvements
- Single small additions (combine with other changes)

**Don't release:**

- Documentation-only changes
- Test improvements
- Internal refactors with no API change

**Key principle**: Release when there's value, not on a schedule.

### Version Bumps

| Change Type                       | Bump          | Example                      |
| --------------------------------- | ------------- | ---------------------------- |
| Bug fix                           | Patch (0.0.x) | Fix presigned URL expiration |
| New feature, non-breaking         | Minor (0.x.0) | Add hideWorkflowLibrary prop |
| Breaking API change               | Major (x.0.0) | Remove deprecated method     |
| Internal refactor (no API change) | None          | Reorganize internal modules  |

**Rule**: Only bump versions for changes that affect consumers of the package.

### Changelog Discipline

**CRITICAL**: Never tag a release without updating CHANGELOG.md first.

```markdown
## [v0.9.0] - 2026-01-15

### @teamflojo/floimg-studio-ui (0.2.3)

- feat: add hideWorkflowLibrary prop to Toolbar

### @teamflojo/floimg (0.7.2)

- fix: correct presigned URL expiration
```

Format rules:

- Section header = git tag (monorepo release)
- Sub-sections = only packages that changed
- Include npm package version in parentheses
- Prefix with conventional commit type (feat/fix/breaking)

### Release Process

**CRITICAL**: Use `vX.Y.Z` tags (not `@teamflojo/pkg@X.Y.Z`). The `v*` tag triggers the release workflow.

```bash
# 1. Update CHANGELOG.md with new section header [vX.Y.Z]
# 2. Bump version in changed package.json files
# 3. Run release script (validates and updates root package.json)
./scripts/release.sh X.Y.Z

# 4. Follow script instructions to commit, tag, push
git commit -am "chore: release vX.Y.Z"
git tag vX.Y.Z
git push origin main --tags

# 5. Verify GitHub Releases and npm
```

The release script validates:

- Version format is valid semver
- Version is higher than current highest tag
- CHANGELOG.md has an entry for the version
- You're on main branch with no uncommitted changes

The `v*` tag triggers `.github/workflows/release.yml` which:

- Publishes all @teamflojo/\* packages to npm
- Builds and pushes Docker image to ghcr.io
- Creates GitHub Release with changelog

**Common mistakes**:

- Creating `@teamflojo/floimg@0.6.1` tags does NOT trigger a release. Always use simple `v0.6.1` format.
- Creating a tag with version LOWER than existing (e.g., v0.6.0 when v0.7.1 exists). Always check highest version first!
- Forgetting to check npm version - git tags and npm can diverge if releases fail.
- Tagging without updating CHANGELOG.md first - always document before releasing.

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
