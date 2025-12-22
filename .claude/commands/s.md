---
argument-hint: [TASK-ID]
description: Start working on a task
---

# Start Task

The user wants to start working on a task. Check `<command-args>` for the task ID.

If no task ID provided, check PROJECT_STATUS.md for the next task in "Next Up".

## Steps

1. **Validate task exists**:

   ```bash
   # Check tasks folder
   ls vault/pm/tasks/ | grep "{TASK-ID}"
   # Or bugs folder
   ls vault/pm/bugs/ | grep "{TASK-ID}"
   ```

   - If not found, abort with: "Task {ID} not found. Use /p to create it."

2. **Read task file** to understand the work:
   - Get description, acceptance criteria
   - Check for dependencies (blocked by)

3. **Check if subtask**:
   - If ID contains dots (e.g., T-2025-001.1), it's a subtask
   - Subtasks use parent's branch - skip branch creation

4. **Create feature branch** (root tasks only):

   ```bash
   # Determine branch prefix based on type
   # Task: feat/
   # Bug: fix/
   git checkout -b {prefix}/{ID}-{slug}
   ```

5. **Update task status**:
   - Change status to `in-progress` in frontmatter
   - Update `updated` date

6. **Update PROJECT_STATUS.md**:
   - Move task to "Current Focus" section
   - Mark as IN PROGRESS
   - Update "Last Updated" timestamp

7. **Update context doc** (if exists):
   - Change Status from "Planning" to "In Progress"
   - Add session start note

8. **Commit status changes**:

   ```bash
   git add vault/pm/ PROJECT_STATUS.md
   git commit -m "chore: start {ID}

   Begin work on: {Title}"
   ```

9. **Output summary**:

   ```
   Started {ID}: {Title}

   Branch: {prefix}/{ID}-{slug}
   Status: in-progress

   Task file: vault/pm/{folder}/{ID}-{slug}.md
   Context: vault/pm/_context/{ID}-context.md

   Acceptance Criteria:
   - [ ] Criterion 1
   - [ ] Criterion 2
   ...

   Ready to implement. Use /ctx to record decisions.
   ```

## Important Rules

- **Always update status** in both task file and PROJECT_STATUS.md
- **Create branch** for root tasks (not subtasks)
- **Commit status changes** before starting work
- **Show acceptance criteria** so goals are clear
- **Subtasks work on parent's branch** - no new branch needed
