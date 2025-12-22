---
description: End-of-session wrap (saves context)
---

# Wrap Session

Save important context before ending a session or before memory compaction.

## Steps

1. **Identify current task** (if any):
   - Read PROJECT_STATUS.md "Current Focus"

2. **Summarize session work**:
   - What was accomplished
   - Key decisions made
   - Open questions remaining
   - Next steps

3. **Update context doc** (if active task):
   - Add session summary to "Session Notes"
   - Update "Next Steps" section
   - Mark any resolved questions

4. **Update task file** (if progress made):
   - Update "Progress Notes" section
   - Check off completed acceptance criteria

5. **Update PROJECT_STATUS.md**:
   - Ensure "Current Focus" reflects actual state
   - Add any completed items to "Recent Progress"

6. **Commit updates**:

   ```bash
   git add vault/pm/ PROJECT_STATUS.md
   git commit -m "docs: wrap session for {ID}

   Session summary: {brief description}"
   ```

7. **Output summary**:

   ```
   ## Session Wrap

   **Task**: {ID} - {Title}
   **Status**: {status}

   ### Accomplished
   - {item 1}
   - {item 2}

   ### Key Decisions
   - {decision 1}

   ### Open Questions
   - {question 1}

   ### Next Steps
   1. {next action}
   2. {following action}

   Context saved. Safe to end session or continue later.
   ```

## When to Use

- Before ending a work session
- Before context compaction (memory limit)
- When switching to different work
- Before taking a break

## Important Rules

- **Capture decisions** so they're not lost
- **Note open questions** for next session
- **Update next steps** for continuity
- **Commit changes** to preserve in git
