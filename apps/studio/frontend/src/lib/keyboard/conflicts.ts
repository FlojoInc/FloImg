/**
 * Keyboard shortcut conflict detection
 */

import type { ConflictCheckResult, ShortcutAction } from "./types";
import { SHORTCUT_DEFINITIONS } from "./shortcuts";

/**
 * Browser-reserved shortcuts that cannot be overridden
 * These are blocked by browsers and will not work in web apps
 */
export const BROWSER_RESERVED = [
  "mod+w", // Close tab
  "mod+t", // New tab
  "mod+n", // New window (can sometimes work, but risky)
  "mod+q", // Quit browser
  "mod+r", // Refresh
  "mod+shift+r", // Hard refresh
  "mod+shift+t", // Reopen closed tab
  "mod+shift+n", // New incognito window
  "mod+shift+i", // DevTools
  "mod+shift+j", // DevTools console
  "mod+alt+i", // DevTools (Chrome)
  "mod+alt+j", // DevTools console (Chrome)
  "f5", // Refresh
  "f11", // Fullscreen
  "f12", // DevTools
  "alt+f4", // Close window (Windows)
];

/**
 * React Flow's built-in shortcuts that we should warn about
 */
export const REACT_FLOW_DEFAULTS = [
  "delete", // Delete selected
  "backspace", // Delete selected
];

/**
 * Check if a binding conflicts with browser reserved shortcuts
 */
export function isBrowserReserved(binding: string): boolean {
  const normalized = binding.toLowerCase().replace(/\s+/g, "");
  return BROWSER_RESERVED.includes(normalized);
}

/**
 * Check if a binding conflicts with React Flow defaults
 */
export function isReactFlowDefault(binding: string): boolean {
  const normalized = binding.toLowerCase().replace(/\s+/g, "");
  // Handle comma-separated bindings
  const bindings = normalized.split(",");
  return bindings.some((b) => REACT_FLOW_DEFAULTS.includes(b));
}

/**
 * Check if a binding conflicts with an existing shortcut
 */
export function checkShortcutConflict(
  binding: string,
  currentShortcuts: Partial<Record<ShortcutAction, string>>,
  excludeAction?: ShortcutAction
): ConflictCheckResult {
  // Check browser reserved first
  if (isBrowserReserved(binding)) {
    return {
      hasConflict: true,
      conflictType: "browser",
      message: "This shortcut is reserved by the browser and cannot be used",
    };
  }

  // Check React Flow defaults
  if (isReactFlowDefault(binding)) {
    return {
      hasConflict: true,
      conflictType: "reactflow",
      message: "This shortcut is used by the canvas for node deletion",
    };
  }

  // Check internal conflicts
  const normalized = binding.toLowerCase().replace(/\s+/g, "");

  for (const [action, existingBinding] of Object.entries(currentShortcuts)) {
    if (action === excludeAction) continue;
    if (!existingBinding) continue;

    const existingNormalized = existingBinding.toLowerCase().replace(/\s+/g, "");

    // Handle comma-separated bindings
    const newBindings = normalized.split(",");
    const existingBindings = existingNormalized.split(",");

    for (const nb of newBindings) {
      for (const eb of existingBindings) {
        if (nb === eb) {
          const def = SHORTCUT_DEFINITIONS.find((d) => d.action === action);
          return {
            hasConflict: true,
            conflictType: "internal",
            message: `This shortcut is already used by "${def?.name || action}"`,
            conflictingAction: action as ShortcutAction,
          };
        }
      }
    }
  }

  return { hasConflict: false };
}

/**
 * Validate a binding string format
 */
export function isValidBinding(binding: string): boolean {
  if (!binding || binding.trim() === "") return false;

  const parts = binding.toLowerCase().split("+");

  // Must have at least one non-modifier key
  const modifiers = ["mod", "ctrl", "control", "alt", "option", "shift", "meta", "cmd", "command"];
  const nonModifiers = parts.filter((p) => !modifiers.includes(p));

  if (nonModifiers.length === 0) return false;

  // Check for valid key names
  const validKeys =
    /^[a-z0-9]$|^f[1-9]$|^f1[0-2]$|^(enter|return|escape|backspace|delete|space|tab|comma|slash|equal|minus|period|arrowup|arrowdown|arrowleft|arrowright)$/;

  for (const key of nonModifiers) {
    if (!validKeys.test(key)) return false;
  }

  return true;
}
