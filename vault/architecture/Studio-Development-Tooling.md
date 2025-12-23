# Development Tooling

Code quality and automation tooling for floimg-studio.

## Overview

floimg-studio is a React 19 + Fastify 5 application with three packages (frontend, backend, shared). The tooling enforces type safety and code style in development while keeping production Docker builds lean.

## Tools

| Tool        | Purpose                | Config File                        |
| ----------- | ---------------------- | ---------------------------------- |
| TypeScript  | Type checking          | `tsconfig.json` per package        |
| ESLint      | Linting (TS + React)   | `eslint.config.js`                 |
| Prettier    | Formatting             | `.prettierrc`                      |
| Husky       | Git hooks              | `.husky/`                          |
| lint-staged | Staged file processing | `package.json`                     |
| Vite        | Frontend build + types | `packages/frontend/vite.config.ts` |

## Pre-commit Workflow

Every commit triggers:

```
pnpm -r typecheck    # TypeScript across all packages
pnpm lint-staged     # ESLint + Prettier on staged files
```

## ESLint Configuration

The ESLint config includes React-specific plugins:

- `@typescript-eslint/parser` + `@typescript-eslint/eslint-plugin`
- `eslint-plugin-react` for React rules
- `eslint-plugin-react-hooks` for hooks rules
- `eslint-config-prettier` to avoid conflicts

Key rules:

- `react/react-in-jsx-scope` disabled (React 17+ JSX transform)
- `react/prop-types` disabled (TypeScript handles prop validation)
- Console logging warns in frontend, allowed in backend

## Vite Environment Types

The frontend uses Vite's `import.meta.env` for environment variables. Type definitions are in `packages/frontend/src/vite-env.d.ts`:

```typescript
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEB_URL: string;
  readonly VITE_DEPLOYMENT_MODE: string;
}
```

This file must exist for TypeScript to recognize `import.meta.env` properties.

## Package Scripts

```bash
pnpm dev            # Run frontend + backend in parallel
pnpm build          # Build all packages
pnpm typecheck      # Type check all packages
pnpm lint           # Lint all packages
pnpm lint:fix       # Lint and auto-fix
pnpm format         # Format all source files
```

## Docker Build

The production Dockerfile uses `--ignore-scripts` to skip Husky setup:

```dockerfile
RUN pnpm install --frozen-lockfile --ignore-scripts
```

This keeps production builds fast and avoids errors from missing dev dependencies.

## Development vs Production

| Concern       | Development      | Production (Docker)              |
| ------------- | ---------------- | -------------------------------- |
| Git hooks     | Active via Husky | Skipped via `--ignore-scripts`   |
| Type checking | Pre-commit + IDE | Build-time (tsc before vite)     |
| Linting       | Pre-commit       | Not run (assumed clean from dev) |
| Source maps   | Enabled          | Disabled                         |

## Related

- [[Cloud-Integration]] - How studio connects to floimg-cloud
