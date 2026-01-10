/**
 * KeyBadge - Displays keyboard shortcut keys as styled badges
 * Platform-aware (shows ⌘ on Mac, Ctrl on Windows)
 */

import { bindingToKeys } from "../lib/keyboard/platformUtils";

interface KeyBadgeProps {
  /** Shortcut binding string (e.g., 'mod+s', 'mod+shift+k') */
  binding: string | null;
  /** Optional additional className */
  className?: string;
  /** Size variant */
  size?: "sm" | "md";
}

/**
 * Displays a keyboard shortcut as styled key badges
 * Automatically converts platform-agnostic bindings to platform-specific display
 */
export function KeyBadge({ binding, className = "", size = "md" }: KeyBadgeProps) {
  if (!binding) return null;

  const keys = bindingToKeys(binding);

  if (keys.length === 0) return null;

  const sizeClasses = {
    sm: "px-1 py-0.5 text-[10px] min-w-[16px]",
    md: "px-1.5 py-0.5 text-xs min-w-[20px]",
  };

  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={`
            ${sizeClasses[size]}
            inline-flex items-center justify-center
            font-mono font-medium
            bg-zinc-200 dark:bg-zinc-700
            text-zinc-600 dark:text-zinc-300
            border border-zinc-300 dark:border-zinc-600
            rounded
            shadow-sm
          `}
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}

/**
 * Displays a shortcut inline with action text
 * Example: "Save Workflow" with "⌘S" badge
 */
interface ShortcutLabelProps {
  /** Action name */
  label: string;
  /** Shortcut binding */
  binding: string | null;
  /** Optional additional className for the container */
  className?: string;
}

export function ShortcutLabel({ label, binding, className = "" }: ShortcutLabelProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span>{label}</span>
      {binding && <KeyBadge binding={binding} size="sm" />}
    </span>
  );
}
