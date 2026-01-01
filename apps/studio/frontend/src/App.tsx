import { useState, useCallback, useEffect, DragEvent } from "react";
import { ReactFlowProvider } from "reactflow";
import { WorkflowEditor } from "./editor/WorkflowEditor";
import { NodePalette } from "./components/NodePalette";
import { NodeInspector } from "./components/NodeInspector";
import { Toolbar } from "./components/Toolbar";
import { Gallery } from "./components/Gallery";
import { TemplateGallery } from "./components/TemplateGallery";
import { WorkflowLibrary } from "./components/WorkflowLibrary";
import { AISettings } from "./components/AISettings";
import { AIChat } from "./components/AIChat";
import { useWorkflowStore } from "./stores/workflowStore";
import { getTemplateById } from "./templates";
import type { NodeDefinition, GeneratedWorkflowData } from "@teamflojo/floimg-studio-shared";

type TabType = "editor" | "gallery" | "templates";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const [showAIChat, setShowAIChat] = useState(false);
  const addNode = useWorkflowStore((s) => s.addNode);
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const loadGeneratedWorkflow = useWorkflowStore((s) => s.loadGeneratedWorkflow);

  // Handle ?template=<id> URL parameter
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const templateId = params.get("template");

    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        loadTemplate(template);
        // Clean up URL without reload
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [loadTemplate]);

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

  // Handler for template selection (from TemplateGallery)
  const handleTemplateSelect = useCallback(
    (templateId: string) => {
      const template = getTemplateById(templateId);
      if (template) {
        loadTemplate(template);
        setActiveTab("editor");
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

  // Handle drop from palette
  const handleDrop = useCallback(
    (event: DragEvent) => {
      event.preventDefault();

      const data = event.dataTransfer.getData("application/json");
      if (!data) return;

      try {
        const definition: NodeDefinition = JSON.parse(data);

        // Get drop position relative to the canvas
        const reactFlowBounds = document.querySelector(".react-flow")?.getBoundingClientRect();

        if (!reactFlowBounds) return;

        const position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };

        addNode(definition, position);
      } catch (e) {
        console.error("Failed to parse dropped node:", e);
      }
    },
    [addNode]
  );

  const handleDragOver = useCallback((event: DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  return (
    <ReactFlowProvider>
      {/* AI Settings Modal */}
      <AISettings />

      {/* AI Chat Modal */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        onApplyWorkflow={handleApplyWorkflow}
      />

      {/* Workflow Library slide-out panel */}
      <WorkflowLibrary />

      <div className="h-screen flex flex-col bg-gray-100 dark:bg-zinc-900">
        <Toolbar />

        {/* Tab navigation */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center justify-between">
            <div className="flex">
              <button
                onClick={() => setActiveTab("editor")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "editor"
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                }`}
              >
                Editor
              </button>
              <button
                onClick={() => setActiveTab("gallery")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "gallery"
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                }`}
              >
                Gallery
              </button>
              <button
                onClick={() => setActiveTab("templates")}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "templates"
                    ? "border-teal-500 text-teal-600 dark:text-teal-400"
                    : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
                }`}
              >
                Templates
              </button>
            </div>

            {/* AI Generate button */}
            <button
              onClick={() => setShowAIChat(true)}
              className="mr-4 px-4 py-1.5 text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 rounded-full flex items-center gap-2 transition-all shadow-sm hover:shadow"
            >
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
              <div className="flex-1" onDrop={handleDrop} onDragOver={handleDragOver}>
                <WorkflowEditor />
              </div>
              <NodeInspector />
            </>
          )}
          {activeTab === "gallery" && (
            <div className="flex-1 overflow-auto">
              <Gallery />
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
