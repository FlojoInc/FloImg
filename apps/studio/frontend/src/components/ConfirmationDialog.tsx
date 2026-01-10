/**
 * ConfirmationDialog - Accessible confirmation modal
 * Used for destructive actions like creating a new workflow with unsaved changes
 */

import { useId, useEffect, useCallback } from "react";
import { useFocusTrap } from "../lib/useFocusTrap";

interface ConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Title of the dialog */
  title: string;
  /** Message/description */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Callback when confirmed */
  onConfirm: () => void;
  /** Callback when cancelled */
  onCancel: () => void;
  /** Whether the action is destructive (changes button styling) */
  destructive?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  destructive = false,
}: ConfirmationDialogProps) {
  const titleId = useId();
  const descId = useId();
  const focusTrapRef = useFocusTrap(isOpen);

  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    },
    [onCancel]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        ref={focusTrapRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-sm w-full mx-4 overflow-hidden"
      >
        <div className="px-6 py-4">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {title}
          </h2>
          <p id={descId} className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-800"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            autoFocus
            className={`px-4 py-2 text-sm font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-zinc-800 ${
              destructive
                ? "text-white bg-red-600 hover:bg-red-700 focus:ring-red-500"
                : "text-white bg-teal-600 hover:bg-teal-700 focus:ring-teal-500"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
