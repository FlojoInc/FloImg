import { useMemo, useState } from "react";
import type { ExecutionRun } from "../stores/workflowStore";

interface CompareModalProps {
  runs: ExecutionRun[];
  onClose: () => void;
}

export function CompareModal({ runs, onClose }: CompareModalProps) {
  const [selectedOutputIndex, setSelectedOutputIndex] = useState(0);

  // Get the max number of outputs across all runs
  const maxOutputs = useMemo(() => Math.max(...runs.map((r) => r.outputs.length)), [runs]);

  // Get output at index for each run (may be undefined if run has fewer outputs)
  const outputsAtIndex = useMemo(
    () => runs.map((run) => run.outputs[selectedOutputIndex]),
    [runs, selectedOutputIndex]
  );

  // Format duration
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  // Format timestamp
  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-white">
              Compare Executions
            </h2>
            <p className="text-sm text-zinc-500">Side-by-side comparison of {runs.length} runs</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Output selector (if multiple outputs) */}
        {maxOutputs > 1 && (
          <div className="flex items-center gap-2 p-3 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">Output:</span>
            <div className="flex gap-1">
              {Array.from({ length: maxOutputs }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedOutputIndex(i)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedOutputIndex === i
                      ? "bg-teal-600 text-white"
                      : "bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Comparison grid */}
        <div className="flex-1 overflow-auto p-4">
          <div
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${runs.length}, 1fr)` }}
          >
            {runs.map((run, runIndex) => {
              const output = outputsAtIndex[runIndex];
              const isError = run.status === "error";

              return (
                <div
                  key={run.id}
                  className={`rounded-lg border p-3 ${
                    isError
                      ? "border-red-500/30 bg-red-500/5"
                      : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50"
                  }`}
                >
                  {/* Run header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isError ? "bg-red-500" : "bg-emerald-500"
                        }`}
                      />
                      <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        Run {runIndex + 1}
                      </span>
                    </div>
                    <span className="text-xs text-zinc-500">{formatTimestamp(run.timestamp)}</span>
                  </div>

                  {/* Output image */}
                  <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden mb-3">
                    {output ? (
                      <img
                        src={output.preview}
                        alt={output.nodeName}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400">
                        {isError ? "Error" : "No output"}
                      </div>
                    )}
                  </div>

                  {/* Run stats */}
                  <div className="space-y-1 text-xs text-zinc-500">
                    <div className="flex justify-between">
                      <span>Duration</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {formatDuration(run.duration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nodes</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{run.nodeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Outputs</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{run.outputs.length}</span>
                    </div>
                  </div>

                  {/* Error message */}
                  {isError && run.error && (
                    <div className="mt-2 text-xs text-red-600 dark:text-red-400 bg-red-500/10 rounded px-2 py-1 truncate">
                      {run.error}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer with timing comparison */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="text-zinc-500">
              Fastest:{" "}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {formatDuration(Math.min(...runs.map((r) => r.duration)))}
              </span>
            </div>
            <div className="text-zinc-500">
              Slowest:{" "}
              <span className="font-medium text-amber-600 dark:text-amber-400">
                {formatDuration(Math.max(...runs.map((r) => r.duration)))}
              </span>
            </div>
            <div className="text-zinc-500">
              Difference:{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatDuration(
                  Math.max(...runs.map((r) => r.duration)) -
                    Math.min(...runs.map((r) => r.duration))
                )}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
