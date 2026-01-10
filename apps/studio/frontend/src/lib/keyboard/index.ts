/**
 * Keyboard shortcuts module
 * Provides comprehensive keyboard shortcut support for FloImg Studio
 */

// Types
export type {
  ShortcutAction,
  ShortcutCategory,
  ShortcutDefinition,
  KeyboardSettings,
  Command,
  RecordedShortcut,
  ConflictCheckResult,
} from "./types";

// Shortcut definitions and registry
export {
  SHORTCUT_DEFINITIONS,
  getDefaultShortcuts,
  getShortcutDefinition,
  getShortcutsByCategory,
  CATEGORY_NAMES,
} from "./shortcuts";

// Platform utilities
export {
  isMac,
  getModifierKey,
  getOptionKey,
  getShiftKey,
  bindingToDisplay,
  bindingToKeys,
  keyEventToBinding,
  keyEventToDisplay,
} from "./platformUtils";

// Conflict detection
export {
  BROWSER_RESERVED,
  REACT_FLOW_DEFAULTS,
  isBrowserReserved,
  isReactFlowDefault,
  checkShortcutConflict,
  isValidBinding,
} from "./conflicts";

// Main hooks
export { useKeyboardShortcuts, useShortcutBinding } from "./useKeyboardShortcuts";
