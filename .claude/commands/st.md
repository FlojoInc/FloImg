---
description: Quick status check (~500 tokens)
---

# Quick Status

Fast, lightweight status check. Only reads PROJECT_STATUS.md.

## Steps

1. **Read PROJECT_STATUS.md**
2. **Output key sections**:

```markdown
## Status

**Current Focus**: {task} - {status}

**Recent Progress**:

- {item 1}
- {item 2}

**Next Up**:

1. {priority item}
2. {next item}

**Blockers**: {any blockers or "None"}
```

## Important Rules

- **Only read PROJECT_STATUS.md** - no other files
- **Keep output under 500 tokens**
- **Don't scan vault** - this is meant to be fast
- Use /p to plan new work
- Use /s {ID} to start a task
