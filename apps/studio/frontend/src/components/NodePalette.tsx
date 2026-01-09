import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NodeDefinition } from "@teamflojo/floimg-studio-shared";
import { getGenerators, getTransforms, getTextProviders, getVisionProviders } from "../api/client";
import { useWorkflowStore } from "../stores/workflowStore";
import { UploadGallery } from "./UploadGallery";

export function NodePalette() {
  const setGenerators = useWorkflowStore((s) => s.setGenerators);
  const setTransforms = useWorkflowStore((s) => s.setTransforms);
  const setTextProviders = useWorkflowStore((s) => s.setTextProviders);
  const setVisionProviders = useWorkflowStore((s) => s.setVisionProviders);
  const generators = useWorkflowStore((s) => s.generators);
  const transforms = useWorkflowStore((s) => s.transforms);
  const textProviders = useWorkflowStore((s) => s.textProviders);
  const visionProviders = useWorkflowStore((s) => s.visionProviders);
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

  const { data: fetchedTextProviders } = useQuery({
    queryKey: ["textProviders"],
    queryFn: getTextProviders,
  });

  const { data: fetchedVisionProviders } = useQuery({
    queryKey: ["visionProviders"],
    queryFn: getVisionProviders,
  });

  useEffect(() => {
    if (fetchedGenerators) setGenerators(fetchedGenerators);
  }, [fetchedGenerators, setGenerators]);

  useEffect(() => {
    if (fetchedTransforms) setTransforms(fetchedTransforms);
  }, [fetchedTransforms, setTransforms]);

  useEffect(() => {
    if (fetchedTextProviders) setTextProviders(fetchedTextProviders);
  }, [fetchedTextProviders, setTextProviders]);

  useEffect(() => {
    if (fetchedVisionProviders) setVisionProviders(fetchedVisionProviders);
  }, [fetchedVisionProviders, setVisionProviders]);

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
        provider: {
          type: "string",
          default: "filesystem",
        },
      },
    },
  };

  // Flow control node definitions (iterative workflows)
  const fanOutDefinition: NodeDefinition = {
    id: "fanout:default",
    type: "fanout",
    name: "fanout",
    label: "Fan-Out",
    description: "Distribute to parallel branches",
    category: "Flow Control",
    params: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          title: "Mode",
          description: "How to fan out",
          enum: ["array", "count"],
          default: "count",
        },
        count: {
          type: "number",
          title: "Count",
          description: "Number of parallel branches (count mode)",
          default: 3,
          minimum: 2,
          maximum: 10,
        },
        arrayProperty: {
          type: "string",
          title: "Array Property",
          description: "Property name to iterate over (array mode)",
        },
      },
    },
  };

  const collectDefinition: NodeDefinition = {
    id: "collect:default",
    type: "collect",
    name: "collect",
    label: "Collect",
    description: "Gather parallel outputs",
    category: "Flow Control",
    params: {
      type: "object",
      properties: {
        expectedInputs: {
          type: "number",
          title: "Expected Inputs",
          description: "Number of inputs to collect",
          default: 3,
          minimum: 2,
          maximum: 10,
        },
        waitMode: {
          type: "string",
          title: "Wait Mode",
          description: "When to output",
          enum: ["all", "available"],
          default: "all",
        },
      },
    },
  };

  const routerDefinition: NodeDefinition = {
    id: "router:default",
    type: "router",
    name: "router",
    label: "Router",
    description: "Route based on AI selection",
    category: "Flow Control",
    params: {
      type: "object",
      properties: {
        selectionProperty: {
          type: "string",
          title: "Selection Property",
          description: "JSON property with selection (e.g., 'winner')",
          default: "winner",
        },
        selectionType: {
          type: "string",
          title: "Selection Type",
          description: "How to interpret selection",
          enum: ["index", "value"],
          default: "index",
        },
        outputCount: {
          type: "number",
          title: "Output Count",
          description: "How many items to route",
          default: 1,
          minimum: 1,
          maximum: 5,
        },
        contextProperty: {
          type: "string",
          title: "Context Property",
          description: "Optional property to pass through (e.g., 'refinement')",
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

        {/* AI Text */}
        {textProviders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-pink-600 dark:text-pink-400 uppercase tracking-wide mb-2">
              AI Text
            </h3>
            {textProviders.map((def) => (
              <div
                key={def.id}
                draggable
                onDragStart={(e) => handleDragStart(e, def)}
                onDoubleClick={() => handleDoubleClick(def)}
                className="px-3 py-2 bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-700 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-pink-100 dark:hover:bg-pink-900/50 transition-colors"
              >
                <div className="text-sm font-medium text-pink-700 dark:text-pink-300">
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
        )}

        {/* AI Vision */}
        {visionProviders.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-cyan-600 dark:text-cyan-400 uppercase tracking-wide mb-2">
              AI Vision
            </h3>
            {visionProviders.map((def) => (
              <div
                key={def.id}
                draggable
                onDragStart={(e) => handleDragStart(e, def)}
                onDoubleClick={() => handleDoubleClick(def)}
                className="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-700 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-cyan-100 dark:hover:bg-cyan-900/50 transition-colors"
              >
                <div className="text-sm font-medium text-cyan-700 dark:text-cyan-300">
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
        )}

        {/* Flow Control */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-2">
            Flow Control
          </h3>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, fanOutDefinition)}
            onDoubleClick={() => handleDoubleClick(fanOutDefinition)}
            className="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
          >
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Fan-Out</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Distribute to parallel branches</div>
          </div>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, collectDefinition)}
            onDoubleClick={() => handleDoubleClick(collectDefinition)}
            className="px-3 py-2 bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-700 rounded mb-1 cursor-grab active:cursor-grabbing hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
          >
            <div className="text-sm font-medium text-orange-700 dark:text-orange-300">Collect</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Gather parallel outputs</div>
          </div>
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, routerDefinition)}
            onDoubleClick={() => handleDoubleClick(routerDefinition)}
            className="px-3 py-2 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded cursor-grab active:cursor-grabbing hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
          >
            <div className="text-sm font-medium text-violet-700 dark:text-violet-300">Router</div>
            <div className="text-xs text-gray-500 dark:text-zinc-400">Route based on AI selection</div>
          </div>
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
