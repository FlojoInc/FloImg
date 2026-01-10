/**
 * Platform detection and key display utilities
 */

/** Check if running on macOS */
export function isMac(): boolean {
  if (typeof navigator === "undefined") return false;
  return navigator.platform.toLowerCase().includes("mac");
}

/** Get the modifier key name for display */
export function getModifierKey(): string {
  return isMac() ? "⌘" : "Ctrl";
}

/** Get the option/alt key name for display */
export function getOptionKey(): string {
  return isMac() ? "⌥" : "Alt";
}

/** Get the shift key symbol for display */
export function getShiftKey(): string {
  return "⇧";
}

/** Symbol mappings for display */
const KEY_SYMBOLS: Record<string, string> = {
  enter: "⏎",
  return: "⏎",
  escape: "Esc",
  backspace: "⌫",
  delete: "Del",
  arrowup: "↑",
  arrowdown: "↓",
  arrowleft: "←",
  arrowright: "→",
  space: "Space",
  tab: "Tab",
  comma: ",",
  slash: "/",
  equal: "=",
  minus: "-",
  plus: "+",
  period: ".",
};

/**
 * Convert a binding string (e.g., 'mod+s') to display format (e.g., '⌘S')
 */
export function bindingToDisplay(binding: string): string {
  if (!binding) return "";

  const parts = binding.toLowerCase().split("+");
  const displayParts: string[] = [];

  for (const part of parts) {
    if (part === "mod") {
      displayParts.push(getModifierKey());
    } else if (part === "ctrl" || part === "control") {
      displayParts.push(isMac() ? "⌃" : "Ctrl");
    } else if (part === "alt" || part === "option") {
      displayParts.push(getOptionKey());
    } else if (part === "shift") {
      displayParts.push(getShiftKey());
    } else if (part === "meta" || part === "cmd" || part === "command") {
      displayParts.push("⌘");
    } else if (KEY_SYMBOLS[part]) {
      displayParts.push(KEY_SYMBOLS[part]);
    } else {
      // Regular key - uppercase for display
      displayParts.push(part.toUpperCase());
    }
  }

  return displayParts.join("");
}

/**
 * Convert a binding to an array of display keys (for KeyBadge)
 */
export function bindingToKeys(binding: string): string[] {
  if (!binding) return [];

  const parts = binding.toLowerCase().split("+");
  const keys: string[] = [];

  for (const part of parts) {
    if (part === "mod") {
      keys.push(getModifierKey());
    } else if (part === "ctrl" || part === "control") {
      keys.push(isMac() ? "⌃" : "Ctrl");
    } else if (part === "alt" || part === "option") {
      keys.push(getOptionKey());
    } else if (part === "shift") {
      keys.push(getShiftKey());
    } else if (part === "meta" || part === "cmd" || part === "command") {
      keys.push("⌘");
    } else if (KEY_SYMBOLS[part]) {
      keys.push(KEY_SYMBOLS[part]);
    } else {
      keys.push(part.toUpperCase());
    }
  }

  return keys;
}

/**
 * Convert a KeyboardEvent to a binding string
 */
export function keyEventToBinding(e: KeyboardEvent): string {
  const parts: string[] = [];

  // Use 'mod' for platform-independent modifier
  if (e.metaKey || e.ctrlKey) {
    parts.push("mod");
  }
  if (e.altKey) {
    parts.push("alt");
  }
  if (e.shiftKey) {
    parts.push("shift");
  }

  // Get the key, normalizing special keys
  let key = e.key.toLowerCase();

  // Skip if only modifier keys
  if (["control", "meta", "alt", "shift"].includes(key)) {
    return "";
  }

  // Normalize some key names
  if (key === " ") key = "space";
  if (key === ",") key = "comma";
  if (key === "/") key = "slash";
  if (key === "=") key = "equal";
  if (key === "-") key = "minus";
  if (key === ".") key = "period";

  parts.push(key);

  return parts.join("+");
}

/**
 * Convert a KeyboardEvent to a display string
 */
export function keyEventToDisplay(e: KeyboardEvent): string {
  const binding = keyEventToBinding(e);
  return bindingToDisplay(binding);
}
