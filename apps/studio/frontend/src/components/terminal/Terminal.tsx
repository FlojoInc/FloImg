import { useCallback } from "react";
import { useTerminalStore } from "../../stores/terminalStore";
import { useWorkflowStore } from "../../stores/workflowStore";
import { TerminalFeed } from "./TerminalFeed";
import { TerminalInput } from "./TerminalInput";
import { WorkflowSelectorPanel } from "./panels/WorkflowSelectorPanel";
import { ImageSelectorPanel } from "./panels/ImageSelectorPanel";
import type { SavedWorkflow } from "../../stores/workflowStore";
import type { GeneratedWorkflowData } from "@teamflojo/floimg-studio-shared";

interface TerminalProps {
  onApplyWorkflow?: (workflow: GeneratedWorkflowData) => void;
}

export function Terminal({ onApplyWorkflow }: TerminalProps) {
  const activePanel = useTerminalStore((s) => s.activePanel);
  const closePanel = useTerminalStore((s) => s.closePanel);
  const addMessage = useTerminalStore((s) => s.addMessage);
  const loadWorkflow = useWorkflowStore((s) => s.loadWorkflow);

  // Handle workflow selection from panel
  const handleWorkflowSelect = useCallback(
    (workflow: SavedWorkflow) => {
      addMessage({
        type: "system",
        content: `Selected workflow: **${workflow.name}** (${workflow.nodes.length} nodes)`,
      });
      closePanel();
    },
    [addMessage, closePanel]
  );

  // Handle image selection from panel
  const handleImageSelect = useCallback(
    (image: { id: string; filename: string }) => {
      addMessage({
        type: "system",
        content: `Selected image: ${image.filename}`,
        metadata: { imageIds: [image.id] },
      });
      closePanel();
    },
    [addMessage, closePanel]
  );

  // Handle loading workflow to canvas
  const handleLoadWorkflowToCanvas = useCallback(
    (workflow: SavedWorkflow) => {
      loadWorkflow(workflow.id);
      addMessage({
        type: "system",
        content: `Loaded **${workflow.name}** to canvas. Switch to Editor tab to view.`,
      });
      closePanel();
    },
    [loadWorkflow, addMessage, closePanel]
  );

  return (
    <div className="flex h-full">
      {/* Main terminal area */}
      <div className="flex-1 flex flex-col bg-zinc-950">
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
            </div>
            <span className="text-zinc-400 text-sm font-medium">FloImg Terminal</span>
            <span className="text-zinc-600 text-xs">Type /help for commands</span>
          </div>
        </div>

        {/* Message feed */}
        <TerminalFeed />

        {/* Input area */}
        <TerminalInput onApplyWorkflow={onApplyWorkflow} />
      </div>

      {/* Slide-out panels */}
      {activePanel === "workflow" && (
        <WorkflowSelectorPanel
          onSelect={handleWorkflowSelect}
          onLoad={handleLoadWorkflowToCanvas}
          onClose={closePanel}
        />
      )}
      {activePanel === "image" && (
        <ImageSelectorPanel onSelect={handleImageSelect} onClose={closePanel} />
      )}
    </div>
  );
}
