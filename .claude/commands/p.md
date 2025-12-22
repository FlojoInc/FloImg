---
argument-hint: [work description]
description: Plan a new work item (Task/Bug)
---

# Plan Work Item

The user called this command. Check the conversation context for `<command-args>` tag to see what they want to work on.

If the arguments are empty or this looks like a question (not a work request), abort and respond normally.

Otherwise, use the arguments as the work description and proceed with planning.

---

## Classification (First Step)

**Classify the work item:**

1. **Bug?** Only if:
   - Fixing existing broken behavior
   - NOT adding new features
   - NOT refactoring or improvements

2. **Task?** (Default)
   - Feature implementation
   - Technical improvements
   - Plugin development
   - Documentation updates
   - Refactoring
   - **When in doubt, choose Task**

## Steps

1. **Classify work item type** (Task or Bug):
   - Analyze user's description
   - Default to Task when uncertain

2. **Generate next ID**:

   ```bash
   # For Task (exclude subtasks with dots)
   ls vault/pm/tasks/ 2>/dev/null | grep -oP 'T-2025-\d{3}(?!\.)' | sort -u | tail -1
   # For Bug
   ls vault/pm/bugs/ 2>/dev/null | grep -oP 'BUG-2025-\d{3}' | sort -u | tail -1
   ```

   - Increment by 1 for new ID
   - If no existing IDs, start at 001

3. **Check for parent task context** (subtask support):
   - Check current git branch: `git branch --show-current`
   - If on a task branch (e.g., `feat/T-2025-001-*`), extract parent task ID
   - If parent context exists, ask:
     > "Create as subtask of T-2025-001? (yes/no)"
   - If yes → generate subtask ID: `T-2025-001.1`, `T-2025-001.2`, etc.

4. **Create work item file**:
   - Task: `vault/pm/tasks/{ID}-{slug}.md`
   - Bug: `vault/pm/bugs/{ID}-{slug}.md`

   Use template from `vault/_templates/Task.md` or `vault/_templates/Bug.md`:
   - Fill frontmatter (tags, status=backlog, priority, created date)
   - Add description from user input
   - Generate 3-5 acceptance criteria

5. **Create context doc** (for root tasks):
   - Location: `vault/pm/_context/{ID}-context.md`
   - Use template from `vault/_templates/Context.md`
   - Subtasks: append to parent's context doc instead

6. **Sync PROJECT_STATUS.md**:
   - Add to "Next Up" section if user intends to work on it soon
   - Update "Last Updated" timestamp

7. **Ask about GitHub Issue** (OSS visibility):

   > "Create GitHub Issue for public visibility? (yes/no)"
   - If yes, note to use `/gh create {ID}` after creation

8. **Commit work item creation**:

   ```bash
   git add vault/pm/ PROJECT_STATUS.md
   git commit -m "chore: create {type} {ID}

   {Title}"
   ```

9. **Output summary**:

   ```
   Created {Type} {ID}-{slug}

   Files:
   - vault/pm/{folder}/{ID}-{slug}.md
   - vault/pm/_context/{ID}-context.md

   Next: /s {ID} to start work
   Optional: /gh create {ID} for GitHub Issue
   ```

## Important Rules

- **Always create both work item file AND context doc** (for root tasks)
- **Use correct folder** (tasks/ or bugs/)
- **Generate acceptance criteria** (3-5 items)
- **Commit immediately** after creation
- **Suggest /s** to start work

## Subtask Rules

- Subtask IDs use dot notation: `T-2025-001.1`, `T-2025-001.2`
- Subtasks share parent's context doc (append with headers)
- Update parent's `children` array when creating subtask
- Subtasks go in same folder as root tasks (vault/pm/tasks/)
