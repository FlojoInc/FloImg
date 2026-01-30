import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { NodeDefinition } from "@teamflojo/floimg-studio-shared";
import { getGenerators, getTransforms, getTextProviders, getVisionProviders } from "../api/client";
import { useWorkflowStore } from "../stores/workflowStore";
import { UploadGallery } from "./UploadGallery";
import { NodePaletteItem } from "./NodePaletteItem";

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
    <div className="floimg-sidebar w-64 border-r border-gray-200 dark:border-zinc-700 overflow-y-auto flex flex-col">
      <div className="p-4 flex-1">
        <h2 className="floimg-sidebar__header text-lg !normal-case !tracking-normal">Nodes</h2>

        {/* Input */}
        <div className="floimg-sidebar__section">
          <div className="flex items-center justify-between mb-2">
            <h3 className="floimg-sidebar__header !text-amber-600 dark:!text-amber-400 !mb-0">
              Input
            </h3>
            <button
              onClick={() => setShowUploads(!showUploads)}
              className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300"
            >
              {showUploads ? "Hide" : "Browse"} Uploads
            </button>
          </div>
          <NodePaletteItem
            definition={inputDefinition}
            colorVariant="amber"
            onDragStart={handleDragStart}
            onDoubleClick={handleDoubleClick}
          />
          {showUploads && (
            <div className="mt-2 border border-amber-200 dark:border-amber-700 rounded bg-white dark:bg-zinc-900 max-h-64 overflow-y-auto">
              <UploadGallery />
            </div>
          )}
        </div>

        {/* Generators */}
        <div className="floimg-sidebar__section">
          <h3 className="floimg-sidebar__header !text-blue-600 dark:!text-blue-400">Generators</h3>
          {Object.entries(generatorsByCategory).map(([category, nodes]) => (
            <div key={category} className="mb-3">
              <div className="floimg-sidebar__category">{category}</div>
              {nodes.map((def) => (
                <NodePaletteItem
                  key={def.id}
                  definition={def}
                  colorVariant="blue"
                  onDragStart={handleDragStart}
                  onDoubleClick={handleDoubleClick}
                />
              ))}
            </div>
          ))}
        </div>

        {/* Transforms */}
        <div className="floimg-sidebar__section">
          <h3 className="floimg-sidebar__header !text-teal-600 dark:!text-teal-400">Transforms</h3>
          {Object.entries(transformsByCategory).map(([category, nodes]) => (
            <div key={category} className="mb-3">
              <div className="floimg-sidebar__category">{category}</div>
              {nodes.map((def) => (
                <NodePaletteItem
                  key={def.id}
                  definition={def}
                  colorVariant="teal"
                  onDragStart={handleDragStart}
                  onDoubleClick={handleDoubleClick}
                />
              ))}
            </div>
          ))}
        </div>

        {/* AI Text */}
        {textProviders.length > 0 && (
          <div className="floimg-sidebar__section">
            <h3 className="floimg-sidebar__header !text-pink-600 dark:!text-pink-400">AI Text</h3>
            {textProviders.map((def) => (
              <NodePaletteItem
                key={def.id}
                definition={def}
                colorVariant="pink"
                onDragStart={handleDragStart}
                onDoubleClick={handleDoubleClick}
              />
            ))}
          </div>
        )}

        {/* AI Vision */}
        {visionProviders.length > 0 && (
          <div className="floimg-sidebar__section">
            <h3 className="floimg-sidebar__header !text-cyan-600 dark:!text-cyan-400">AI Vision</h3>
            {visionProviders.map((def) => (
              <NodePaletteItem
                key={def.id}
                definition={def}
                colorVariant="cyan"
                onDragStart={handleDragStart}
                onDoubleClick={handleDoubleClick}
              />
            ))}
          </div>
        )}

        {/* Flow Control */}
        <div className="floimg-sidebar__section">
          <h3 className="floimg-sidebar__header !text-orange-600 dark:!text-orange-400">
            Flow Control
          </h3>
          <NodePaletteItem
            definition={fanOutDefinition}
            colorVariant="orange"
            onDragStart={handleDragStart}
            onDoubleClick={handleDoubleClick}
          />
          <NodePaletteItem
            definition={collectDefinition}
            colorVariant="orange"
            onDragStart={handleDragStart}
            onDoubleClick={handleDoubleClick}
          />
          <NodePaletteItem
            definition={routerDefinition}
            colorVariant="amber"
            onDragStart={handleDragStart}
            onDoubleClick={handleDoubleClick}
          />
        </div>

        {/* Output */}
        <div className="floimg-sidebar__section">
          <h3 className="floimg-sidebar__header !text-emerald-600 dark:!text-emerald-400">
            Output
          </h3>
          <NodePaletteItem
            definition={saveDefinition}
            colorVariant="emerald"
            onDragStart={handleDragStart}
            onDoubleClick={handleDoubleClick}
          />
        </div>
      </div>

      {/* Version indicator at bottom of sidebar */}
      <div className="px-4 py-2 mt-auto border-t border-gray-200 dark:border-zinc-700">
        <div className="text-xs text-gray-400 dark:text-zinc-500">
          FloImg Studio v{__APP_VERSION__}
          {__GIT_COMMIT__ !== "dev" && (
            <span className="ml-1 opacity-60">({__GIT_COMMIT__.slice(0, 7)})</span>
          )}
        </div>
      </div>
    </div>
  );
}
