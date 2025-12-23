/**
 * @floimg-studio/frontend - Library exports
 *
 * This file enables @floimg-studio/frontend to be consumed as a library
 * by floimg-cloud's studio-cloud package.
 *
 * Usage:
 *   import { App } from '@floimg-studio/frontend';
 *   import '@floimg-studio/frontend/styles';
 */

// Main App component - the full FloImg Studio application
export { default as App } from "./App";

// Individual components (for advanced composition if needed)
export { WorkflowEditor } from "./editor/WorkflowEditor";
export { NodePalette } from "./components/NodePalette";
export { NodeInspector } from "./components/NodeInspector";
export { Toolbar } from "./components/Toolbar";
export { Gallery } from "./components/Gallery";
export { TemplateGallery } from "./components/TemplateGallery";
export { WorkflowLibrary } from "./components/WorkflowLibrary";
export { AISettings } from "./components/AISettings";

// Stores (for state access if needed)
export { useWorkflowStore } from "./stores/workflowStore";

// Templates
export { getTemplateById, templates, searchTemplates, getTemplatesByCategory } from "./templates";
