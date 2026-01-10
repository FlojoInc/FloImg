/**
 * Global keyboard shortcuts hook
 * Centralizes all keyboard shortcut handling for FloImg Studio
 */

import { useCallback } from "react";
import { useHotkeys, Options } from "react-hotkeys-hook";
import { useReactFlow } from "reactflow";
import { useWorkflowStore } from "../../stores/workflowStore";
import { useSettingsStore } from "../../stores/settingsStore";
import type { ShortcutAction } from "./types";
import { SHORTCUT_DEFINITIONS } from "./shortcuts";

/** Default options for shortcuts - skip when typing in inputs */
const DEFAULT_OPTIONS: Options = {
  enableOnFormTags: false,
  preventDefault: true,
};

/**
 * Get the effective binding for an action (user override or default)
 */
function useEffectiveBinding(action: ShortcutAction): string | null {
  const keyboardSettings = useSettingsStore((s) => s.keyboard);
  const def = SHORTCUT_DEFINITIONS.find((d) => d.action === action);

  if (!def) return null;

  // User override takes precedence
  if (keyboardSettings?.shortcuts?.[action] !== undefined) {
    return keyboardSettings.shortcuts[action] ?? null;
  }

  return def.defaultBinding;
}

/**
 * Hook to register a single keyboard shortcut
 */
function useShortcut(action: ShortcutAction, handler: () => void, options: Options = {}): void {
  const binding = useEffectiveBinding(action);
  const keyboardEnabled = useSettingsStore((s) => s.keyboard?.enabled ?? true);

  useHotkeys(
    binding || "",
    handler,
    {
      ...DEFAULT_OPTIONS,
      ...options,
      enabled: keyboardEnabled && !!binding,
    },
    [handler, binding, keyboardEnabled]
  );
}

/** Props for configuring the keyboard shortcuts hook */
export interface UseKeyboardShortcutsProps {
  /** Callback to toggle AI Chat panel */
  onToggleAIChat?: () => void;
}

/**
 * Global keyboard shortcuts provider hook
 * Call this once in App.tsx to register all shortcuts
 */
export function useKeyboardShortcuts(props: UseKeyboardShortcutsProps = {}) {
  const { onToggleAIChat } = props;
  const reactFlowInstance = useReactFlow();

  // Workflow store actions
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const execution = useWorkflowStore((s) => s.execution);
  const hasUnsavedChanges = useWorkflowStore((s) => s.hasUnsavedChanges);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const execute = useWorkflowStore((s) => s.execute);
  const cancelExecution = useWorkflowStore((s) => s.cancelExecution);
  const duplicateNode = useWorkflowStore((s) => s.duplicateNode);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const toggleLibrary = useWorkflowStore((s) => s.toggleLibrary);
  const newWorkflow = useWorkflowStore((s) => s.newWorkflow);

  // Settings store actions
  const openSettings = useSettingsStore((s) => s.openSettings);
  const openShortcutsModal = useSettingsStore((s) => s.openShortcutsModal);
  const openCommandPalette = useSettingsStore((s) => s.openCommandPalette);
  const closeCommandPalette = useSettingsStore((s) => s.closeCommandPalette);
  const closeShortcutsModal = useSettingsStore((s) => s.closeShortcutsModal);
  const closeSettings = useSettingsStore((s) => s.closeSettings);
  const showCommandPalette = useSettingsStore((s) => s.showCommandPalette);
  const openExport = useSettingsStore((s) => s.openExport);
  const openImport = useSettingsStore((s) => s.openImport);
  const requestNewWorkflow = useSettingsStore((s) => s.requestNewWorkflow);

  // Workflow shortcuts
  const handleSave = useCallback(() => {
    if (nodes.length === 0) return;
    saveWorkflow();
  }, [nodes.length, saveWorkflow]);

  const handleExecute = useCallback(() => {
    if (nodes.length === 0 || execution.status === "running") return;
    execute();
  }, [nodes.length, execution.status, execute]);

  const handleNewWorkflow = useCallback(() => {
    requestNewWorkflow(hasUnsavedChanges, newWorkflow);
  }, [requestNewWorkflow, hasUnsavedChanges, newWorkflow]);

  const handleExport = useCallback(() => {
    if (nodes.length === 0) return;
    openExport?.();
  }, [nodes.length, openExport]);

  const handleImport = useCallback(() => {
    openImport?.();
  }, [openImport]);

  const handleCancelExecution = useCallback(() => {
    if (execution.status === "running") {
      cancelExecution();
    }
  }, [execution.status, cancelExecution]);

  // Editing shortcuts
  const handleDuplicate = useCallback(() => {
    if (selectedNodeId) {
      duplicateNode(selectedNodeId);
    }
  }, [selectedNodeId, duplicateNode]);

  const handleSelectAll = useCallback(() => {
    // Select all nodes using React Flow
    // React Flow handles multi-select via its own state
    reactFlowInstance?.setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: true,
      }))
    );
  }, [reactFlowInstance]);

  const handleDeselect = useCallback(() => {
    // Close any open modals first
    closeCommandPalette?.();
    closeShortcutsModal?.();
    closeSettings?.();

    // Deselect all nodes
    setSelectedNode(null);
    reactFlowInstance?.setNodes((nds) =>
      nds.map((node) => ({
        ...node,
        selected: false,
      }))
    );
  }, [setSelectedNode, reactFlowInstance, closeCommandPalette, closeShortcutsModal, closeSettings]);

  // Canvas shortcuts
  const handleZoomIn = useCallback(() => {
    reactFlowInstance?.zoomIn();
  }, [reactFlowInstance]);

  const handleZoomOut = useCallback(() => {
    reactFlowInstance?.zoomOut();
  }, [reactFlowInstance]);

  const handleZoomFit = useCallback(() => {
    reactFlowInstance?.fitView({ padding: 0.2 });
  }, [reactFlowInstance]);

  // UI shortcuts
  const handleCommandPalette = useCallback(() => {
    if (showCommandPalette) {
      closeCommandPalette?.();
    } else {
      openCommandPalette?.();
    }
  }, [showCommandPalette, openCommandPalette, closeCommandPalette]);

  const handleShowShortcuts = useCallback(() => {
    openShortcutsModal?.();
  }, [openShortcutsModal]);

  const handleToggleAIChat = useCallback(() => {
    onToggleAIChat?.();
  }, [onToggleAIChat]);

  const handleToggleLibrary = useCallback(() => {
    toggleLibrary();
  }, [toggleLibrary]);

  const handleSettings = useCallback(() => {
    openSettings();
  }, [openSettings]);

  // Register all shortcuts
  useShortcut("save", handleSave);
  useShortcut("execute", handleExecute);
  useShortcut("newWorkflow", handleNewWorkflow);
  useShortcut("exportWorkflow", handleExport);
  useShortcut("importWorkflow", handleImport);
  useShortcut("cancelExecution", handleCancelExecution);
  useShortcut("duplicate", handleDuplicate);
  useShortcut("selectAll", handleSelectAll);
  useShortcut("deselect", handleDeselect);
  useShortcut("zoomIn", handleZoomIn);
  useShortcut("zoomOut", handleZoomOut);
  useShortcut("zoomFit", handleZoomFit);
  useShortcut("commandPalette", handleCommandPalette);
  useShortcut("showShortcuts", handleShowShortcuts);
  useShortcut("toggleAIChat", handleToggleAIChat);
  useShortcut("toggleLibrary", handleToggleLibrary);
  useShortcut("settings", handleSettings);

  // Return bound handlers for external use
  return {
    handleSave,
    handleExecute,
    handleNewWorkflow,
    handleExport,
    handleImport,
    handleDuplicate,
    handleSelectAll,
    handleDeselect,
    handleZoomIn,
    handleZoomOut,
    handleZoomFit,
    handleCommandPalette,
    handleShowShortcuts,
    handleToggleAIChat,
    handleToggleLibrary,
    handleSettings,
  };
}

/**
 * Hook to get the current shortcut binding for display
 */
export function useShortcutBinding(action: ShortcutAction): string | null {
  return useEffectiveBinding(action);
}
