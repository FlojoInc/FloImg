/**
 * @teamflojo/floimg-studio-ui
 *
 * FloImg Studio React components for building visual workflow editors.
 * This is the UI library used by FloImg Studio Cloud.
 *
 * For self-hosting, use the Docker image instead.
 */

// Styles (includes Tailwind utilities and dark mode overrides for React Flow)
import "./index.css";

// Main App component
export { default as App } from "./App";

// Individual components (for custom compositions)
export { WorkflowEditor } from "./editor/WorkflowEditor";
export { NodePalette } from "./components/NodePalette";
export {
  NodePaletteItem,
  type NodePaletteItemProps,
  type NodePaletteColorVariant,
} from "./components/NodePaletteItem";
export { NodeInspector } from "./components/NodeInspector";
export { Toolbar, type ToolbarProps } from "./components/Toolbar";
export { ExecutionHistory } from "./components/ExecutionHistory";
export { TemplateGallery } from "./components/TemplateGallery";
export { WorkflowLibrary } from "./components/WorkflowLibrary";
export { AISettings } from "./components/AISettings";
export { AIChat } from "./components/AIChat";
export { UploadGallery } from "./components/UploadGallery";
export { CommandPalette } from "./components/CommandPalette";
export { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";

// Keyboard shortcuts
export { useKeyboardShortcuts } from "./lib/keyboard/useKeyboardShortcuts";
export { SHORTCUT_DEFINITIONS, CATEGORY_NAMES } from "./lib/keyboard/shortcuts";
export type * from "./lib/keyboard/types";

// State management
export {
  useWorkflowStore,
  type ExecutionRun,
  type ExecutionRunOutput,
  type SavedWorkflow,
} from "./stores/workflowStore";
export { useSettingsStore } from "./stores/settingsStore";

// Re-export types from shared
// Note: Template types are included via the shared re-export
// Templates are fetched from API at runtime (single source of truth)
export type * from "@teamflojo/floimg-studio-shared";
