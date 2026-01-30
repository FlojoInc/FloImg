import { useMemo, useState } from "react";
import { useWorkflowStore, type ExecutionRun } from "../stores/workflowStore";
import { ExecutionResultsModal } from "./ExecutionResultsModal";

interface ExecutionHistoryProps {
  /** Whether this is a guest user (shows ephemeral notice) */
  isGuest?: boolean;
  /** Optional sign-up URL for guest notice CTA */
  signUpUrl?: string;
  /** Optional callback when user wants to share a run (for FSC showcase integration) */
  onShare?: (run: ExecutionRun) => void;
}

export function ExecutionHistory({ isGuest = false, signUpUrl, onShare }: ExecutionHistoryProps) {
  const executionHistory = useWorkflowStore((s) => s.executionHistory);
  const clearHistory = useWorkflowStore((s) => s.clearHistory);
  const [selectedRun, setSelectedRun] = useState<ExecutionRun | null>(null);

  if (executionHistory.length === 0) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
        <div className="text-lg mb-2">No execution history yet</div>
        <div className="text-sm">Run a workflow to see results here</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-zinc-100 dark:bg-zinc-900 min-h-full">
      {/* Guest ephemeral notice */}
      {isGuest && (
        <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <svg
              className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-amber-700 dark:text-amber-400">
                Temporary History
              </div>
              <div className="text-sm text-amber-600/80 dark:text-amber-400/70 mt-0.5">
                Your execution history will be lost when you close this tab.
              </div>
              {signUpUrl && (
                <a
                  href={signUpUrl}
                  className="inline-block mt-2 px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700"
                >
                  Sign Up Free
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-white">
            History ({executionHistory.length})
          </h2>
          <p className="text-xs text-zinc-500">Past workflow runs</p>
        </div>
        <button
          onClick={clearHistory}
          className="text-sm text-zinc-500 hover:text-red-600 dark:hover:text-red-400"
        >
          Clear All
        </button>
      </div>

      {/* History list */}
      <div className="space-y-3">
        {executionHistory.map((run) => (
          <ExecutionRunCard
            key={run.id}
            run={run}
            onShare={onShare}
            onClick={() => setSelectedRun(run)}
          />
        ))}
      </div>

      {/* Results modal */}
      {selectedRun && (
        <ExecutionResultsModal run={selectedRun} onClose={() => setSelectedRun(null)} />
      )}
    </div>
  );
}

interface ExecutionRunCardProps {
  run: ExecutionRun;
  onShare?: (run: ExecutionRun) => void;
  onClick?: () => void;
}

function ExecutionRunCard({ run, onShare, onClick }: ExecutionRunCardProps) {
  const isError = run.status === "error";

  // Format timestamp as localized time string (avoids impure Date.now() call)
  const formattedTimestamp = useMemo(() => {
    return new Date(run.timestamp).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }, [run.timestamp]);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-lg border p-3 cursor-pointer transition-colors ${
        isError
          ? "border-red-500/20 bg-red-500/5 hover:bg-red-500/10"
          : "border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Status icon */}
          {isError ? (
            <svg
              className="w-4 h-4 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          ) : (
            <svg
              className="w-4 h-4 text-emerald-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
          <span className="text-sm font-medium text-zinc-800 dark:text-white">
            {isError ? "Failed" : "Completed"}
          </span>
        </div>
        <span className="text-xs text-zinc-500">{formattedTimestamp}</span>
      </div>

      {/* Error message */}
      {isError && run.error && (
        <div className="mb-2 text-sm text-red-600 dark:text-red-400 bg-red-500/10 rounded px-2 py-1">
          {run.error}
        </div>
      )}

      {/* Thumbnails */}
      {run.outputs.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto pb-1">
          {run.outputs.map((output) => (
            <div key={output.nodeId} className="flex-shrink-0">
              <img
                src={output.preview}
                alt={output.nodeName}
                className="w-16 h-16 rounded object-cover border border-zinc-200 dark:border-zinc-700"
                title={output.nodeName}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-zinc-500">
        <span>
          {run.outputs.length} {run.outputs.length === 1 ? "output" : "outputs"} &bull;{" "}
          {formatDuration(run.duration)}
        </span>
        <div className="flex items-center gap-2">
          <span>{run.nodeCount} nodes</span>
          {/* Share button - only shown for successful runs when onShare is provided */}
          {onShare && !isError && run.outputs.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(run);
              }}
              className="px-2 py-1 text-xs bg-teal-600 text-white rounded hover:bg-teal-700"
            >
              Share
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
