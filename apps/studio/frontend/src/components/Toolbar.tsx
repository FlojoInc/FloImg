import { useState, useEffect, useCallback, type ReactNode } from "react";
import { useShortcutBinding } from "../lib/keyboard/useKeyboardShortcuts";
import { bindingToDisplay } from "../lib/keyboard/platformUtils";
import { useWorkflowStore } from "../stores/workflowStore";
import { useSettingsStore } from "../stores/settingsStore";
import { generateJavaScript } from "../utils/codeGenerator";
import { ImportModal } from "./ImportModal";
import { ValidationPanel } from "./ValidationPanel";
import type { StudioNode, StudioEdge } from "@teamflojo/floimg-studio-shared";

type ExportTab = "yaml" | "javascript";

/**
 * Props for the Toolbar component.
 * All props are optional to maintain backward compatibility.
 */
export interface ToolbarProps {
  /** Slot rendered after the branding text (e.g., "Cloud" badge) */
  brandingSlot?: ReactNode;
  /** Slot rendered before the action buttons (e.g., usage counter) */
  beforeActionsSlot?: ReactNode;
  /** Slot rendered after all action buttons (e.g., auth/user menu) */
  afterActionsSlot?: ReactNode;
  /** Slot rendered below the toolbar for remix/fork attribution banners */
  remixInfoSlot?: ReactNode;
  /** Hide the "by Flojo" attribution link */
  hideAttribution?: boolean;
  /** Hide the "My Workflows" library toggle button (for wrappers providing custom workflow management) */
  hideWorkflowLibrary?: boolean;
}

export function Toolbar({
  brandingSlot,
  beforeActionsSlot,
  afterActionsSlot,
  remixInfoSlot,
  hideAttribution = false,
  hideWorkflowLibrary = false,
}: ToolbarProps = {}) {
  const execution = useWorkflowStore((s) => s.execution);
  const execute = useWorkflowStore((s) => s.execute);
  const executeWithValidation = useWorkflowStore((s) => s.executeWithValidation);
  const cancelExecution = useWorkflowStore((s) => s.cancelExecution);
  const exportToYaml = useWorkflowStore((s) => s.exportToYaml);
  const importFromYaml = useWorkflowStore((s) => s.importFromYaml);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const openSettings = useSettingsStore((s) => s.openSettings);
  const preflightValidation = useWorkflowStore((s) => s.preflightValidation);
  const hideValidationPanel = useWorkflowStore((s) => s.hideValidationPanel);

  // Workflow persistence state
  const activeWorkflowName = useWorkflowStore((s) => s.activeWorkflowName);
  const hasUnsavedChanges = useWorkflowStore((s) => s.hasUnsavedChanges);
  const saveWorkflow = useWorkflowStore((s) => s.saveWorkflow);
  const toggleLibrary = useWorkflowStore((s) => s.toggleLibrary);
  const setActiveWorkflowName = useWorkflowStore((s) => s.setActiveWorkflowName);

  // Get shortcut bindings for tooltip hints
  const saveShortcut = useShortcutBinding("save");

  const [showExport, setShowExport] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [exportTab, setExportTab] = useState<ExportTab>("yaml");
  const [yamlContent, setYamlContent] = useState("");
  const [jsContent, setJsContent] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState("");

  // Listen for new workflow event
  useEffect(() => {
    const handleNewWorkflow = () => {
      setNotification("New workflow created");
      setTimeout(() => setNotification(null), 2000);
    };
    window.addEventListener("new-workflow-created", handleNewWorkflow);
    return () => window.removeEventListener("new-workflow-created", handleNewWorkflow);
  }, []);

  // Handle save with Cmd+S / Ctrl+S
  const handleSave = useCallback(() => {
    if (nodes.length === 0) return;
    saveWorkflow();
    setNotification("Saved!");
    setTimeout(() => setNotification(null), 2000);
  }, [nodes.length, saveWorkflow]);

  // Handle inline rename
  const handleStartRename = () => {
    setEditingName(activeWorkflowName);
    setIsEditingName(true);
  };

  const handleSaveRename = () => {
    const trimmed = editingName.trim();
    if (trimmed && trimmed !== activeWorkflowName) {
      setActiveWorkflowName(trimmed);
    }
    setIsEditingName(false);
  };

  const handleExecute = async () => {
    await executeWithValidation();
  };

  const handleExecuteAnyway = async () => {
    hideValidationPanel();
    await execute();
  };

  const handleExport = async () => {
    const yaml = await exportToYaml();
    setYamlContent(yaml);
    const js = generateJavaScript(nodes, edges);
    setJsContent(js);
    setShowExport(true);
  };

  const handleCopy = () => {
    const content = exportTab === "yaml" ? yamlContent : jsContent;
    navigator.clipboard.writeText(content);
  };

  const handleImport = useCallback(
    (importedNodes: StudioNode[], importedEdges: StudioEdge[], name?: string) => {
      importFromYaml(importedNodes, importedEdges, name);
      setNotification("Workflow imported!");
      setTimeout(() => setNotification(null), 2000);
    },
    [importFromYaml]
  );

  return (
    <>
      <div className="floimg-toolbar h-14 flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* My Workflows button - can be hidden when custom workflow management is provided */}
          {!hideWorkflowLibrary && (
            <button onClick={toggleLibrary} className="floimg-toolbar__btn" title="My Workflows">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h7"
                />
              </svg>
            </button>
          )}

          <div className="flex items-baseline gap-2">
            <h1 className="floimg-toolbar__title">FloImg Studio</h1>
            {brandingSlot}
            {!hideAttribution && (
              <a
                href="https://goflojo.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300"
              >
                by Flojo
              </a>
            )}
          </div>

          {/* Workflow name and status - click to rename */}
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <input
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={handleSaveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveRename();
                  if (e.key === "Escape") {
                    setEditingName(activeWorkflowName);
                    setIsEditingName(false);
                  }
                }}
                className="w-48 px-2 py-1 text-sm font-medium bg-white dark:bg-zinc-900 border border-teal-500 rounded focus:outline-none focus:ring-1 focus:ring-teal-500 text-gray-900 dark:text-zinc-100"
                autoFocus
              />
            ) : (
              <button
                onClick={handleStartRename}
                className="text-sm text-gray-700 dark:text-zinc-300 font-medium hover:text-gray-900 dark:hover:text-zinc-100 rounded px-2 py-1 -mx-2 hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors"
                title="Click to rename"
              >
                {activeWorkflowName}
              </button>
            )}
            {hasUnsavedChanges && (
              <span className="text-xs text-amber-600 dark:text-amber-400">(unsaved)</span>
            )}
            {notification && (
              <span className="text-xs text-green-600 dark:text-green-400">{notification}</span>
            )}
          </div>

          <span className="text-sm text-gray-500 dark:text-zinc-400">
            {nodes.length} node{nodes.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {beforeActionsSlot}
          <button onClick={openSettings} className="floimg-toolbar__btn" title="AI Settings">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>

          {/* Save button */}
          <button
            onClick={handleSave}
            disabled={nodes.length === 0}
            className="floimg-toolbar__btn disabled:opacity-50 disabled:cursor-not-allowed"
            title={`Save Workflow${saveShortcut ? ` (${bindingToDisplay(saveShortcut)})` : ""}`}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
          </button>

          <button onClick={() => setShowImport(true)} className="floimg-toolbar__btn-secondary">
            Import
          </button>

          <button
            onClick={handleExport}
            disabled={nodes.length === 0}
            className="floimg-toolbar__btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Export
          </button>

          {execution.status === "running" ? (
            <button
              onClick={cancelExecution}
              className="floimg-toolbar__btn-primary !bg-red-500 hover:!bg-red-600 flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Cancel
            </button>
          ) : (
            <button
              onClick={handleExecute}
              disabled={nodes.length === 0}
              className="floimg-toolbar__btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Execute
            </button>
          )}
          {afterActionsSlot}
        </div>
      </div>

      {/* Remix/fork attribution slot (injected by cloud wrapper) */}
      {remixInfoSlot}

      {execution.status === "error" && (
        <div className="bg-red-50 dark:bg-red-900/30 border-b border-red-200 dark:border-red-800 px-4 py-3">
          <span className="text-red-700 dark:text-red-400">Error: {execution.error}</span>
        </div>
      )}

      {/* Export modal with tabs */}
      {showExport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
              <div className="flex items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Export Workflow
                </h3>
                {/* Tabs */}
                <div className="flex gap-1 bg-gray-100 dark:bg-zinc-700 rounded-lg p-1">
                  <button
                    onClick={() => setExportTab("yaml")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      exportTab === "yaml"
                        ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    YAML
                  </button>
                  <button
                    onClick={() => setExportTab("javascript")}
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                      exportTab === "javascript"
                        ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    JavaScript
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowExport(false)}
                className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1">
              <pre className="bg-gray-100 dark:bg-zinc-900 p-4 rounded text-sm font-mono whitespace-pre-wrap text-gray-800 dark:text-zinc-200">
                {exportTab === "yaml" ? yamlContent : jsContent}
              </pre>
            </div>
            <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                {exportTab === "yaml"
                  ? "Use with floimg CLI: floimg run workflow.yaml"
                  : "Run with Node.js or Bun"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setShowExport(false)}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import modal */}
      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
      />

      {/* Validation panel */}
      {preflightValidation.show && (
        <ValidationPanel
          issues={preflightValidation.issues}
          onClose={hideValidationPanel}
          onExecuteAnyway={handleExecuteAnyway}
        />
      )}
    </>
  );
}
