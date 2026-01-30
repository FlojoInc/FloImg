import { useState, useCallback, useEffect, DragEvent } from "react";
import { ReactFlowProvider, useReactFlow } from "reactflow";
import { WorkflowEditor } from "./editor/WorkflowEditor";
import { NodePalette } from "./components/NodePalette";
import { NodeInspector } from "./components/NodeInspector";
import { Toolbar } from "./components/Toolbar";
import { ExecutionHistory } from "./components/ExecutionHistory";
import { TemplateGallery } from "./components/TemplateGallery";
import { WorkflowLibrary } from "./components/WorkflowLibrary";
import { AISettings } from "./components/AISettings";
import { AIChat } from "./components/AIChat";
import { OutputInspector } from "./components/OutputInspector";
import { CommandPalette } from "./components/CommandPalette";
import { KeyboardShortcutsModal } from "./components/KeyboardShortcutsModal";
import { ConfirmationDialog } from "./components/ConfirmationDialog";
import { useKeyboardShortcuts } from "./lib/keyboard/useKeyboardShortcuts";
import { useWorkflowStore } from "./stores/workflowStore";
import { useSettingsStore } from "./stores/settingsStore";
import type {
  NodeDefinition,
  GeneratedWorkflowData,
  Template,
} from "@teamflojo/floimg-studio-shared";

// Default API URL for template fetching
const API_URL = import.meta.env.VITE_FLOIMG_API_URL || "https://api.floimg.com";

// KeyboardShortcutsProvider - registers global keyboard shortcuts
// Must be inside ReactFlowProvider to access useReactFlow hook
function KeyboardShortcutsProvider({ onToggleAIChat }: { onToggleAIChat: () => void }) {
  useKeyboardShortcuts({ onToggleAIChat });
  return null;
}

// EditorDropZone - handles node drops with correct coordinate conversion
// Must be inside ReactFlowProvider to access useReactFlow hook
function EditorDropZone() {
  const { screenToFlowPosition } = useReactFlow();
  const addNode = useWorkflowStore((s) => s.addNode);

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const data = event.dataTransfer.getData("application/json");
      if (!data) return;

      try {
        const definition: NodeDefinition = JSON.parse(data);

        // Use screenToFlowPosition to correctly convert screen coordinates
        // to flow coordinates, accounting for zoom and pan
        const position = screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });

        addNode(definition, position);
      } catch (e) {
        console.error("Failed to parse dropped node:", e);
      }
    },
    [addNode, screenToFlowPosition]
  );

  const handleDragOver = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <div className="flex-1" onDrop={handleDrop} onDragOver={handleDragOver}>
      <WorkflowEditor />
    </div>
  );
}

type TabType = "editor" | "history" | "templates";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [showAIChat, setShowAIChat] = useState(false);
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const loadGeneratedWorkflow = useWorkflowStore((s) => s.loadGeneratedWorkflow);
  const loadRemixImage = useWorkflowStore((s) => s.loadRemixImage);

  // Output inspector state
  const inspectedNodeId = useWorkflowStore((s) => s.inspectedNodeId);
  const executionDataOutputs = useWorkflowStore((s) => s.execution.dataOutputs);
  const closeOutputInspector = useWorkflowStore((s) => s.closeOutputInspector);
  const nodes = useWorkflowStore((s) => s.nodes);
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);

  // Get inspected node info
  const inspectedNode = inspectedNodeId ? nodes.find((n) => n.id === inspectedNodeId) : null;
  const inspectedOutput = inspectedNodeId ? executionDataOutputs[inspectedNodeId] : null;

  // Handle URL parameters: ?template=<id>, ?remixImage=<url>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template");
    const remixImageUrl = params.get("remixImage");

    if (templateId) {
      // Fetch template from API
      (async () => {
        try {
          const res = await fetch(`${API_URL}/api/templates/${templateId}`);
          if (res.ok) {
            const data = await res.json();
            const template = data.template as Template;
            loadTemplate(template);
          }
        } catch {
          // Silently fail - user stays on empty canvas
        }
        window.history.replaceState({}, "", window.location.pathname);
      })();
    } else if (remixImageUrl) {
      loadRemixImage(remixImageUrl);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [loadTemplate, loadRemixImage]);

  // Listen for workflow-loaded event (from Gallery)
  useEffect(() => {
    const handleWorkflowLoaded = () => {
      setActiveTab("editor");
    };
    window.addEventListener("workflow-loaded", handleWorkflowLoaded);
    return () => {
      window.removeEventListener("workflow-loaded", handleWorkflowLoaded);
    };
  }, []);

  // Handler for template selection - fetches from API
  const handleTemplateSelect = useCallback(
    async (templateId: string) => {
      try {
        const res = await fetch(`${API_URL}/api/templates/${templateId}`);
        if (res.ok) {
          const data = await res.json();
          const template = data.template as Template;
          loadTemplate(template);
          setActiveTab("editor");
        }
      } catch {
        // Silently fail
      }
    },
    [loadTemplate]
  );

  // Handler for AI-generated workflow
  const handleApplyWorkflow = useCallback(
    (workflow: GeneratedWorkflowData) => {
      loadGeneratedWorkflow(workflow);
      setActiveTab("editor");
    },
    [loadGeneratedWorkflow]
  );

  // Toggle AI chat handler for keyboard shortcuts
  const handleToggleAIChat = useCallback(() => {
    setShowAIChat((prev) => !prev);
  }, []);

  // New workflow confirmation dialog
  const showNewWorkflowConfirm = useSettingsStore((s) => s.showNewWorkflowConfirm);
  const confirmNewWorkflow = useSettingsStore((s) => s.confirmNewWorkflow);
  const cancelNewWorkflow = useSettingsStore((s) => s.cancelNewWorkflow);

  return (
    <ReactFlowProvider>
      {/* Global Keyboard Shortcuts - must be inside ReactFlowProvider */}
      <KeyboardShortcutsProvider onToggleAIChat={handleToggleAIChat} />

      {/* Command Palette (Cmd+K) */}
      <CommandPalette onToggleAIChat={handleToggleAIChat} />

      {/* Keyboard Shortcuts Help Modal (Cmd+?) */}
      <KeyboardShortcutsModal />

      {/* New Workflow Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showNewWorkflowConfirm}
        title="Unsaved Changes"
        message="You have unsaved changes. Creating a new workflow will discard them. Are you sure you want to continue?"
        confirmText="Create New"
        cancelText="Keep Editing"
        onConfirm={confirmNewWorkflow}
        onCancel={cancelNewWorkflow}
        destructive
      />

      {/* AI Settings Modal */}
      <AISettings />

      {/* AI Chat Modal */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onApplyWorkflow={handleApplyWorkflow}
      />

      {/* Output Inspector Modal */}
      {inspectedNode && inspectedOutput && (
        <OutputInspector
          isOpen={true}
          onClose={closeOutputInspector}
          nodeId={inspectedNodeId!}
          nodeLabel={
            (inspectedNode.data as { providerLabel?: string }).providerLabel ||
            inspectedNode.type ||
            "Node"
          }
          output={inspectedOutput}
        />
      )}

      {/* Workflow Library slide-out panel */}
      <WorkflowLibrary />

      <div className="floimg-studio h-screen flex flex-col bg-gray-100 dark:bg-zinc-900">
        <Toolbar />

        {/* Tab navigation */}
        <div className="floimg-tabs">
          <div className="flex items-center justify-between">
            <div className="flex">
              <button
                onClick={() => setActiveTab("editor")}
                className={`floimg-tab ${activeTab === "editor" ? "floimg-tab--active" : ""}`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab("history")}
                className={`floimg-tab ${activeTab === "history" ? "floimg-tab--active" : ""}`}
              >
                History
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`floimg-tab ${activeTab === "templates" ? "floimg-tab--active" : ""}`}
              >
                Templates
              </button>
            </div>

            {/* AI Generate button */}
            <button onClick={() => setShowAIChat(true)} className="floimg-ai-btn mr-4">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              AI Generate
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex overflow-hidden">
          {activeTab === "editor" && (
            <>
              <NodePalette />
              <EditorDropZone />
              {selectedNodeId && <NodeInspector />}
            </>
          )}
          {activeTab === "history" && (
            <div className="flex-1 overflow-auto">
              <ExecutionHistory />
            </div>
          )}
          {activeTab === "templates" && (
            <div className="flex-1 overflow-auto">
              <TemplateGallery onSelect={handleTemplateSelect} />
            </div>
          )}
        </div>
      </div>
    </ReactFlowProvider>
  );
}

export default App;
