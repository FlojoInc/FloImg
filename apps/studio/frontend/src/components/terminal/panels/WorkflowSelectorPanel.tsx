import { useWorkflowStore, type SavedWorkflow } from "../../../stores/workflowStore";

interface WorkflowSelectorPanelProps {
  onSelect: (workflow: SavedWorkflow) => void;
  onLoad: (workflow: SavedWorkflow) => void;
  onClose: () => void;
}

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function WorkflowSelectorPanel({ onSelect, onLoad, onClose }: WorkflowSelectorPanelProps) {
  const savedWorkflows = useWorkflowStore((s) => s.savedWorkflows);
  const activeWorkflowId = useWorkflowStore((s) => s.activeWorkflowId);

  // Sort by most recently updated
  const sortedWorkflows = [...savedWorkflows].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-zinc-200 font-medium text-sm">Select Workflow</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
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

      {/* Workflow list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sortedWorkflows.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No saved workflows</div>
        ) : (
          sortedWorkflows.map((workflow) => (
            <div
              key={workflow.id}
              className={`group p-3 rounded-lg border transition-colors cursor-pointer ${
                workflow.id === activeWorkflowId
                  ? "bg-teal-500/10 border-teal-500/30"
                  : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600"
              }`}
              onClick={() => onSelect(workflow)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {workflow.id === activeWorkflowId && (
                      <div className="w-2 h-2 rounded-full bg-teal-500" />
                    )}
                    <h4 className="text-zinc-200 font-medium text-sm truncate">{workflow.name}</h4>
                  </div>
                  <p className="text-zinc-500 text-xs mt-1">
                    {workflow.nodes.length} nodes &middot; {formatTimeAgo(workflow.updatedAt)}
                  </p>
                </div>
              </div>

              {/* Action buttons on hover */}
              <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLoad(workflow);
                  }}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 rounded hover:bg-teal-500/20 transition-colors"
                >
                  Load to Canvas
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(workflow);
                  }}
                  className="flex-1 px-2 py-1.5 text-xs font-medium text-zinc-400 bg-zinc-700/50 rounded hover:bg-zinc-700 transition-colors"
                >
                  Select
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <p className="text-zinc-600 text-xs">
          Click a workflow to select it, or use action buttons
        </p>
      </div>
    </div>
  );
}
