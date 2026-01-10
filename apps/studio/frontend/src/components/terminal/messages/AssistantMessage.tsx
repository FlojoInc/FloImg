import type { GeneratedWorkflowData } from "../../../stores/terminalStore";
import { useWorkflowStore } from "../../../stores/workflowStore";
import { useTerminalStore } from "../../../stores/terminalStore";

interface AssistantMessageProps {
  content: string;
  workflowData?: GeneratedWorkflowData;
  isStreaming?: boolean;
}

export function AssistantMessage({ content, workflowData, isStreaming }: AssistantMessageProps) {
  const loadGeneratedWorkflow = useWorkflowStore((s) => s.loadGeneratedWorkflow);
  const addMessage = useTerminalStore((s) => s.addMessage);

  const handleApplyWorkflow = () => {
    if (workflowData) {
      loadGeneratedWorkflow(workflowData as any);
      addMessage({
        type: "system",
        content: "Workflow applied to canvas. Switch to **Editor** tab to view and execute.",
      });
    }
  };

  // Parse markdown-like formatting (bold with **)
  const formatContent = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="text-zinc-100 font-semibold">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%]">
        <div className="flex items-start gap-2">
          {/* AI avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center flex-shrink-0 mt-1">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>

          <div className="flex-1">
            {/* Message content */}
            <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-2xl rounded-tl-md px-4 py-3 text-zinc-300 text-sm whitespace-pre-wrap">
              {formatContent(content)}
              {isStreaming && (
                <span className="inline-block w-2 h-4 bg-teal-500 ml-1 animate-pulse" />
              )}
            </div>

            {/* Workflow preview and apply button */}
            {workflowData && (
              <div className="mt-2 p-3 bg-zinc-800 border border-zinc-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-zinc-400">Generated Workflow</span>
                  <span className="text-xs text-zinc-500">
                    {workflowData.nodes?.length || 0} nodes
                  </span>
                </div>
                <button
                  onClick={handleApplyWorkflow}
                  className="w-full px-3 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-500 transition-colors"
                >
                  Apply to Canvas
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
