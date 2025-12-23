# Context: T-2025-002 Remove Cloud Code

**Task**: [[T-2025-002-remove-cloud-code]]
**Created**: 2025-12-22
**Status**: In Progress

## Overview

Cloud business logic has leaked into the public floimg-studio repo, violating the product vision. The goal is to make floimg-studio pure open-source and self-hostable, following the Supabase model.

## Files to Delete

| File                                              | Reason                                  |
| ------------------------------------------------- | --------------------------------------- |
| `packages/frontend/src/stores/authStore.ts`       | Cloud auth, guest limits, API endpoints |
| `packages/frontend/src/hooks/useGuestUsage.ts`    | Guest limit logic (cloud-only)          |
| `packages/frontend/src/components/TOSConsent.tsx` | TOS with hardcoded cloud hostnames      |
| `packages/frontend/src/components/AuthModal.tsx`  | Marketing copy for cloud tiers          |

## Files to Modify

| File                                           | Changes                                 |
| ---------------------------------------------- | --------------------------------------- |
| `packages/frontend/src/App.tsx`                | Remove cloud imports, hooks, components |
| `packages/frontend/src/components/Toolbar.tsx` | Remove cloud user menu section          |
| `packages/backend/src/moderation/moderator.ts` | Remove FLOIMG_CLOUD detection           |

## Target Architecture (Supabase Model)

```
floimg-studio (PUBLIC) - Pure Open-Source
├── Frontend - no auth, no limits, no analytics
├── Backend - basic moderation (optional)
├── Configurable via environment
├── No floimg.com references
└── Self-hostable out of the box

floimg-cloud (PRIVATE) - Commercial Layer
├── Wraps floimg-studio backend
├── Adds: Auth, billing, usage limits
├── Adds: Umami analytics
├── Adds: Strict moderation policies
└── Deployed to studio.floimg.com
```

## Key Decisions

- Use npm dependency model (floimg-cloud imports @floimg-studio/\*)
- No feature flags for cloud vs self-hosted in open-source
- All cloud features implemented in floimg-cloud repo

## Progress

- [x] Created task and context docs
- [ ] Remove cloud code from App.tsx
- [ ] Delete cloud-specific files
- [ ] Update Toolbar
- [ ] Update backend moderator
- [ ] Test self-hosted mode
