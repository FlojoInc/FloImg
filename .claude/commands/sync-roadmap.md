---
description: Sync vault/Roadmap.md with current version and CHANGELOG
---

# Sync Roadmap

Regenerate `vault/Roadmap.md` from source data, keeping it in sync with releases.

## Data Sources (OSS-Safe Only)

| Section   | Source                            | Notes                                   |
| --------- | --------------------------------- | --------------------------------------- |
| Version   | `packages/floimg/package.json`    | Current published version               |
| Now       | `CHANGELOG.md`                    | Latest release section only             |
| Next      | Manual or local vault tasks       | Describe in plain language, no task IDs |
| Later     | Preserved from current Roadmap.md | Manually curated directional ideas      |
| Non-Goals | Preserved from current Roadmap.md | Manually curated                        |

## OSS Filtering Rules

**NEVER include in the public roadmap:**

- Task IDs (T-2025-xxx, EPIC-xxx, BUG-xxx)
- References to floimg-hq (umbrella repo)
- References to floimg-cloud (proprietary)
- ADR references (ADR-xxx)
- Internal pricing/monetization details
- Cloud-specific features or tier gating

**DO include:**

- Public-facing feature descriptions
- Technology choices visible in the codebase
- Community-relevant improvements
- Links to public docs (README, CHANGELOG, GitHub)

## Steps

1. **Read version** from `packages/floimg/package.json`

2. **Parse CHANGELOG.md** - extract the latest `## [x.x.x]` section:
   - Pull headline features (skip internal implementation details)
   - Skip any lines with task IDs or internal references

3. **Read current Roadmap.md** - preserve:
   - "Later" section content
   - "Non-Goals" section content

4. **Generate updated Roadmap.md** using template:

```markdown
# Roadmap

Current version: **v{VERSION}**

## Now (v{VERSION})

Latest release highlights:

{CHANGELOG_HIGHLIGHTS}

See [CHANGELOG](../CHANGELOG.md) for full details.

## Next

Work in progress or committed for upcoming releases:

{NEXT_ITEMS}

## Later

{PRESERVED_LATER}

## Non-Goals

{PRESERVED_NON_GOALS}
```

5. **Show diff** before writing
6. **Write file** only after user confirms

## When to Run

- After publishing a new version to npm
- When preparing a release
- When you notice version drift (validation hook will warn)

## Related

- Run validation hook: `.claude/hooks/validate-roadmap.sh`
- Full changelog: `CHANGELOG.md`
