# Versioning

How versions work in the floimg monorepo.

## Two Types of Versions

```
Monorepo Release: v0.15.6        ← Git tag, root package.json
├── @teamflojo/floimg: 0.14.1           ← Independent package version
├── @teamflojo/floimg-studio-ui: 0.5.4
├── @teamflojo/floimg-openai: 0.3.0
└── ...other packages
```

| Version Type     | Where                          | Purpose                        |
| ---------------- | ------------------------------ | ------------------------------ |
| Monorepo release | Git tag, root `package.json`   | "What release is this repo at" |
| Package version  | Each `packages/*/package.json` | npm semver for that package    |

## Monorepo Release Version

The root `package.json` version and git tag are kept in sync:

```json
// package.json (root)
{
  "name": "floimg-monorepo",
  "version": "0.15.6", // ← matches git tag v0.15.6
  "private": true
}
```

This version is:

- **A release identifier**, not a package version
- **Incremented on each release**, regardless of which packages changed
- **Used in changelog section headers**: `## [v0.15.6] - 2026-01-15`

### When to Bump

Bump based on the "biggest" change across all packages in the release:

| Change in any package | Monorepo version bump   |
| --------------------- | ----------------------- |
| Breaking API change   | Major (0.x.0 → 1.0.0)   |
| New feature           | Minor (0.15.x → 0.16.0) |
| Bug fix only          | Patch (0.15.6 → 0.15.7) |

## Package Versions

Each package has its own independent semver:

```json
// packages/floimg/package.json
{
  "name": "@teamflojo/floimg",
  "version": "0.14.1" // ← this package's version
}
```

Package versions:

- Follow standard semver based on that package's changes
- Are independent of other packages
- Are what users see on npm

## Release Process

Use the release script:

```bash
# 1. Update CHANGELOG.md with new section
## [v0.15.7] - 2026-01-16
### @teamflojo/floimg (0.14.2)
- fix: description of fix

# 2. Bump package versions in their package.json files

# 3. Run release script
./scripts/release.sh 0.15.7

# 4. Follow the script's instructions to commit, tag, push
```

The script:

- Updates root `package.json` to match
- Validates CHANGELOG.md has the version entry
- Validates version is higher than current highest tag
- Provides commit/tag/push instructions

## Why This Model?

**Independent package versions** because:

- Packages evolve at different rates
- Users install specific packages, not the monorepo
- Avoids unnecessary version bumps for unchanged packages

**Unified monorepo release** because:

- Provides a single "what's in this release" identifier
- Makes changelog organization clear
- Matches GitHub Releases

## Changelog Format

```markdown
## [v0.15.7] - 2026-01-16 ← Monorepo release

### @teamflojo/floimg (0.14.2) ← Package + its new version

- fix: handle undefined inputs

### @teamflojo/floimg-studio-ui (0.5.5)

- feat: add dark mode toggle
```

Only list packages that changed in that release.

## FAQ

**Q: Why doesn't the monorepo version match any package version?**

A: They serve different purposes. The monorepo version is a release identifier (like a build number). Package versions are npm semver for individual packages.

**Q: What if I only change one package?**

A: Bump that package's version, add a changelog entry, bump monorepo version (patch), and release.

**Q: What triggers npm publish?**

A: The `v*` git tag triggers `.github/workflows/release.yml`, which publishes all packages (npm skips unchanged versions).
