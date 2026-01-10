/**
 * CommandPalette - Raycast/Linear-style command palette
 * Triggered by Cmd+K for quick action discovery and execution
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useSettingsStore } from "../stores/settingsStore";
import { useWorkflowStore } from "../stores/workflowStore";
import { KeyBadge } from "./KeyBadge";
import { SHORTCUT_DEFINITIONS, CATEGORY_NAMES } from "../lib/keyboard/shortcuts";
import type { ShortcutAction, ShortcutCategory, Command } from "../lib/keyboard/types";

interface CommandPaletteProps {
  /** Callback to toggle AI Chat (since it's local state in App) */
  onToggleAIChat?: () => void;
}

export function CommandPalette({ onToggleAIChat }: CommandPaletteProps) {
  const showPalette = useSettingsStore((s) => s.showCommandPalette);
  const closePalette = useSettingsStore((s) => s.closeCommandPalette);
  const keyboardSettings = useSettingsStore((s) => s.keyboard);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Get workflow store actions for commands
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const execution = useWorkflowStore((s) => s.execution);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const execute = useWorkflowStore((s) => s.execute);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const toggleLibrary = useWorkflowStore((s) => s.toggleLibrary);
  const newWorkflow = useWorkflowStore((s) => s.newWorkflow);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const openShortcutsModal = useSettingsStore((s) => s.openShortcutsModal);
  const openExport = useSettingsStore((s) => s.openExport);
  const openImport = useSettingsStore((s) => s.openImport);

  // Get effective binding for an action
  const getEffectiveBinding = useCallback(
    (action: ShortcutAction): string | null => {
      const def = SHORTCUT_DEFINITIONS.find((d) => d.action === action);
      if (!def) return null;
      if (keyboardSettings?.shortcuts?.[action] !== undefined) {
        return keyboardSettings.shortcuts[action] ?? null;
      }
      return def.defaultBinding;
    },
    [keyboardSettings]
  );

  // Build command list
  const commands: Command[] = useMemo(() => {
    return [
      // Workflow commands
      {
        id: "save",
        name: "Save Workflow",
        category: "workflow",
        shortcut: getEffectiveBinding("save") ?? undefined,
        action: () => {
          if (nodes.length > 0) saveWorkflow();
        },
        enabled: () => nodes.length > 0,
        keywords: ["save", "commit"],
      },
      {
        id: "execute",
        name: "Execute Workflow",
        category: "workflow",
        shortcut: getEffectiveBinding("execute") ?? undefined,
        action: () => {
          if (nodes.length > 0 && execution.status !== "running") execute();
        },
        enabled: () => nodes.length > 0 && execution.status !== "running",
        keywords: ["run", "execute", "start"],
      },
      {
        id: "newWorkflow",
        name: "New Workflow",
        category: "workflow",
        shortcut: getEffectiveBinding("newWorkflow") ?? undefined,
        action: () => newWorkflow(),
        keywords: ["new", "create", "blank"],
      },
      {
        id: "exportWorkflow",
        name: "Export Workflow",
        category: "workflow",
        shortcut: getEffectiveBinding("exportWorkflow") ?? undefined,
        action: () => {
          if (nodes.length > 0) openExport?.();
        },
        enabled: () => nodes.length > 0,
        keywords: ["export", "download", "yaml", "javascript"],
      },
      {
        id: "importWorkflow",
        name: "Import Workflow",
        category: "workflow",
        shortcut: getEffectiveBinding("importWorkflow") ?? undefined,
        action: () => openImport?.(),
        keywords: ["import", "upload", "load"],
      },

      // Editing commands
      {
        id: "duplicate",
        name: "Duplicate Node",
        category: "editing",
        shortcut: getEffectiveBinding("duplicate") ?? undefined,
        action: () => {
          if (selectedNodeId) duplicateNode(selectedNodeId);
        },
        enabled: () => !!selectedNodeId,
        keywords: ["duplicate", "copy", "clone"],
      },

      // UI commands
      {
        id: "toggleLibrary",
        name: "Toggle Workflow Library",
        category: "ui",
        shortcut: getEffectiveBinding("toggleLibrary") ?? undefined,
        action: () => toggleLibrary(),
        keywords: ["library", "workflows", "saved"],
      },
      {
        id: "toggleAIChat",
        name: "Toggle AI Chat",
        category: "ui",
        shortcut: getEffectiveBinding("toggleAIChat") ?? undefined,
        action: () => onToggleAIChat?.(),
        keywords: ["ai", "chat", "generate", "assistant"],
      },
      {
        id: "settings",
        name: "Open Settings",
        category: "ui",
        shortcut: getEffectiveBinding("settings") ?? undefined,
        action: () => openSettings(),
        keywords: ["settings", "preferences", "api", "keys"],
      },
      {
        id: "showShortcuts",
        name: "Show Keyboard Shortcuts",
        category: "ui",
        shortcut: getEffectiveBinding("showShortcuts") ?? undefined,
        action: () => openShortcutsModal?.(),
        keywords: ["shortcuts", "keyboard", "hotkeys", "help"],
      },
    ];
  }, [
    nodes.length,
    selectedNodeId,
    execution.status,
    saveWorkflow,
    execute,
    newWorkflow,
    duplicateNode,
    toggleLibrary,
    openSettings,
    openShortcutsModal,
    openExport,
    openImport,
    onToggleAIChat,
    getEffectiveBinding,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!searchQuery.trim()) return commands;

    const query = searchQuery.toLowerCase();
    return commands.filter((cmd) => {
      const nameMatch = cmd.name.toLowerCase().includes(query);
      const keywordMatch = cmd.keywords?.some((kw) => kw.toLowerCase().includes(query));
      return nameMatch || keywordMatch;
    });
  }, [commands, searchQuery]);

  // Group filtered commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<ShortcutCategory | "nodes", Command[]> = {
      workflow: [],
      editing: [],
      canvas: [],
      ui: [],
      nodes: [],
    };

    for (const cmd of filteredCommands) {
      groups[cmd.category].push(cmd);
    }

    return groups;
  }, [filteredCommands]);

  // Reset selection when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Focus input when opening
  useEffect(() => {
    if (showPalette && inputRef.current) {
      inputRef.current.focus();
      setSearchQuery("");
      setSelectedIndex(0);
    }
  }, [showPalette]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        closePalette?.();
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd && (!cmd.enabled || cmd.enabled())) {
          cmd.action();
          closePalette?.();
        }
        return;
      }
    },
    [filteredCommands, selectedIndex, closePalette]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selectedEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`);
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: "nearest" });
      }
    }
  }, [selectedIndex]);

  if (!showPalette) return null;

  const categoryOrder: (ShortcutCategory | "nodes")[] = [
    "workflow",
    "editing",
    "ui",
    "canvas",
    "nodes",
  ];

  // Calculate flat index for each command
  let flatIndex = 0;
  const getCommandIndex = () => flatIndex++;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50"
      onClick={(e) => {
        if (e.target === e.currentTarget) closePalette?.();
      }}
    >
      <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden">
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <svg
            className="w-5 h-5 text-zinc-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm"
          />
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-zinc-100 dark:bg-zinc-700 text-zinc-500 border border-zinc-200 dark:border-zinc-600 rounded">
            Esc
          </kbd>
        </div>

        {/* Command list */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-zinc-500 dark:text-zinc-400 text-sm">
              No commands found
            </div>
          ) : (
            categoryOrder.map((category) => {
              const cmds = groupedCommands[category];
              if (cmds.length === 0) return null;

              return (
                <div key={category} className="mb-2">
                  <div className="px-4 py-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                    {CATEGORY_NAMES[category as ShortcutCategory] || category}
                  </div>
                  {cmds.map((cmd) => {
                    const index = getCommandIndex();
                    const isSelected = index === selectedIndex;
                    const isEnabled = !cmd.enabled || cmd.enabled();

                    return (
                      <button
                        key={cmd.id}
                        data-index={index}
                        onClick={() => {
                          if (isEnabled) {
                            cmd.action();
                            closePalette?.();
                          }
                        }}
                        disabled={!isEnabled}
                        className={`
                          w-full flex items-center justify-between px-4 py-2 text-left
                          ${isSelected ? "bg-teal-50 dark:bg-teal-900/30" : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"}
                          ${!isEnabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        `}
                      >
                        <span
                          className={`text-sm ${isSelected ? "text-teal-700 dark:text-teal-300" : "text-zinc-800 dark:text-zinc-200"}`}
                        >
                          {cmd.name}
                        </span>
                        {cmd.shortcut && <KeyBadge binding={cmd.shortcut} size="sm" />}
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">↑</kbd>
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">↓</kbd>
              <span>navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">↵</kbd>
              <span>select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 bg-zinc-200 dark:bg-zinc-700 rounded text-[10px]">
                esc
              </kbd>
              <span>close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
