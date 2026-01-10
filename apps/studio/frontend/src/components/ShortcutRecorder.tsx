/**
 * ShortcutRecorder - VS Code-style keyboard shortcut recording widget
 * Click to start recording, press keys to set, Escape to cancel
 */

import { useState, useCallback, useRef, useEffect } from "react";
import { KeyBadge } from "./KeyBadge";
import { keyEventToBinding } from "../lib/keyboard/platformUtils";
import { isBrowserReserved, isValidBinding } from "../lib/keyboard/conflicts";

interface ShortcutRecorderProps {
  /** Current binding value */
  value: string | null;
  /** Callback when binding changes */
  onChange: (binding: string | null) => void;
  /** Callback to check for conflicts */
  onConflictCheck?: (binding: string) => string | null;
  /** Whether the recorder is disabled */
  disabled?: boolean;
  /** Optional additional className */
  className?: string;
}

type RecordingState = "idle" | "recording" | "error";

export function ShortcutRecorder({
  value,
  onChange,
  onConflictCheck,
  disabled = false,
  className = "",
}: ShortcutRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLButtonElement>(null);

  // Handle key events during recording
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Escape cancels recording
      if (e.key === "Escape") {
        setState("idle");
        setError(null);
        return;
      }

      // Backspace/Delete clears the binding
      if (e.key === "Backspace" || e.key === "Delete") {
        if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
          onChange(null);
          setState("idle");
          setError(null);
          return;
        }
      }

      const binding = keyEventToBinding(e);

      // Skip if only modifiers pressed
      if (!binding) return;

      // Validate the binding
      if (!isValidBinding(binding)) {
        setError("Invalid key combination");
        setState("error");
        return;
      }

      // Check for browser reserved shortcuts
      if (isBrowserReserved(binding)) {
        setError("This shortcut is reserved by the browser");
        setState("error");
        return;
      }

      // Check for conflicts
      if (onConflictCheck) {
        const conflict = onConflictCheck(binding);
        if (conflict) {
          setError(conflict);
          setState("error");
          return;
        }
      }

      // Valid binding - set it
      onChange(binding);
      setState("idle");
      setError(null);
    },
    [onChange, onConflictCheck]
  );

  // Set up keyboard listener when recording
  useEffect(() => {
    if (state === "recording") {
      document.addEventListener("keydown", handleKeyDown, true);
      return () => {
        document.removeEventListener("keydown", handleKeyDown, true);
      };
    }
  }, [state, handleKeyDown]);

  // Focus management
  useEffect(() => {
    if (state === "recording" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [state]);

  const handleClick = () => {
    if (disabled) return;
    if (state === "idle") {
      setState("recording");
      setError(null);
    }
  };

  const handleBlur = () => {
    // Delay to allow keyboard events to process
    setTimeout(() => {
      if (state === "recording") {
        setState("idle");
      }
    }, 100);
  };

  return (
    <div className={`inline-flex flex-col gap-1 ${className}`}>
      <button
        ref={inputRef}
        type="button"
        onClick={handleClick}
        onBlur={handleBlur}
        disabled={disabled}
        className={`
          inline-flex items-center justify-center
          min-w-[100px] px-3 py-1.5
          text-sm font-medium
          rounded-md
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
          dark:focus:ring-offset-zinc-800
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${
            state === "recording"
              ? "bg-teal-500 text-white border-2 border-teal-400 animate-pulse"
              : state === "error"
                ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500"
                : "bg-zinc-100 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-200 dark:hover:bg-zinc-600"
          }
        `}
      >
        {state === "recording" ? (
          <span className="text-xs">Press keys...</span>
        ) : value ? (
          <KeyBadge binding={value} size="sm" />
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500 text-xs">Not set</span>
        )}
      </button>

      {/* Error message */}
      {state === "error" && error && (
        <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
      )}

      {/* Helper text when recording */}
      {state === "recording" && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          Press Esc to cancel, Backspace to clear
        </span>
      )}
    </div>
  );
}
