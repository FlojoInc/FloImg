---
argument-hint: [note]
description: Update context doc with a note
---

# Update Context

Quickly add a note to the current task's context document.

Check `<command-args>` for the note content.

## Steps

1. **Identify current task**:
   - Read PROJECT_STATUS.md "Current Focus"
   - Or check git branch for task ID

2. **Find context doc**:
   - Root task: `vault/pm/_context/{ID}-context.md`
   - Subtask: `vault/pm/_context/{PARENT-ID}-context.md`

3. **Determine note category** from content:
   - Contains "decided" or "decision" → **Key Decisions**
   - Contains "question" or "unclear" → **Open Questions**
   - Contains "problem" or "issue" or "challenge" → **Challenges Encountered**
   - Default → **Session Notes** (at bottom)

4. **Append note** to appropriate section:
   - Add timestamp prefix
   - Format cleanly

5. **Commit update**:

   ```bash
   git add vault/pm/_context/
   git commit -m "docs: update context for {ID}

   {Brief summary of note}"
   ```

6. **Confirm**:

   ```
   Updated context for {ID}

   Added to: {Section}
   Note: {First 50 chars}...
   ```

## Example Usage

```
/ctx Decided to use Sharp for image processing instead of Canvas
→ Added to "Key Decisions"

/ctx Question: should we support animated GIFs?
→ Added to "Open Questions"

/ctx Fixed issue with memory leak in buffer handling
→ Added to "Session Notes"
```

## Note Format

```markdown
## Key Decisions

- **2025-12-08**: Decided to use Sharp for image processing instead of Canvas - better performance and smaller bundle size
```

## Important Rules

- **Keep notes concise** but informative
- **Include the "why"** not just the "what"
- **Commit after each update** for history
- **Use appropriate section** based on content type
