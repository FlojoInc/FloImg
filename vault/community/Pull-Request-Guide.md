# Pull Request Guide

This guide covers best practices for submitting pull requests to floimg.

## Before You Start

1. **Check for existing PRs** - Someone may already be working on it
2. **Open an issue first** for significant changes - Get feedback on approach
3. **Keep PRs focused** - One feature or fix per PR

## Branch Naming

Use descriptive branch names with type prefix:

```
feat/add-webp-generation
fix/pipeline-memory-leak
docs/improve-quickstart
refactor/simplify-transform-api
chore/update-vitest
```

| Prefix      | Use for                                 |
| ----------- | --------------------------------------- |
| `feat/`     | New features                            |
| `fix/`      | Bug fixes                               |
| `docs/`     | Documentation only                      |
| `refactor/` | Code restructuring (no behavior change) |
| `chore/`    | Maintenance, dependencies, tooling      |
| `test/`     | Test additions or fixes                 |

## Commit Messages

Write clear, descriptive commit messages:

```
feat: add WebP output support for all generators

- Add WebP to supported output formats
- Update sharp provider with WebP encoding
- Add tests for WebP conversion

Closes #123
```

Guidelines:

- Start with type: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, `test:`
- Use imperative mood ("add" not "added")
- First line under 72 characters
- Add blank line before detailed description
- Reference issues with `Closes #123` or `Fixes #123`

## PR Description

Use this template:

```markdown
## Summary

Brief description of what this PR does.

## Changes

- List of specific changes
- Another change
- And another

## Testing

How you tested these changes:

- [ ] Added unit tests
- [ ] Ran existing tests
- [ ] Manual testing steps

## Screenshots (if applicable)

Before/after screenshots for UI changes.

## Related Issues

Closes #123
```

## Code Quality Checklist

Before submitting:

- [ ] **Tests pass**: `pnpm -r test`
- [ ] **Types check**: `pnpm -r typecheck`
- [ ] **Build succeeds**: `pnpm -r build`
- [ ] **No console.log**: Remove debugging statements
- [ ] **Documentation updated**: If API changed
- [ ] **CHANGELOG updated**: For significant changes

## Size Guidelines

### Ideal PR Size

- **Small** (preferred): < 200 lines changed
- **Medium**: 200-500 lines
- **Large**: 500+ lines (consider splitting)

Large PRs are harder to review and more likely to have issues.

### Splitting Large Changes

If your change is large:

1. **Infrastructure first**: Types, interfaces, utilities
2. **Core implementation**: Main logic
3. **Integration**: Wiring things together
4. **Tests and docs**: Coverage and documentation

## Review Process

### What Reviewers Look For

1. **Correctness** - Does it work as intended?
2. **Tests** - Is it adequately tested?
3. **Code quality** - Is it readable and maintainable?
4. **Documentation** - Are changes documented?
5. **Breaking changes** - Are they necessary and documented?

### Responding to Feedback

- Address all comments before re-requesting review
- Explain your reasoning if you disagree
- Mark conversations resolved when addressed
- Push new commits rather than force-pushing (preserves review context)

### Getting Reviews

- PRs are typically reviewed within a few days
- Tag maintainers if urgent
- Smaller PRs get reviewed faster

## Merge Requirements

PRs must:

1. Pass all CI checks (tests, types, build)
2. Have at least one approval
3. Have no unresolved conversations
4. Be up to date with main branch

## After Merge

- Delete your branch
- Update related issues
- Consider writing a blog post for significant features

## Special Cases

### Breaking Changes

Breaking changes require:

1. Discussion in an issue first
2. Clear documentation of what breaks
3. Migration guide if applicable
4. Major version bump consideration

### Security Fixes

For security issues:

1. Report privately first (see [[Security]])
2. Work with maintainers on fix
3. Coordinate disclosure timing

### Documentation Only

For docs-only PRs:

- Can be smaller and faster to review
- Still need to pass CI
- Check that links work

## Common Mistakes

### Avoid

- Mixing unrelated changes in one PR
- Large formatting changes with logic changes
- Skipping tests for "simple" changes
- Not updating documentation

### Do

- Keep PRs focused on one thing
- Add tests for new code
- Update docs when behavior changes
- Respond to review feedback promptly

## See Also

- [[Contributing]] - General contribution guide
- [[Development-Setup]] - Environment setup
- [[Issue-Guidelines]] - Creating good issues
- [[../architecture/Testing-Strategy]] - Testing guidelines
