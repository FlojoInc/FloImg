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
import { useWorkflowStore } from "./stores/workflowStore";
import { getTemplateById } from "./templates";
import type { NodeDefinition } from "@floimg-studio/shared";

type TabType = "editor" | "gallery" | "templates";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("editor");
  const addNode = useWorkflowStore((s) => s.addNode);
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);

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

      {/* Workflow Library slide-out panel */}
      <WorkflowLibrary />

      <div className="h-screen flex flex-col bg-gray-100 dark:bg-zinc-900">
        <Toolbar />

        {/* Tab navigation */}
        <div className="bg-white dark:bg-zinc-800 border-b border-gray-200 dark:border-zinc-700">
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
