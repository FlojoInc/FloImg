---
id: T-2026-019
title: Sync monorepo version with git tags
status: completed
priority: p2
created: 2026-01-16
---

# Sync monorepo version with git tags

## Problem

The monorepo has confusing versioning:

- Git tags: v0.15.6
- Root package.json: 0.2.0
- Individual packages: various (0.14.1, 0.5.4, etc.)

Users see "v0.15" in releases/changelog but that number isn't clearly defined anywhere.

## Solution

1. Sync root `package.json` version with git tags
2. Create a release script to automate the process
3. Document the versioning model

The root version becomes "what release is this monorepo at" - independent of individual package versions.

## Acceptance Criteria

- [x] Root package.json synced to 0.15.6
- [x] Release script created (`scripts/release.sh`)
- [x] `vault/architecture/Versioning.md` created
- [x] CLAUDE.md release process updated
- [x] floimg-hq Versioning-Strategy.md updated

All criteria met.

## Implementation Notes

- Root package.json is `private: true` - never published
- Git tag triggers release workflow
- Each package has independent semver
- Root version = monorepo release identifier
