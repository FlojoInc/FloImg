import { useState } from "react";
import { useWorkflowStore, type SavedWorkflow } from "../stores/workflowStore";

interface WorkflowItemProps {
  workflow: SavedWorkflow;
  isActive: boolean;
  onLoad: () => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onDuplicate: () => void;
}

function WorkflowItem({
  workflow,
  isActive,
  onLoad,
  onDelete,
  onRename,
  onDuplicate,
}: WorkflowItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workflow.name);
  const [showMenu, setShowMenu] = useState(false);

  const handleRename = () => {
    if (editName.trim() && editName !== workflow.name) {
      onRename(editName.trim());
    }
    setIsEditing(false);
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={`group relative p-3 rounded-lg border transition-colors ${
        isActive
          ? "bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800"
          : "bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={onLoad} className="flex-1 text-left min-w-0">
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRename();
                if (e.key === "Escape") {
                  setEditName(workflow.name);
                  setIsEditing(false);
                }
              }}
              className="w-full px-1 py-0.5 text-sm font-medium bg-white dark:bg-zinc-900 border border-teal-500 rounded focus:outline-none focus:ring-1 focus:ring-teal-500"
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
              {workflow.name}
            </span>
          )}
          <span className="block text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {workflow.nodes.length} nodes · Updated {formatDate(workflow.updatedAt)}
          </span>
        </button>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 py-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDuplicate();
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Duplicate
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Delete this workflow?")) {
                      onDelete();
                    }
                    setShowMenu(false);
                  }}
                  className="w-full px-3 py-1.5 text-left text-sm text-red-600 dark:text-red-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {isActive && <span className="absolute top-2 right-2 w-2 h-2 bg-teal-500 rounded-full" />}
    </div>
  );
}

export function WorkflowLibrary() {
  const showLibrary = useWorkflowStore((s) => s.showLibrary);
  const toggleLibrary = useWorkflowStore((s) => s.toggleLibrary);
  const savedWorkflows = useWorkflowStore((s) => s.savedWorkflows);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow);
  const deleteWorkflow = useWorkflowStore((s) => s.deleteWorkflow);
  const renameWorkflow = useWorkflowStore((s) => s.renameWorkflow);
  const duplicateWorkflow = useWorkflowStore((s) => s.duplicateWorkflow);
  const newWorkflow = useWorkflowStore((s) => s.newWorkflow);

  if (!showLibrary) return null;

  // Sort by most recently updated
  const sortedWorkflows = [...savedWorkflows].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-40" onClick={toggleLibrary} />

      {/* Panel */}
      <div className="fixed left-0 top-0 bottom-0 w-80 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-700 z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">My Workflows</h2>
          <button
            onClick={toggleLibrary}
            className="p-1 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 rounded"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* New Workflow Button */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-700">
          <button
            onClick={() => {
              newWorkflow();
              toggleLibrary();
              window.dispatchEvent(new window.CustomEvent("new-workflow-created"));
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Workflow
          </button>
        </div>

        {/* Workflow List */}
        <div className="flex-1 overflow-y-auto p-4">
          {sortedWorkflows.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">No saved workflows yet</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                Build a workflow and save it to see it here
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedWorkflows.map((workflow) => (
                <WorkflowItem
                  key={workflow.id}
                  workflow={workflow}
                  isActive={workflow.id === activeWorkflowId}
                  onLoad={() => {
                    loadWorkflow(workflow.id);
                    toggleLibrary();
                  }}
                  onDelete={() => deleteWorkflow(workflow.id)}
                  onRename={(name) => renameWorkflow(workflow.id, name)}
                  onDuplicate={() => duplicateWorkflow(workflow.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-500 dark:text-zinc-400">
          {savedWorkflows.length} workflow{savedWorkflows.length !== 1 ? "s" : ""} saved locally
        </div>
      </div>
    </>
  );
}
