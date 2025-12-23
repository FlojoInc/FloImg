---
tags: [type/task]
status: in-progress
priority: p1
created: 2025-12-22
updated: 2025-12-22
parent:
children: []
---

# Task: Remove Cloud Business Logic from Public Repo

## Task Details

**Task ID**: T-2025-002
**Status**: in-progress
**Priority**: p1
**Created**: 2025-12-22
**Completed**:

## Description

Cloud business logic has leaked into the public floimg-studio repository. This violates the product vision where floimg-studio should be pure open-source and self-hostable, following the Supabase model.

Cloud-specific code to remove:

- Guest limits (5/day) hardcoded in authStore
- studio.floimg.com hostnames hardcoded in TOSConsent
- Auth endpoints and flows visible in public repo
- Marketing copy ("50 free generations") baked into components
- FLOIMG_CLOUD detection in moderator

## Acceptance Criteria

- [ ] Frontend has no cloud auth logic (authStore removed)
- [ ] Frontend has no guest usage limits (useGuestUsage removed)
- [ ] Frontend has no TOS consent (TOSConsent removed)
- [ ] Frontend has no auth modal (AuthModal removed)
- [ ] Toolbar has no cloud-specific user menu
- [ ] Backend moderator has no FLOIMG_CLOUD detection
- [ ] App compiles and runs in self-hosted mode
- [ ] No floimg.com hardcoded references remain

## Implementation Details

### Technical Approach

1. Remove cloud imports from App.tsx
2. Remove cloud hooks and effects from App component
3. Remove cloud components (TOSConsent, AuthModal) from JSX
4. Delete cloud-specific files (authStore, useGuestUsage, TOSConsent, AuthModal)
5. Simplify Toolbar (remove cloud user menu section)
6. Simplify backend moderator (remove cloud detection)

### Packages Affected

- [x] frontend
- [ ] backend
- [ ] shared

### Testing Required

- Manual test: app loads without cloud code
- Build passes with no TypeScript errors

## Dependencies

### Blocked By

- None

### Related Tasks

- T-2025-001 (workflow persistence - completed)
- Follow-up: Create studio-cloud package in floimg-cloud repo

## Subtasks

## Progress Notes

### Work Log

- **2025-12-22**: Started removing cloud code from App.tsx

## Review Checklist

- [ ] Code review completed
- [ ] TypeScript types correct
- [ ] Frontend tested manually
- [ ] Backend API tested
- [ ] Documentation updated

## Notes

- This is Phase 1 of the architecture cleanup plan
- Cloud features will be re-implemented in floimg-cloud repo
- Follow Supabase model: pure open-source + commercial cloud layer
