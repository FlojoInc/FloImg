---
argument-hint: [action] [args]
description: GitHub Issues integration (link, create, sync, import)
---

# GitHub Issues Integration

Manage the connection between vault tasks and GitHub Issues.

Check `<command-args>` for the action and arguments.

## Actions

### `/gh link T-YYYY-NNN #123`

Link a vault task to an existing GitHub Issue.

1. Read task file
2. Add `github_issue: 123` to frontmatter
3. Add comment to GitHub Issue:
   ```bash
   gh issue comment 123 --body "Tracked internally as {ID}. Work in progress."
   ```
4. Commit update

### `/gh create T-YYYY-NNN`

Create a GitHub Issue from a vault task.

1. Read task file
2. Generate issue title and body:

   ```bash
   gh issue create \
     --title "{Title}" \
     --body "## Description

   {Description from task}

   ## Acceptance Criteria

   {Criteria from task}

   ---
   Internal tracking: {ID}"
   ```

3. Capture issue number from output
4. Update task frontmatter with `github_issue: {number}`
5. Commit update

### `/gh sync`

Sync status between vault tasks and linked GitHub Issues.

1. Find all tasks with `github_issue` field:
   ```bash
   grep -r "github_issue:" vault/pm/tasks/ vault/pm/bugs/
   ```
2. For each linked task:
   - Compare vault status to GitHub Issue state
   - Report mismatches
3. Output:

   ```
   ## GitHub Sync Report

   **In Sync**: 5 tasks
   **Mismatched**:
   - T-2025-001 (completed) ↔ #12 (open) - Close issue?
   - T-2025-003 (in-progress) ↔ #15 (closed) - Reopen issue?
   ```

4. Offer to fix mismatches

### `/gh import #123`

Create a vault task from a GitHub Issue.

1. Read GitHub Issue:
   ```bash
   gh issue view 123 --json title,body,labels
   ```
2. Determine type (Task or Bug) from labels
3. Generate next ID
4. Create vault task file with `github_issue: 123`
5. Create context doc
6. Add comment to issue:
   ```bash
   gh issue comment 123 --body "Imported to internal tracking as {ID}."
   ```
7. Output:

   ```
   Imported GitHub Issue #123 as {ID}

   Files:
   - vault/pm/{folder}/{ID}-{slug}.md
   - vault/pm/_context/{ID}-context.md

   Next: /s {ID} to start work
   ```

## Usage Examples

```
# Link existing task to issue
/gh link T-2025-001 #42

# Create issue for task
/gh create T-2025-002

# Check sync status
/gh sync

# Import community-filed issue
/gh import #55
```

## Important Rules

- **Vault is source of truth** - GitHub Issues are public interface
- **Always link** when working on community issues
- **Sync regularly** to keep public status accurate
- **Import first** before working on external issues
