/**
 * KeyboardSettings - Customization UI for keyboard shortcuts
 * Allows users to view and remap shortcuts
 */

import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { ShortcutRecorder } from "./ShortcutRecorder";
import { KeyBadge } from "./KeyBadge";
import {
  SHORTCUT_DEFINITIONS,
  getShortcutsByCategory,
  CATEGORY_NAMES,
} from "../lib/keyboard/shortcuts";
import type { ShortcutAction, ShortcutCategory } from "../lib/keyboard/types";

interface KeyboardSettingsProps {
  /** Optional className */
  className?: string;
}

export function KeyboardSettings({ className = "" }: KeyboardSettingsProps) {
  const keyboardSettings = useSettingsStore((s) => s.keyboard);
  const updateShortcut = useSettingsStore((s) => s.updateShortcut);
  const resetShortcut = useSettingsStore((s) => s.resetShortcut);
  const resetAllShortcuts = useSettingsStore((s) => s.resetAllShortcuts);
  const isShortcutConflicting = useSettingsStore((s) => s.isShortcutConflicting);

  const [expandedCategory, setExpandedCategory] = useState<ShortcutCategory | null>("workflow");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Check if a shortcut has been customized
  const isCustomized = (action: ShortcutAction): boolean => {
    return keyboardSettings?.shortcuts?.[action] !== undefined;
  };

  const groupedShortcuts = getShortcutsByCategory();
  const categoryOrder: ShortcutCategory[] = ["workflow", "editing", "canvas", "ui"];

  // Filter shortcuts by search
  const filterShortcuts = (shortcuts: typeof SHORTCUT_DEFINITIONS) => {
    if (!searchQuery.trim()) return shortcuts;
    const query = searchQuery.toLowerCase();
    return shortcuts.filter(
      (def) =>
        def.name.toLowerCase().includes(query) || def.description.toLowerCase().includes(query)
    );
  };

  // Check conflict for a specific action
  const checkConflict = (action: ShortcutAction) => (binding: string) => {
    return isShortcutConflicting(binding, action);
  };

  // Handle shortcut change
  const handleShortcutChange = (action: ShortcutAction, binding: string | null) => {
    updateShortcut(action, binding);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Keyboard Shortcuts
          </h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Customize shortcuts to match your workflow
          </p>
        </div>
        <button
          onClick={resetAllShortcuts}
          className="px-3 py-1.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 rounded-lg transition-colors"
        >
          Reset All
        </button>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="Search shortcuts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 text-sm bg-zinc-100 dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-500"
        />
      </div>

      {/* Shortcuts by category */}
      <div className="space-y-2">
        {categoryOrder.map((category) => {
          const shortcuts = filterShortcuts(groupedShortcuts[category]);
          if (shortcuts.length === 0) return null;

          const isExpanded = expandedCategory === category || searchQuery.trim() !== "";

          return (
            <div
              key={category}
              className="border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden"
            >
              {/* Category header */}
              <button
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="w-full flex items-center justify-between px-4 py-3 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/50 transition-colors"
              >
                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {CATEGORY_NAMES[category]}
                </span>
                <svg
                  className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>

              {/* Shortcuts list */}
              {isExpanded && (
                <div className="divide-y divide-zinc-200 dark:divide-zinc-700">
                  {shortcuts.map((def) => {
                    const binding = getEffectiveBinding(def.action);
                    const customized = isCustomized(def.action);

                    return (
                      <div
                        key={def.action}
                        className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-800"
                      >
                        <div className="flex-1 min-w-0 mr-4">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                              {def.name}
                            </span>
                            {customized && (
                              <span className="px-1.5 py-0.5 text-[10px] font-medium text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-900/30 rounded">
                                Modified
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {def.description}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {def.customizable ? (
                            <>
                              <ShortcutRecorder
                                value={binding}
                                onChange={(b) => handleShortcutChange(def.action, b)}
                                onConflictCheck={checkConflict(def.action)}
                              />
                              {customized && (
                                <button
                                  onClick={() => resetShortcut(def.action)}
                                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                                  title="Reset to default"
                                >
                                  <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    />
                                  </svg>
                                </button>
                              )}
                            </>
                          ) : (
                            <div className="flex items-center gap-2">
                              <KeyBadge binding={binding} size="sm" />
                              <span className="text-xs text-zinc-400 dark:text-zinc-500">
                                (fixed)
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Help text */}
      <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
        <p>• Click a shortcut to record a new key combination</p>
        <p>• Press Escape to cancel, Backspace to clear</p>
        <p>• Some shortcuts like Delete are handled by the canvas and cannot be changed</p>
      </div>
    </div>
  );
}
