/**
 * Pre-flight validation panel shown before workflow execution
 *
 * Displays validation issues with node-level detail and allows users
 * to fix issues before execution. Errors block execution, while
 * warnings allow "Execute Anyway".
 *
 * Supports quick fixes for certain issues (like format conversion)
 * that can automatically insert nodes to resolve the problem.
 */

import { useEffect, useCallback } from "react";
import type { StudioValidationIssue, QuickFix } from "@teamflojo/floimg-studio-shared";
import { getErrorMessage, getErrorColorClass } from "../utils/errorMessages";
import { useWorkflowStore } from "../stores/workflowStore";

interface ValidationPanelProps {
  issues: StudioValidationIssue[];
  onClose: () => void;
  onExecuteAnyway?: () => void;
  /** Callback when a quick fix is applied */
  onQuickFixApplied?: () => void;
}

export function ValidationPanel({
  issues,
  onClose,
  onExecuteAnyway,
  onQuickFixApplied,
}: ValidationPanelProps) {
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const insertConvertNode = useWorkflowStore((s) => s.insertConvertNode);

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  const hasErrors = errors.length > 0;

  // Handle ESC key to close the panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSelectNode = (nodeId: string | undefined) => {
    if (nodeId) {
      setSelectedNode(nodeId);
      onClose();
    }
  };

  const handleQuickFix = useCallback(
    (quickFix: QuickFix) => {
      if (quickFix.type === "ADD_CONVERT_NODE" && quickFix.sourceNodeId && quickFix.targetNodeId) {
        insertConvertNode(
          quickFix.sourceNodeId,
          quickFix.targetNodeId,
          quickFix.targetFormat || "image/png"
        );
        onQuickFixApplied?.();
        onClose();
      }
    },
    [insertConvertNode, onQuickFixApplied, onClose]
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${hasErrors ? "bg-red-100 dark:bg-red-900/30" : "bg-amber-100 dark:bg-amber-900/30"}`}
            >
              <svg
                className={`w-5 h-5 ${hasErrors ? "text-red-500" : "text-amber-500"}`}
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
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {hasErrors ? "Validation Errors" : "Warnings"}
              </h3>
              <p className="text-sm text-gray-500 dark:text-zinc-400">
                {hasErrors
                  ? `${errors.length} error${errors.length > 1 ? "s" : ""} must be fixed${warnings.length > 0 ? `, ${warnings.length} warning${warnings.length > 1 ? "s" : ""}` : ""}`
                  : `${warnings.length} warning${warnings.length > 1 ? "s" : ""} found`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:text-zinc-500 dark:hover:text-zinc-300"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Issue list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {errors.map((issue, index) => (
            <IssueCard
              key={`error-${index}`}
              issue={issue}
              onSelectNode={handleSelectNode}
              onQuickFix={handleQuickFix}
            />
          ))}
          {warnings.map((issue, index) => (
            <IssueCard
              key={`warning-${index}`}
              issue={issue}
              onSelectNode={handleSelectNode}
              onQuickFix={handleQuickFix}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-300 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600"
          >
            Fix Issues
          </button>
          {!hasErrors && onExecuteAnyway && (
            <button
              onClick={onExecuteAnyway}
              className="px-4 py-2 text-sm font-medium text-white bg-amber-500 rounded-md hover:bg-amber-600"
            >
              Execute Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface IssueCardProps {
  issue: StudioValidationIssue;
  onSelectNode: (nodeId: string | undefined) => void;
  onQuickFix: (quickFix: QuickFix) => void;
}

function IssueCard({ issue, onSelectNode, onQuickFix }: IssueCardProps) {
  const errorMsg = getErrorMessage(issue.code);
  const colors = getErrorColorClass(issue.severity);

  return (
    <div className={`p-3 rounded-lg border ${colors.bg} ${colors.border}`}>
      <div className="flex items-start gap-3">
        <svg
          className={`w-5 h-5 flex-shrink-0 mt-0.5 ${colors.icon}`}
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

        <div className="flex-1 min-w-0">
          <h4 className={`text-sm font-medium ${colors.text}`}>{errorMsg.title}</h4>
          <p className="text-sm text-gray-600 dark:text-zinc-400 mt-0.5">{errorMsg.description}</p>

          {/* Suggested fix - prefer SDK's suggestedFix if available */}
          <p className="text-xs text-gray-500 dark:text-zinc-500 mt-2">
            <span className="font-medium">Fix:</span> {issue.suggestedFix || errorMsg.suggestedFix}
          </p>

          {/* Parameter info if available */}
          {issue.parameterName && (
            <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1">
              Parameter:{" "}
              <code className="bg-gray-100 dark:bg-zinc-700 px-1 rounded">
                {issue.parameterName}
              </code>
            </p>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Quick Fix button - shown when a quick fix is available */}
          {issue.quickFix && (
            <button
              onClick={() => onQuickFix(issue.quickFix!)}
              className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-teal-600 rounded hover:bg-teal-700 transition-colors"
            >
              {issue.quickFix.label}
            </button>
          )}

          {/* Go to node button */}
          {issue.nodeId && (
            <button
              onClick={() => onSelectNode(issue.nodeId)}
              className="flex-shrink-0 px-2 py-1 text-xs font-medium text-gray-600 dark:text-zinc-400 bg-white dark:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded hover:bg-gray-50 dark:hover:bg-zinc-600"
            >
              Edit Node
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
