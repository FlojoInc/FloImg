# Technical Architecture

floimg-studio system architecture.

## Overview

floimg-studio is a visual workflow builder that provides a drag-and-drop interface for creating floimg workflows.

```
┌─────────────────────────────────────────┐
│           Frontend (React 19)           │
│  ┌─────────────────────────────────┐   │
│  │     React Flow Canvas           │   │
│  │   (Visual Node Editor)          │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────┐ ┌─────────────────┐   │
│  │ Node Palette│ │ Node Inspector  │   │
│  └─────────────┘ └─────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │   Zustand State + TanStack Query │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    │
                    │ HTTP / WebSocket
                    ▼
┌─────────────────────────────────────────┐
│           Backend (Fastify 5)           │
│  ┌─────────────────────────────────┐   │
│  │         API Routes              │   │
│  │  /api/nodes, /api/execute, etc. │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │       floimg Integration        │   │
│  │  (Registry, Executor)           │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │       Storage Layer             │   │
│  │  (Generated/Uploaded Images)    │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│              floimg Core                │
│    (Image Generation & Transforms)      │
└─────────────────────────────────────────┘
```

## Package Structure

### @floimg-studio/frontend

- **Framework**: React 19 + Vite
- **Visual Editor**: React Flow for node-based editing
- **State**: Zustand for local state, TanStack Query for server state
- **Styling**: Tailwind CSS

### @floimg-studio/backend

- **Framework**: Fastify 5
- **Plugins**: CORS, Multipart uploads, WebSocket
- **Integration**: floimg for workflow execution

### @floimg-studio/shared

- TypeScript type definitions shared between packages

## Data Flow

### Workflow Creation

1. User drags nodes from palette onto canvas
2. React Flow manages node/edge state
3. Zustand store persists workflow locally
4. Optional: Save to backend for persistence

### Workflow Execution

1. Frontend sends workflow to `/api/execute`
2. Backend converts visual workflow to floimg format
3. floimg executes the workflow
4. Results returned to frontend
5. Generated images stored and displayed

## API Endpoints

| Endpoint                | Method | Description               |
| ----------------------- | ------ | ------------------------- |
| `/api/nodes/generators` | GET    | List available generators |
| `/api/nodes/transforms` | GET    | List available transforms |
| `/api/execute`          | POST   | Execute a workflow        |
| `/api/images/*`         | GET    | Retrieve generated images |
| `/api/uploads`          | CRUD   | Manage uploaded images    |

## State Management

### Frontend State (Zustand)

- `nodes` - React Flow nodes
- `edges` - React Flow edges
- `selectedNode` - Currently selected node
- `executionStatus` - Workflow execution state

### Server State (TanStack Query)

- Node definitions (generators, transforms)
- Uploaded images
- Execution results

## floimg Integration

### Capability Auto-Discovery

floimg-studio uses floimg's `getCapabilities()` API to auto-discover available generators and transforms. This ensures the visual editor always reflects what the execution engine supports.

```
┌─────────────────────────────────────────┐
│           Backend Startup               │
├─────────────────────────────────────────┤
│ 1. initializeClient() called            │
│    - Creates floimg client              │
│    - Registers generator plugins        │
│    - Caches capabilities                │
│                                         │
│ 2. getCapabilities() returns:           │
│    - generators[] with schemas          │
│    - transforms[] with schemas          │
│    - saveProviders[]                    │
│                                         │
│ 3. Registry converts schemas            │
│    - floimg schemas → NodeDefinitions   │
│    - Served via /api/nodes/*            │
└─────────────────────────────────────────┘
```

### Plugin Registration

Generators are registered in `src/floimg/setup.ts`:

```typescript
import { createClient } from "floimg";
import qr from "floimg-qr";
import mermaid from "floimg-mermaid";
import quickchart from "floimg-quickchart";

const client = createClient({...});
client.registerGenerator(qr());
client.registerGenerator(mermaid());
client.registerGenerator(quickchart());
```

### Schema Mapping

floimg schemas are converted to studio NodeDefinitions:

| floimg Type                | Studio Type                          |
| -------------------------- | ------------------------------------ |
| `GeneratorSchema`          | `NodeDefinition` (type: "generator") |
| `TransformOperationSchema` | `NodeDefinition` (type: "transform") |
| `ParameterSchema`          | `ParamField`                         |

### Dependencies

floimg packages are installed from npm:

```json
{
  "dependencies": {
    "floimg": "^0.5.0",
    "floimg-qr": "^0.2.0",
    "floimg-mermaid": "^0.2.0",
    "floimg-quickchart": "^0.2.0"
  }
}
```

For local development with unpublished floimg changes, add `"../floimg/packages/*"` to `pnpm-workspace.yaml` and use `workspace:*` protocol.

### Key Files

| File                     | Purpose                                       |
| ------------------------ | --------------------------------------------- |
| `src/floimg/setup.ts`    | Client initialization and plugin registration |
| `src/floimg/registry.ts` | Schema conversion and capability exposure     |
| `src/floimg/executor.ts` | Workflow execution using shared client        |

## Content Moderation

floimg-studio includes content moderation to prevent harmful content from being generated or stored.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              SCAN BEFORE SAVE - Content Moderation              │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Image in memory (buffer, not saved yet)                         │
│           │                                                       │
│           ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  OpenAI Moderation API (FREE)                                │ │
│  │  - Checks: hate, violence, sexual, self-harm, harassment    │ │
│  │  - Returns: flagged (true/false) + categories + scores      │ │
│  └─────────────────────────────────────────────────────────────┘ │
│           │                                                       │
│           ▼                                                       │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  DECISION (before any disk write)                            │ │
│  │  ✅ PASS: Write to disk, show in gallery                    │ │
│  │  ❌ FLAGGED: Discard buffer, return error, log incident     │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration

| Environment Variable     | Default          | Description                         |
| ------------------------ | ---------------- | ----------------------------------- |
| `OPENAI_API_KEY`         | (required)       | API key for OpenAI Moderation       |
| `MODERATION_STRICT_MODE` | `true` for cloud | Block on moderation service failure |
| `FLOIMG_CLOUD`           | `false`          | Enable cloud deployment mode        |

### Strict Mode Behavior

| Scenario                 | Strict Mode ON      | Strict Mode OFF    |
| ------------------------ | ------------------- | ------------------ |
| Moderation API available | Normal scanning     | Normal scanning    |
| Moderation API fails     | Block content (503) | Allow with warning |
| Content flagged          | Always blocked      | Always blocked     |

### Incident Logging

All moderation events are logged to `data/moderation/incidents.jsonl`:

- Flagged content (rejected)
- Moderation service errors
- Context (nodeId, uploadId, etc.)

### Key Files

| File                          | Purpose                           |
| ----------------------------- | --------------------------------- |
| `src/moderation/moderator.ts` | OpenAI Moderation API integration |
| `src/moderation/index.ts`     | Exports and initialization        |

## Template System

floimg-studio includes bundled workflow templates that work offline for self-hosted users.

### Template Structure

```
packages/frontend/src/templates/
├── index.ts              # Template registry and exports
├── sales-dashboard.ts    # Chart template
├── user-growth.ts        # Chart template
├── api-flow.ts           # Mermaid diagram
├── system-architecture.ts
├── git-workflow.ts
├── website-qr.ts
├── wifi-qr.ts
├── chart-watermark.ts    # Pipeline template
└── diagram-webp.ts       # Pipeline template
```

### Template Schema

```typescript
interface GalleryTemplate {
  id: string; // "sales-dashboard"
  name: string; // "Sales Dashboard"
  description: string; // "Quarterly revenue bar chart"
  category: string; // "Charts" | "Diagrams" | "QR Codes" | "Pipelines"
  generator: string; // "quickchart" | "mermaid" | "qr"
  tags?: string[];
  workflow: {
    nodes: StudioNode[];
    edges: StudioEdge[];
  };
}
```

### URL Parameter Support

Templates can be loaded via URL: `https://studio.floimg.com/?template=sales-dashboard`

This enables "Open in Studio" links from the floimg-web gallery.

## Workflow Metadata

Generated images include workflow metadata in sidecar files.

### File Structure

```
data/images/
├── img_12345_abc123.png      # Generated image
├── img_12345_abc123.meta.json # Workflow metadata
```

### Metadata Schema

```typescript
interface ImageMetadata {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
  workflow?: {
    nodes: StudioNode[];
    edges: StudioEdge[];
    executedAt: number;
    templateId?: string; // If loaded from template
  };
}
```

### Gallery Integration

The Gallery tab provides:

- "Load Workflow" button on hover to reload the workflow that created an image
- Automatic tab switch to Editor after loading

## TOS Consent

Terms of Service consent is required for cloud deployments only.

### Cloud Detection

Cloud mode is detected by hostname:

- `studio.floimg.com` → Cloud (TOS required)
- `floimg.studio` → Cloud (TOS required)
- Other hostnames → Self-hosted (TOS skipped)

### Consent Storage

Consent is stored in localStorage with version tracking:

```typescript
{
  version: "1.0",
  acceptedAt: "2025-01-01T00:00:00.000Z"
}
```

Bumping `TOS_VERSION` in `TOSConsent.tsx` will re-prompt users to accept updated terms.
