/**
 * KeyboardShortcutsModal - Shows all available keyboard shortcuts
 * Triggered by Cmd+? or clicking help
 */

import { useState, useMemo, useId } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { KeyBadge } from "./KeyBadge";
import {
  SHORTCUT_DEFINITIONS,
  getShortcutsByCategory,
  CATEGORY_NAMES,
} from "../lib/keyboard/shortcuts";
import type { ShortcutAction, ShortcutCategory } from "../lib/keyboard/types";
import { useFocusTrap } from "../lib/useFocusTrap";

export function KeyboardShortcutsModal() {
  const showModal = useSettingsStore((s) => s.showShortcutsModal);
  const closeModal = useSettingsStore((s) => s.closeShortcutsModal);
  const keyboardSettings = useSettingsStore((s) => s.keyboard);

  const [searchQuery, setSearchQuery] = useState("");
  const titleId = useId();
  const focusTrapRef = useFocusTrap(showModal);

  // Get effective binding for an action
  const getEffectiveBinding = (action: ShortcutAction): string | null => {
    const def = SHORTCUT_DEFINITIONS.find((d) => d.action === action);
    if (!def) return null;

    // User override takes precedence
    if (keyboardSettings?.shortcuts?.[action] !== undefined) {
      return keyboardSettings.shortcuts[action] ?? null;
    }

    return def.defaultBinding;
  };

  // Group shortcuts by category
  const groupedShortcuts = useMemo(() => {
    const groups = getShortcutsByCategory();

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered: Record<ShortcutCategory, typeof SHORTCUT_DEFINITIONS> = {
        workflow: [],
        editing: [],
        canvas: [],
        ui: [],
      };

      for (const category of Object.keys(groups) as ShortcutCategory[]) {
        filtered[category] = groups[category].filter(
          (def) =>
            def.name.toLowerCase().includes(query) || def.description.toLowerCase().includes(query)
        );
      }

      return filtered;
    }

    return groups;
  }, [searchQuery]);

  if (!showModal) return null;

  const categoryOrder: ShortcutCategory[] = ["workflow", "editing", "canvas", "ui"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div
        ref={focusTrapRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h2 id={titleId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={closeModal}
            aria-label="Close keyboard shortcuts"
            className="p-1 text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-700"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-2 border-b border-zinc-200 dark:border-zinc-700">
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Search shortcuts"
            autoFocus
            className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
          />
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {categoryOrder.map((category) => {
            const shortcuts = groupedShortcuts[category];
            if (shortcuts.length === 0) return null;

            return (
              <div key={category} className="mb-4">
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-2">
                  {CATEGORY_NAMES[category]}
                </h3>
                <div className="space-y-1">
                  {shortcuts.map((def) => {
                    const binding = getEffectiveBinding(def.action);
                    return (
                      <div
                        key={def.action}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700/50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                            {def.name}
                          </div>
                          <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {def.description}
                          </div>
                        </div>
                        <div className="ml-4 flex-shrink-0">
                          {binding ? (
                            <KeyBadge binding={binding} size="sm" />
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              Not set
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Customize in Settings → Keyboard
            </span>
            <button
              onClick={closeModal}
              className="px-3 py-1.5 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
