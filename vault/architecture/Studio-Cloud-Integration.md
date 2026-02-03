# Cloud Integration

FloImg Studio (`apps/studio/`) is a **pure open-source, self-hostable** workflow builder. It contains no cloud-specific code, authentication, or usage limits.

## Architecture Principle

**FloImg Studio = pure open-source**
**floimg-cloud = commercial extension layer (powers FloImg Studio Cloud)**

This follows the Supabase model where the open-source project is fully functional standalone, and cloud features are added by a separate commercial layer.

## What FloImg Studio Provides

| Feature                | Included | Notes                     |
| ---------------------- | -------- | ------------------------- |
| Visual workflow editor | Yes      | Full React Flow canvas    |
| Node palette           | Yes      | All registered generators |
| Workflow persistence   | Yes      | localStorage (local only) |
| Code export            | Yes      | YAML and JavaScript       |
| AI nodes               | Yes      | User provides API keys    |
| Image download         | Yes      | Direct to filesystem      |
| Content moderation     | Optional | Configurable via env      |

## What FloImg Studio Does NOT Include

| Feature             | Where It Lives | Why                            |
| ------------------- | -------------- | ------------------------------ |
| User authentication | floimg-cloud   | Commercial feature             |
| Usage limits        | floimg-cloud   | Commercial feature             |
| Cloud storage       | floimg-cloud   | Commercial feature             |
| Analytics           | floimg-cloud   | Privacy by default             |
| TOS consent         | floimg-cloud   | Only needed for hosted service |
| Marketing copy      | floimg-cloud   | Not relevant to self-hosted    |

## Self-Hosted Deployment

FloImg Studio is designed for self-hosting. It lives in the floimg monorepo:

```bash
# Clone and run
git clone https://github.com/FlojoInc/floimg
cd floimg
pnpm install
pnpm dev:studio   # Starts frontend (5173) + backend (5100)
```

### Optional Configuration

```env
# AI providers (user provides their own keys)
OPENAI_API_KEY=sk-xxx
ANTHROPIC_API_KEY=sk-xxx

# Optional content moderation
MODERATION_ENABLED=true
MODERATION_THRESHOLD=0.7
```

## How FloImg Studio Cloud Works

The cloud-hosted version at `studio.floimg.com` (FloImg Studio Cloud) is powered by `floimg-cloud`, which:

1. Imports `@floimg-studio/*` packages as dependencies
2. Wraps the editor with cloud-specific features
3. Provides cloud-specific adapters via dependency injection
4. Deploys the extended version

```
floimg-cloud/packages/studio-cloud/
├── src/
│   ├── CloudEditorLayout.tsx     # Wraps WorkflowEditor with providers
│   ├── adapters/
│   │   └── CloudStorageAdapter.ts # S3 presigned URL storage
│   ├── providers/
│   │   └── UsageLimitsProvider.tsx
│   └── components/
│       └── CloudToolbar.tsx      # Extended toolbar with user menu
└── package.json                  # depends on @teamflojo/floimg-studio-ui
```

## Extension Points

FloImg Studio provides extension points for cloud/custom deployments:

### StorageAdapter (Input Node Uploads)

Different deployments can inject their own storage backends:

```tsx
// OSS: uses local filesystem via /api/uploads
import { StorageAdapterProvider, ossStorageAdapter } from "@teamflojo/floimg-studio-ui";

<StorageAdapterProvider adapter={ossStorageAdapter}>
  <App />
</StorageAdapterProvider>;

// Cloud: uses S3 via presigned URLs
import { cloudStorageAdapter } from "./adapters/CloudStorageAdapter";

<StorageAdapterProvider adapter={cloudStorageAdapter}>
  <App />
</StorageAdapterProvider>;
```

### Toolbar Slots

Inject custom branding, buttons, and user menus:

```tsx
<Toolbar
  brandingSlot={<CloudBadge />}
  beforeActionsSlot={<WorkspaceButton />}
  afterActionsSlot={<UserMenu />}
  hideAttribution
  hideWorkflowLibrary
/>
```

### UsageLimitsProvider (Cloud-only)

Cloud deployments can inject tier-based limits that components respect.

## For Contributors

When contributing to FloImg Studio (`apps/studio/`):

- **DO NOT** add authentication code
- **DO NOT** add usage limits or tier checks
- **DO NOT** hardcode floimg.com URLs
- **DO NOT** add analytics tracking
- **DO NOT** add marketing copy or upgrade prompts

If a feature requires cloud infrastructure, it belongs in `floimg-cloud`, not here.

## Related

- [Technical Architecture](./Technical-Architecture.md)
- [Development Tooling](./Development-Tooling.md)
