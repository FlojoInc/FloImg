# @teamflojo/floimg-studio-ui

React components for building visual workflow editors with FloImg.

## Installation

```bash
npm install @teamflojo/floimg-studio-ui
```

## Peer Dependencies

This package requires the following peer dependencies:

```bash
npm install react react-dom @tanstack/react-query reactflow zustand
```

## Quick Start

```tsx
import { App } from "@teamflojo/floimg-studio-ui";
import "@teamflojo/floimg-studio-ui/styles.css";

function MyStudio() {
  return <App />;
}
```

## Individual Components

For custom compositions, import individual components:

```tsx
import {
  WorkflowEditor,
  NodePalette,
  NodeInspector,
  Toolbar,
  ExecutionHistory,
} from "@teamflojo/floimg-studio-ui";
```

### Available Components

| Component          | Description                                |
| ------------------ | ------------------------------------------ |
| `App`              | Complete FloImg Studio application         |
| `WorkflowEditor`   | Main canvas with React Flow                |
| `NodePalette`      | Draggable node palette                     |
| `NodeInspector`    | Parameter editing panel                    |
| `Toolbar`          | Top toolbar with actions                   |
| `ExecutionHistory` | Workflow execution history with thumbnails |
| `TemplateGallery`  | Workflow template browser                  |
| `WorkflowLibrary`  | Saved workflows panel                      |
| `AISettings`       | AI provider configuration                  |
| `AIChat`           | Natural language workflow generation       |
| `UploadGallery`    | Uploaded images browser                    |

### Toolbar Props

The `Toolbar` component accepts props for customization:

```tsx
import { Toolbar, type ToolbarProps } from "@teamflojo/floimg-studio-ui";

<Toolbar
  brandingSlot={<MyLogo />}
  beforeActionsSlot={<CustomButton />}
  afterActionsSlot={<UserMenu />}
  hideAttribution={true}
  hideWorkflowLibrary={true}
/>;
```

## State Management

Access workflow state with Zustand:

```tsx
import { useWorkflowStore } from "@teamflojo/floimg-studio-ui";

function MyComponent() {
  const { nodes, edges, addNode } = useWorkflowStore();
  // ...
}
```

## Execution History

Track workflow execution runs with the store:

```tsx
import { useWorkflowStore, type ExecutionRun } from "@teamflojo/floimg-studio-ui";

function MyComponent() {
  const executionHistory = useWorkflowStore((s) => s.executionHistory);
  const clearHistory = useWorkflowStore((s) => s.clearHistory);
  // ...
}
```

## Self-Hosting

For a complete self-hosted solution, use the Docker image instead:

```bash
docker run -d -p 5100:5100 ghcr.io/flojoinc/floimg-studio
```

## Related Packages

- [@teamflojo/floimg](https://www.npmjs.com/package/@teamflojo/floimg) — Core engine
- [@teamflojo/floimg-studio-shared](https://www.npmjs.com/package/@teamflojo/floimg-studio-shared) — Shared types

## License

MIT
