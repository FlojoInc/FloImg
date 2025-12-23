import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NodeDefinition } from "@floimg-studio/shared";
import { getGenerators, getTransforms } from "../api/client";
import { useWorkflowStore } from "../stores/workflowStore";
import { UploadGallery } from "./UploadGallery";

export function NodePalette() {
  const setGenerators = useWorkflowStore((s) => s.setGenerators);
  const setTransforms = useWorkflowStore((s) => s.setTransforms);
  const generators = useWorkflowStore((s) => s.generators);
  const transforms = useWorkflowStore((s) => s.transforms);
  const addNode = useWorkflowStore((s) => s.addNode);
  const [showUploads, setShowUploads] = useState(false);

  // Fetch node definitions
  const { data: fetchedGenerators } = useQuery({
    queryKey: ["generators"],
    queryFn: getGenerators,
  });

  const { data: fetchedTransforms } = useQuery({
    queryKey: ["transforms"],
    queryFn: getTransforms,
  });

  useEffect(() => {
    if (fetchedGenerators) setGenerators(fetchedGenerators);
  }, [fetchedGenerators, setGenerators]);

  useEffect(() => {
    if (fetchedTransforms) setTransforms(fetchedTransforms);
  }, [fetchedTransforms, setTransforms]);

  const handleDragStart = (e: React.DragEvent, definition: NodeDefinition) => {
    e.dataTransfer.setData("application/json", JSON.stringify(definition));
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDoubleClick = (definition: NodeDefinition) => {
    // Add node at center of canvas
    addNode(definition, { x: 250, y: 150 + Math.random() * 100 });
  };

  // Input node definition (special case - for uploaded images)
  const inputDefinition: NodeDefinition = {
    id: "input:upload",
    type: "input",
    name: "upload",
    label: "Upload Image",
    description: "Use an uploaded image",
    category: "Input",
    params: {
      type: "object",
      properties: {},
    },
  };

  // Save node definition (special case)
  const saveDefinition: NodeDefinition = {
    id: "save:filesystem",
    type: "save",
    name: "save",
    label: "Save",
    description: "Save image to file",
    category: "Output",
    params: {
      type: "object",
      properties: {
        destination: {
          type: "string",
          title: "Destination",
          default: "./output/image.png",
        },
      },
    },
  };

  // Group generators by category
  const generatorsByCategory = generators.reduce(
    (acc, g) => {
      const cat = g.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(g);
      return acc;
    },
    {} as Record<string, NodeDefinition[]>
  );

  // Group transforms by category
  const transformsByCategory = transforms.reduce(
    (acc, t) => {
      const cat = t.category || "Other";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    },
    {} as Record<string, NodeDefinition[]>
  );

  return (
    <div className="w-64 bg-gray-50 dark:bg-zinc-800 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Nodes</h2>

        {/* Input */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wide">
              Input
            </h3>
            <button
              onClick={() => setShowUploads(!showUploads)}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            >
              {showUploads ? "Hide" : "Browse"} Uploads
            </button>
          </div>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, inputDefinition)}
            onDoubleClick={() => handleDoubleClick(inputDefinition)}
            className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded cursor-grab active:cursor-grabbing hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          >
            <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
              Upload Image
            </div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Start with your image</div>
          </div>
          {showUploads && (
            <div className="mt-2 border border-amber-200 dark:border-amber-700 rounded bg-white dark:bg-zinc-900 max-h-64 overflow-y-auto">
              <UploadGallery />
            </div>
          )}
        </div>

        {/* Generators */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-blue-600 dark:text-blue-400 uppercase tracking-wide mb-2">
            Generators
          </h3>
          {Object.entries(generatorsByCategory).map(([category, nodes]) => (
            <div key={category} className="mb-3">
              <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{category}</div>
              {nodes.map((def) => (
                <div
                  key={def.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, def)}
                  onDoubleClick={() => handleDoubleClick(def)}
                  className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
                >
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {def.label}
                  </div>
                  {def.description && (
                    <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {def.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Transforms */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wide mb-2">
            Transforms
          </h3>
          {Object.entries(transformsByCategory).map(([category, nodes]) => (
            <div key={category} className="mb-3">
              <div className="text-xs text-gray-500 dark:text-zinc-400 mb-1">{category}</div>
              {nodes.map((def) => (
                <div
                  key={def.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, def)}
                  onDoubleClick={() => handleDoubleClick(def)}
                  className="px-3 py-2 bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-teal-100 dark:hover:bg-teal-900/50 transition-colors"
                >
                  <div className="text-sm font-medium text-teal-700 dark:text-teal-300">
                    {def.label}
                  </div>
                  {def.description && (
                    <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                      {def.description}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Output */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-green-600 dark:text-green-400 uppercase tracking-wide mb-2">
            Output
          </h3>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, saveDefinition)}
            onDoubleClick={() => handleDoubleClick(saveDefinition)}
            className="px-3 py-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded cursor-grab active:cursor-grabbing hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
          >
            <div className="text-sm font-medium text-green-700 dark:text-green-300">Save</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Save to file</div>
          </div>
        </div>
      </div>
    </div>
  );
}
