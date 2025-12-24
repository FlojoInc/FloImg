/**
 * @teamflojo/floimg-studio-ui
 *
 * FloImg Studio React components for building visual workflow editors.
 * This is the UI library used by FloImg Studio Cloud.
 *
 * For self-hosting, use the Docker image instead.
 */

// Main App component
export { default as App } from "./App";

// Individual components (for custom compositions)
export { WorkflowEditor } from "./editor/WorkflowEditor";
export { NodePalette } from "./components/NodePalette";
export { NodeInspector } from "./components/NodeInspector";
export { Toolbar } from "./components/Toolbar";
export { Gallery } from "./components/Gallery";
export { TemplateGallery } from "./components/TemplateGallery";
export { WorkflowLibrary } from "./components/WorkflowLibrary";
export { AISettings } from "./components/AISettings";
export { UploadGallery } from "./components/UploadGallery";

// State management
export { useWorkflowStore } from "./stores/workflowStore";

// Templates
export {
  templates,
  getCategories,
  getTemplatesByCategory,
  getTemplateById,
  searchTemplates,
} from "./templates";

// Re-export types from shared
export type * from "@teamflojo/floimg-studio-shared";
