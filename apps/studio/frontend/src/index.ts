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
export { NodeInspector } from "./components/NodeInspector";
export { Toolbar, type ToolbarProps } from "./components/Toolbar";
export { Gallery } from "./components/Gallery";
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
export { useWorkflowStore } from "./stores/workflowStore";
export { useSettingsStore } from "./stores/settingsStore";

// Templates (OSS-compatible only - no cloud-only AI templates)
export {
  coreTemplates as templates,
  getCoreCategories as getCategories,
  getCoreTemplatesByCategory as getTemplatesByCategory,
  getCoreTemplateById as getTemplateById,
  searchCoreTemplates as searchTemplates,
  resolveTemplate,
  type Template,
} from "@teamflojo/floimg-templates";

// Re-export types from shared
export type * from "@teamflojo/floimg-studio-shared";
