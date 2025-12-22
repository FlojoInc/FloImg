---
description: Close the current task
---

# Close Task

Close the currently active task after validating completion.

## Steps

1. **Identify current task**:
   - Read PROJECT_STATUS.md "Current Focus" section
   - Or check git branch for task ID
   - If no active task, abort: "No active task. Use /st to check status."

2. **Read task file** and verify acceptance criteria:
   - All criteria should be met
   - If not met, warn user and ask to continue

3. **Check for open subtasks** (if parent task):
   - Check `children` array in frontmatter
   - If any children not completed, warn:
     > "Open subtasks: T-2025-001.1, T-2025-001.2. Close these first?"

4. **Validate implementation**:
   - Run type check: `pnpm -r typecheck`
   - Run tests: `pnpm -r test`
   - If failures, warn user

5. **Update task file**:
   - Change status to `completed`
   - Fill in "Completed" date
   - Update acceptance criteria checkboxes
   - Update `updated` date

6. **Update context doc**:
   - Add completion notes
   - Document any deferred work

7. **Update PROJECT_STATUS.md**:
   - Move task from "Current Focus" to "Recent Progress"
   - Update "Last Updated" timestamp

8. **Check for linked GitHub Issue**:
   - If `github_issue` field exists, remind to close it:
     > "Linked GitHub Issue: #{number}. Close it with: gh issue close {number}"

9. **Commit completion**:

   ```bash
   git add vault/pm/ PROJECT_STATUS.md
   git commit -m "chore: complete {ID}

   {Title}

   Acceptance criteria met."
   ```

10. **Ask about PR**:

    > "Create pull request? (yes/no)"

    If yes:

    ```bash
    gh pr create --title "{Type}: {Title}" --body "## Summary

    {Description}

    ## Changes

    - {List of changes}

    ## Testing

    - [ ] Type check passes
    - [ ] Tests pass

    Closes #{github_issue if exists}
    "
    ```

11. **Output summary**:

    ```
    Completed {ID}: {Title}

    Status: completed
    PR: {PR URL if created}

    Next steps:
    - Review and merge PR
    - Close GitHub Issue (if linked): gh issue close {number}
    - Use /st to see next tasks
    ```

## Important Rules

- **Validate acceptance criteria** before closing
- **Check subtasks** are all complete
- **Run tests** to verify nothing is broken
- **Update all tracking locations** (task, context, PROJECT_STATUS)
- **Remind about GitHub Issue** if linked
- **Offer PR creation** for easy merging
