/**
 * Keyboard shortcut system types
 */

/** Categories for organizing shortcuts */
export type ShortcutCategory = "workflow" | "editing" | "canvas" | "ui";

/** Shortcut action identifiers */
export type ShortcutAction =
  // Workflow
  | "save"
  | "execute"
  | "newWorkflow"
  | "exportWorkflow"
  | "importWorkflow"
  // Editing
  | "duplicate"
  | "delete"
  | "selectAll"
  | "deselect"
  // Canvas
  | "zoomIn"
  | "zoomOut"
  | "zoomFit"
  | "panMode"
  // UI
  | "commandPalette"
  | "showShortcuts"
  | "toggleAIChat"
  | "toggleLibrary"
  | "settings"
  | "toggleNodePalette"
  // User-assignable (no default)
  | "cancelExecution"
  | "focusSearch";

/** Shortcut definition with metadata */
export interface ShortcutDefinition {
  /** Action identifier */
  action: ShortcutAction;
  /** Human-readable name */
  name: string;
  /** Description for help modal */
  description: string;
  /** Category for grouping */
  category: ShortcutCategory;
  /** Default key binding (uses 'mod' for Cmd/Ctrl) */
  defaultBinding: string | null;
  /** Whether shortcut can be customized */
  customizable: boolean;
}

/** User's keyboard settings */
export interface KeyboardSettings {
  /** User's custom shortcut overrides (action -> binding) */
  shortcuts: Partial<Record<ShortcutAction, string>>;
  /** Whether keyboard shortcuts are enabled globally */
  enabled: boolean;
}

/** Command for command palette */
export interface Command {
  /** Unique identifier */
  id: string;
  /** Display name */
  name: string;
  /** Category for grouping */
  category: ShortcutCategory | "nodes";
  /** Optional keyboard shortcut */
  shortcut?: string;
  /** Optional icon (React node) */
  icon?: React.ReactNode;
  /** Action to execute */
  action: () => void;
  /** Optional function to check if command is enabled */
  enabled?: () => boolean;
  /** Optional keywords for search */
  keywords?: string[];
}

/** Key event info for shortcut recording */
export interface RecordedShortcut {
  /** Raw key string */
  key: string;
  /** Modifier keys pressed */
  modifiers: {
    ctrl: boolean;
    meta: boolean;
    alt: boolean;
    shift: boolean;
  };
  /** Formatted binding string (e.g., 'mod+s') */
  binding: string;
  /** Display string (e.g., '⌘S' on Mac) */
  displayString: string;
}

/** Conflict check result */
export interface ConflictCheckResult {
  /** Whether there's a conflict */
  hasConflict: boolean;
  /** Type of conflict */
  conflictType?: "browser" | "internal" | "reactflow";
  /** Human-readable conflict message */
  message?: string;
  /** Action that conflicts (for internal conflicts) */
  conflictingAction?: ShortcutAction;
}
