import { useState, useCallback } from "react";
import type {
  OperationConflict,
  ConflictResolution,
  ResolvedConflict,
} from "@teamflojo/floimg-studio-shared";

interface ConflictResolutionModalProps {
  conflicts: OperationConflict[];
  onResolve: (resolved: ResolvedConflict[]) => void;
  onCancel: () => void;
}

/**
 * Modal for resolving conflicts between user edits and AI operations.
 * Shows each conflict with options to keep user's changes, accept AI's changes, or skip.
 */
export function ConflictResolutionModal({
  conflicts,
  onResolve,
  onCancel,
}: ConflictResolutionModalProps) {
  // Track resolution choice for each conflict
  const [resolutions, setResolutions] = useState<Record<number, ConflictResolution>>(() => {
    // Default all to "keep_mine"
    const initial: Record<number, ConflictResolution> = {};
    conflicts.forEach((_, i) => {
      initial[i] = "keep_mine";
    });
    return initial;
  });

  const setResolution = useCallback((index: number, resolution: ConflictResolution) => {
    setResolutions((prev) => ({ ...prev, [index]: resolution }));
  }, []);

  const setAllResolutions = useCallback(
    (resolution: ConflictResolution) => {
      const newResolutions: Record<number, ConflictResolution> = {};
      conflicts.forEach((_, i) => {
        newResolutions[i] = resolution;
      });
      setResolutions(newResolutions);
    },
    [conflicts]
  );

  const handleApply = useCallback(() => {
    const resolved: ResolvedConflict[] = conflicts.map((conflict, i) => ({
      conflict,
      resolution: resolutions[i] || "keep_mine",
    }));
    onResolve(resolved);
  }, [conflicts, resolutions, onResolve]);

  const getConflictIcon = (conflict: OperationConflict) => {
    switch (conflict.type) {
      case "modified_by_both":
        return (
          <svg
            className="h-5 w-5 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        );
      case "deleted_by_ai":
        return (
          <svg
            className="h-5 w-5 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
            />
          </svg>
        );
      case "deleted_by_user":
        return (
          <svg
            className="h-5 w-5 text-orange-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "reconnect_conflict":
        return (
          <svg
            className="h-5 w-5 text-blue-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
        );
    }
  };

  const getConflictTypeLabel = (type: OperationConflict["type"]) => {
    switch (type) {
      case "modified_by_both":
        return "Both modified";
      case "deleted_by_ai":
        return "AI wants to delete";
      case "deleted_by_user":
        return "You deleted";
      case "reconnect_conflict":
        return "Reconnection conflict";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
                Resolve Conflicts
              </h2>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {conflicts.length} conflict{conflicts.length !== 1 ? "s" : ""} detected between your
                edits and AI changes
              </p>
            </div>
          </div>
        </div>

        {/* Bulk actions */}
        <div className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-700 flex gap-2">
          <button
            onClick={() => setAllResolutions("keep_mine")}
            className="text-sm px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-300 rounded transition-colors"
          >
            Keep all mine
          </button>
          <button
            onClick={() => setAllResolutions("accept_ai")}
            className="text-sm px-3 py-1.5 bg-teal-100 dark:bg-teal-900/30 hover:bg-teal-200 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 rounded transition-colors"
          >
            Accept all AI
          </button>
          <button
            onClick={() => setAllResolutions("skip")}
            className="text-sm px-3 py-1.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-500 dark:text-zinc-400 rounded transition-colors"
          >
            Skip all
          </button>
        </div>

        {/* Conflict list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {conflicts.map((conflict, index) => (
            <div key={index} className="border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                {getConflictIcon(conflict)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium px-2 py-0.5 bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400 rounded">
                      {getConflictTypeLabel(conflict.type)}
                    </span>
                    <span className="text-sm font-medium text-zinc-900 dark:text-white">
                      {conflict.nodeId}
                    </span>
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{conflict.description}</p>
                </div>
              </div>

              {/* Show value comparison for modified_by_both */}
              {conflict.type === "modified_by_both" && (
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded p-2">
                    <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                      Your changes
                    </div>
                    <pre className="text-xs text-zinc-700 dark:text-zinc-300 overflow-x-auto">
                      {JSON.stringify(conflict.userValue, null, 2)}
                    </pre>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded p-2">
                    <div className="text-xs font-medium text-teal-600 dark:text-teal-400 mb-1">
                      AI changes
                    </div>
                    <pre className="text-xs text-teal-700 dark:text-teal-300 overflow-x-auto">
                      {JSON.stringify(conflict.aiValue, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Resolution options */}
              <div className="flex gap-2">
                <button
                  onClick={() => setResolution(index, "keep_mine")}
                  className={`flex-1 text-sm px-3 py-2 rounded border transition-colors ${
                    resolutions[index] === "keep_mine"
                      ? "border-zinc-500 bg-zinc-100 dark:bg-zinc-700 text-zinc-900 dark:text-white"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  Keep mine
                </button>
                <button
                  onClick={() => setResolution(index, "accept_ai")}
                  className={`flex-1 text-sm px-3 py-2 rounded border transition-colors ${
                    resolutions[index] === "accept_ai"
                      ? "border-teal-500 bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-teal-300 dark:hover:border-teal-600"
                  }`}
                >
                  Accept AI
                </button>
                <button
                  onClick={() => setResolution(index, "skip")}
                  className={`text-sm px-3 py-2 rounded border transition-colors ${
                    resolutions[index] === "skip"
                      ? "border-zinc-400 bg-zinc-100 dark:bg-zinc-700 text-zinc-500 dark:text-zinc-400"
                      : "border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-zinc-300 dark:hover:border-zinc-600"
                  }`}
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-700 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 text-sm font-medium bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
          >
            Apply Resolutions
          </button>
        </div>
      </div>
    </div>
  );
}
