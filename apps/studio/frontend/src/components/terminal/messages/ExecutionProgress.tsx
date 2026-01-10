import type { ExecutionStepResult } from "@teamflojo/floimg-studio-shared";

type StepStatus = ExecutionStepResult["status"];

interface ExecutionProgressProps {
  nodeStatuses?: Record<string, StepStatus>;
  totalNodes?: number;
  completedNodes?: number;
}

function StatusIcon({ status }: { status: StepStatus }) {
  switch (status) {
    case "running":
      return (
        <svg className="w-4 h-4 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      );
    case "completed":
      return (
        <svg
          className="w-4 h-4 text-emerald-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    case "error":
      return (
        <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      );
    default:
      return <div className="w-4 h-4 rounded-full border-2 border-zinc-600" />;
  }
}

export function ExecutionProgress({
  nodeStatuses = {},
  totalNodes = 0,
  completedNodes = 0,
}: ExecutionProgressProps) {
  const isComplete = completedNodes === totalNodes && totalNodes > 0;
  const progressPercent = totalNodes > 0 ? (completedNodes / totalNodes) * 100 : 0;

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] w-full">
        <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-4">
          {/* Header */}
          <div className="flex items-center gap-2 mb-3">
            {!isComplete ? (
              <svg className="w-5 h-5 text-amber-500 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
            <span className="text-zinc-300 font-medium text-sm">
              {isComplete ? "Execution Complete" : "Executing Workflow..."}
            </span>
            <span className="text-zinc-500 text-xs ml-auto">
              {completedNodes}/{totalNodes} nodes
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Node status list */}
          {Object.keys(nodeStatuses).length > 0 && (
            <div className="space-y-1.5 font-mono text-xs">
              {Object.entries(nodeStatuses).map(([nodeId, status]) => (
                <div key={nodeId} className="flex items-center gap-2 text-zinc-400">
                  <StatusIcon status={status} />
                  <span className="truncate">{nodeId.split("-").slice(0, 2).join("-")}</span>
                  <span className="text-zinc-600 ml-auto">{status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
