# Releasing FloImg

How to publish new versions of @teamflojo/\* packages.

## Quick Version

```bash
# 1. Bump version in packages/*/package.json
# 2. Commit and merge PR
git commit -m "chore: release vX.Y.Z"

# 3. Create version tag (CRITICAL)
git tag vX.Y.Z

# 4. Push tag
git push origin vX.Y.Z
```

## What Happens

The `v*` tag triggers `.github/workflows/release.yml` which automatically:

1. **Publishes to npm** - All @teamflojo/\* packages
2. **Builds Docker image** - Pushes to ghcr.io/teamflojo/floimg-studio
3. **Creates GitHub Release** - With auto-generated changelog

## Version Bumps

| Type          | When             | Example       |
| ------------- | ---------------- | ------------- |
| Patch (0.0.x) | Bug fixes        | 0.6.0 → 0.6.1 |
| Minor (0.x.0) | New features     | 0.6.0 → 0.7.0 |
| Major (x.0.0) | Breaking changes | 0.6.0 → 1.0.0 |

## Common Mistake

**WRONG**: `@teamflojo/floimg@0.6.1` tags do NOT trigger a release

**RIGHT**: `v0.6.1` tags trigger the release workflow

The workflow pattern is `v*`, so only simple version tags like `v0.6.1` work.

## Verification

After pushing the tag:

1. **GitHub Actions** - [Check workflow runs](../../actions) - release should be running
2. **GitHub Releases** - [Check releases](../../releases) - new release should appear
3. **npm** - `npm view @teamflojo/floimg version` should show new version

## Troubleshooting

### Release workflow didn't run

- Check you used `v*` format (e.g., `v0.6.1`), not `@teamflojo/pkg@X.Y.Z`
- Check the tag was pushed: `git tag -l` and `git ls-remote --tags origin`

### npm shows old version

- Wait a few minutes for npm registry propagation
- Check workflow logs for publish errors

### GitHub Release missing

- Verify `v*` tag exists on remote
- Check workflow logs for the `create-release` job

## Related

- [[Contributing]] - Development workflow
- [[../../CLAUDE]] - Claude Code release instructions
