---
argument-hint: [request]
description: Escape hatch - bypass PM workflow for quick tasks
---

# Escape Hatch

Skip the task management workflow for quick analysis, exploration, or small fixes.

Check `<command-args>` for what the user wants to do.

## When to Use

- Quick code exploration or questions
- One-line fixes or typos
- Research without creating a task
- Experimentation and prototyping

## When NOT to Use

- Multi-file changes (use /p)
- Features that need tracking (use /p)
- Work that might take multiple sessions (use /p)
- Bug fixes that need documentation (use /p)

## Behavior

When /x is invoked:

1. Skip task creation requirement
2. Skip status updates
3. Proceed directly with the request
4. No commits to vault/pm/

## Output

```
Bypass mode: Proceeding without task tracking.

{Proceed with user's request}
```

## Important Rules

- **This is an escape hatch** - not the default workflow
- **Use sparingly** - most work benefits from tracking
- **No commits to PM folders** - keep them clean
- **If work grows** - stop and use /p to create proper task
