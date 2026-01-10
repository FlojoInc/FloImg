/**
 * Keyboard shortcut definitions and registry
 */

import type { ShortcutAction, ShortcutDefinition, ShortcutCategory } from "./types";

/** All shortcut definitions */
export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  // Workflow shortcuts
  {
    action: "save",
    name: "Save Workflow",
    description: "Save the current workflow",
    category: "workflow",
    defaultBinding: "mod+s",
    customizable: true,
  },
  {
    action: "execute",
    name: "Execute Workflow",
    description: "Run the current workflow",
    category: "workflow",
    defaultBinding: "mod+enter",
    customizable: true,
  },
  {
    action: "newWorkflow",
    name: "New Workflow",
    description: "Create a new empty workflow",
    category: "workflow",
    defaultBinding: "mod+n",
    customizable: true,
  },
  {
    action: "exportWorkflow",
    name: "Export Workflow",
    description: "Export workflow as YAML or JavaScript",
    category: "workflow",
    defaultBinding: "mod+e",
    customizable: true,
  },
  {
    action: "importWorkflow",
    name: "Import Workflow",
    description: "Import workflow from YAML",
    category: "workflow",
    defaultBinding: "mod+i",
    customizable: true,
  },

  // Editing shortcuts
  {
    action: "duplicate",
    name: "Duplicate Node",
    description: "Duplicate the selected node",
    category: "editing",
    defaultBinding: "mod+d",
    customizable: true,
  },
  {
    action: "delete",
    name: "Delete Node",
    description: "Delete the selected node(s)",
    category: "editing",
    defaultBinding: "delete,backspace",
    customizable: false, // Handled by React Flow
  },
  {
    action: "selectAll",
    name: "Select All",
    description: "Select all nodes on the canvas",
    category: "editing",
    defaultBinding: "mod+a",
    customizable: true,
  },
  {
    action: "deselect",
    name: "Deselect",
    description: "Deselect all nodes and close modals",
    category: "editing",
    defaultBinding: "escape",
    customizable: true,
  },

  // Canvas shortcuts
  {
    action: "zoomIn",
    name: "Zoom In",
    description: "Zoom in on the canvas",
    category: "canvas",
    defaultBinding: "mod+equal",
    customizable: true,
  },
  {
    action: "zoomOut",
    name: "Zoom Out",
    description: "Zoom out on the canvas",
    category: "canvas",
    defaultBinding: "mod+minus",
    customizable: true,
  },
  {
    action: "zoomFit",
    name: "Zoom to Fit",
    description: "Fit all nodes in view",
    category: "canvas",
    defaultBinding: "mod+0",
    customizable: true,
  },
  {
    action: "panMode",
    name: "Pan Mode",
    description: "Hold to pan the canvas",
    category: "canvas",
    defaultBinding: "space",
    customizable: false, // Special handling for hold
  },

  // UI shortcuts
  {
    action: "commandPalette",
    name: "Command Palette",
    description: "Open the command palette",
    category: "ui",
    defaultBinding: "mod+k",
    customizable: true,
  },
  {
    action: "showShortcuts",
    name: "Keyboard Shortcuts",
    description: "Show keyboard shortcuts help",
    category: "ui",
    defaultBinding: "mod+shift+slash",
    customizable: true,
  },
  {
    action: "toggleAIChat",
    name: "Toggle AI Chat",
    description: "Open or close the AI chat panel",
    category: "ui",
    defaultBinding: "mod+slash",
    customizable: true,
  },
  {
    action: "toggleLibrary",
    name: "Toggle Workflow Library",
    description: "Show or hide the workflow library",
    category: "ui",
    defaultBinding: "mod+b",
    customizable: true,
  },
  {
    action: "settings",
    name: "Open Settings",
    description: "Open the settings modal",
    category: "ui",
    defaultBinding: "mod+comma",
    customizable: true,
  },
  {
    action: "toggleNodePalette",
    name: "Toggle Node Palette",
    description: "Show or hide the node palette",
    category: "ui",
    defaultBinding: "mod+p",
    customizable: true,
  },

  // User-assignable (no default)
  {
    action: "cancelExecution",
    name: "Cancel Execution",
    description: "Stop the running workflow",
    category: "workflow",
    defaultBinding: null,
    customizable: true,
  },
  {
    action: "focusSearch",
    name: "Focus Search",
    description: "Focus the node search field",
    category: "ui",
    defaultBinding: null,
    customizable: true,
  },
];

/** Get default shortcuts as a record */
export function getDefaultShortcuts(): Record<ShortcutAction, string | null> {
  const defaults: Partial<Record<ShortcutAction, string | null>> = {};
  for (const def of SHORTCUT_DEFINITIONS) {
    defaults[def.action] = def.defaultBinding;
  }
  return defaults as Record<ShortcutAction, string | null>;
}

/** Get shortcut definition by action */
export function getShortcutDefinition(action: ShortcutAction): ShortcutDefinition | undefined {
  return SHORTCUT_DEFINITIONS.find((d) => d.action === action);
}

/** Get shortcuts grouped by category */
export function getShortcutsByCategory(): Record<ShortcutCategory, ShortcutDefinition[]> {
  const grouped: Record<ShortcutCategory, ShortcutDefinition[]> = {
    workflow: [],
    editing: [],
    canvas: [],
    ui: [],
  };

  for (const def of SHORTCUT_DEFINITIONS) {
    grouped[def.category].push(def);
  }

  return grouped;
}

/** Category display names */
export const CATEGORY_NAMES: Record<ShortcutCategory, string> = {
  workflow: "Workflow",
  editing: "Editing",
  canvas: "Canvas",
  ui: "Interface",
};
