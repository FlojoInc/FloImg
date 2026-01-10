import { useState } from "react";
import type {
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  TextNodeData,
  VisionNodeData,
  FanOutNodeData,
  CollectNodeData,
  RouterNodeData,
  ParamField,
  OutputSchema,
  OutputProperty,
} from "@teamflojo/floimg-studio-shared";
import { useWorkflowStore } from "../stores/workflowStore";

export function NodeInspector() {
  const selectedNodeId = useWorkflowStore((s) => s.selectedNodeId);
  const nodes = useWorkflowStore((s) => s.nodes);
  const generators = useWorkflowStore((s) => s.generators);
  const transforms = useWorkflowStore((s) => s.transforms);
  const textProviders = useWorkflowStore((s) => s.textProviders);
  const visionProviders = useWorkflowStore((s) => s.visionProviders);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const deleteNode = useWorkflowStore((s) => s.deleteNode);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);

  // Don't render if no node selected (parent handles visibility)
  if (!selectedNode) {
    return null;
  }

  // Get schema for the selected node
  let schema: Record<string, ParamField> | undefined;
  let nodeLabel = "";

  if (selectedNode.type === "generator") {
    const data = selectedNode.data as GeneratorNodeData;
    const def = generators.find((g) => g.name === data.generatorName);
    schema = def?.params?.properties;
    nodeLabel = def?.label || data.generatorName;
  } else if (selectedNode.type === "transform") {
    const data = selectedNode.data as TransformNodeData;
    const def = transforms.find((t) => t.name === data.operation);
    schema = def?.params?.properties;
    nodeLabel = def?.label || data.operation;
  } else if (selectedNode.type === "save") {
    const data = selectedNode.data as SaveNodeData;
    const isCloudSave = data.provider === "cloud";

    nodeLabel = isCloudSave ? "Save to FloImg Cloud" : "Save";
    schema = {
      destination: {
        type: "string",
        title: isCloudSave ? "Filename" : "Destination",
        description: isCloudSave ? "Filename for cloud storage" : "File path to save the image",
      },
    };
  } else if (selectedNode.type === "text") {
    const data = selectedNode.data as TextNodeData;
    const def = textProviders.find((t) => t.name === data.providerName);
    schema = def?.params?.properties;
    nodeLabel = def?.label || data.providerName;
  } else if (selectedNode.type === "vision") {
    const data = selectedNode.data as VisionNodeData;
    const def = visionProviders.find((v) => v.name === data.providerName);
    schema = def?.params?.properties;
    nodeLabel = def?.label || data.providerName;
  } else if (selectedNode.type === "fanout") {
    nodeLabel = "Fan-Out";
    schema = {
      mode: {
        type: "string",
        title: "Mode",
        description: "How to distribute inputs",
        enum: ["count", "array"],
      },
      count: {
        type: "number",
        title: "Branch Count",
        description: "Number of parallel branches (count mode)",
        minimum: 2,
        maximum: 10,
      },
      arrayProperty: {
        type: "string",
        title: "Array Property",
        description: "Property name to iterate over (array mode)",
      },
    };
  } else if (selectedNode.type === "collect") {
    nodeLabel = "Collect";
    schema = {
      expectedInputs: {
        type: "number",
        title: "Expected Inputs",
        description: "Number of inputs to collect",
        minimum: 2,
        maximum: 10,
      },
      waitMode: {
        type: "string",
        title: "Wait Mode",
        description: "When to output results",
        enum: ["all", "available"],
      },
    };
  } else if (selectedNode.type === "router") {
    nodeLabel = "Router";
    schema = {
      selectionProperty: {
        type: "string",
        title: "Selection Property",
        description: "JSON property containing selection (e.g., 'winner')",
      },
      selectionType: {
        type: "string",
        title: "Selection Type",
        description: "How to interpret selection value",
        enum: ["index", "value"],
      },
      outputCount: {
        type: "number",
        title: "Output Count",
        description: "How many items to route (1 = single winner)",
        minimum: 1,
        maximum: 5,
      },
      contextProperty: {
        type: "string",
        title: "Context Property",
        description: "Optional property to pass through (e.g., 'refinement')",
      },
    };
  }

  const handleParamChange = (key: string, value: unknown) => {
    if (selectedNode.type === "generator") {
      const data = selectedNode.data as GeneratorNodeData;
      updateNodeData(selectedNode.id, {
        params: { ...data.params, [key]: value },
      });
    } else if (selectedNode.type === "transform") {
      const data = selectedNode.data as TransformNodeData;
      updateNodeData(selectedNode.id, {
        params: { ...data.params, [key]: value },
      });
    } else if (selectedNode.type === "save") {
      updateNodeData(selectedNode.id, { [key]: value });
    } else if (selectedNode.type === "text") {
      const data = selectedNode.data as TextNodeData;
      updateNodeData(selectedNode.id, {
        params: { ...data.params, [key]: value },
      });
    } else if (selectedNode.type === "vision") {
      const data = selectedNode.data as VisionNodeData;
      updateNodeData(selectedNode.id, {
        params: { ...data.params, [key]: value },
      });
    } else if (
      selectedNode.type === "fanout" ||
      selectedNode.type === "collect" ||
      selectedNode.type === "router"
    ) {
      // Flow control nodes store data directly (not in params)
      updateNodeData(selectedNode.id, { [key]: value });
    }
  };

  const getParamValue = (key: string): unknown => {
    if (selectedNode.type === "generator") {
      return (selectedNode.data as GeneratorNodeData).params[key];
    } else if (selectedNode.type === "transform") {
      return (selectedNode.data as TransformNodeData).params[key];
    } else if (selectedNode.type === "save") {
      return (selectedNode.data as SaveNodeData)[key as keyof SaveNodeData];
    } else if (selectedNode.type === "text") {
      return (selectedNode.data as TextNodeData).params[key];
    } else if (selectedNode.type === "vision") {
      return (selectedNode.data as VisionNodeData).params[key];
    } else if (selectedNode.type === "fanout") {
      return (selectedNode.data as FanOutNodeData)[key as keyof FanOutNodeData];
    } else if (selectedNode.type === "collect") {
      return (selectedNode.data as CollectNodeData)[key as keyof CollectNodeData];
    } else if (selectedNode.type === "router") {
      return (selectedNode.data as RouterNodeData)[key as keyof RouterNodeData];
    }
    return undefined;
  };

  // Determine which fields should be visible based on current parameter values
  const isFieldVisible = (key: string, _field: ParamField): boolean => {
    // For shapes generator, apply conditional visibility
    if (
      selectedNode.type === "generator" &&
      (selectedNode.data as GeneratorNodeData).generatorName === "shapes"
    ) {
      const shapeType = getParamValue("shapeType") || "rectangle";
      const fillType = getParamValue("fillType") || "solid";

      // Shape-specific parameters
      if (key === "sides") return shapeType === "polygon";
      if (key === "points" || key === "innerRadius") return shapeType === "star";
      if (key === "cornerRadius") return shapeType === "rectangle";

      // Fill-specific parameters
      if (key === "fillColor") return fillType === "solid";
      if (
        key === "gradientType" ||
        key === "gradientColor1" ||
        key === "gradientColor2" ||
        key === "gradientAngle"
      ) {
        return fillType === "gradient";
      }
      if (
        key === "patternType" ||
        key === "patternColor" ||
        key === "patternBackground" ||
        key === "patternScale"
      ) {
        return fillType === "pattern";
      }
    }

    // For fan-out, show count in count mode, arrayProperty in array mode
    if (selectedNode.type === "fanout") {
      const mode = (selectedNode.data as FanOutNodeData).mode || "count";
      if (key === "count") return mode === "count";
      if (key === "arrayProperty") return mode === "array";
    }

    return true;
  };

  return (
    <div className="floimg-inspector w-80 border-l border-gray-200 dark:border-zinc-700 overflow-y-auto">
      <div className="p-4">
        <div className="floimg-inspector__header">
          <h2 className="floimg-inspector__title">{nodeLabel}</h2>
          <button onClick={() => deleteNode(selectedNode.id)} className="floimg-inspector__delete">
            Delete
          </button>
        </div>

        <div className="space-y-4">
          {schema &&
            Object.entries(schema)
              .filter(([key, field]) => isFieldVisible(key, field))
              .map(([key, field]) => (
                <FieldEditor
                  key={key}
                  name={key}
                  field={field}
                  value={getParamValue(key)}
                  onChange={(value) => handleParamChange(key, value)}
                />
              ))}
        </div>

        {/* Output Schema Editor for text/vision nodes */}
        {(selectedNode.type === "text" || selectedNode.type === "vision") && (
          <OutputSchemaEditor
            nodeId={selectedNode.id}
            outputSchema={(selectedNode.data as TextNodeData | VisionNodeData).outputSchema}
            updateNodeData={updateNodeData}
          />
        )}
      </div>
    </div>
  );
}

interface FieldEditorProps {
  name: string;
  field: ParamField;
  value: unknown;
  onChange: (value: unknown) => void;
}

function FieldEditor({ name, field, value, onChange }: FieldEditorProps) {
  const label = field.title || name;

  // Enum -> select dropdown
  if (field.enum) {
    return (
      <div className="floimg-field">
        <label className="floimg-field__label">{label}</label>
        <select
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="floimg-field__input"
        >
          <option value="">Select...</option>
          {field.enum.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {field.description && <p className="floimg-field__hint">{field.description}</p>}
      </div>
    );
  }

  // Number input
  if (field.type === "number") {
    return (
      <div className="floimg-field">
        <label className="floimg-field__label">{label}</label>
        <input
          type="number"
          value={value !== undefined ? Number(value) : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          min={field.minimum}
          max={field.maximum}
          className="floimg-field__input"
        />
        {field.description && <p className="floimg-field__hint">{field.description}</p>}
      </div>
    );
  }

  // Boolean -> checkbox
  if (field.type === "boolean") {
    return (
      <div className="floimg-field flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900"
        />
        <label className="floimg-field__label !mb-0">{label}</label>
      </div>
    );
  }

  // Color picker for color-related fields
  if (name.toLowerCase().includes("color") && typeof value === "string" && value.startsWith("#")) {
    return (
      <div className="floimg-field">
        <label className="floimg-field__label">{label}</label>
        <div className="flex gap-2">
          <input
            type="color"
            value={String(value || "#000000")}
            onChange={(e) => onChange(e.target.value)}
            className="h-10 w-14 p-1 border border-gray-300 dark:border-zinc-600 rounded-lg"
          />
          <input
            type="text"
            value={String(value || "")}
            onChange={(e) => onChange(e.target.value)}
            className="floimg-field__input flex-1"
          />
        </div>
      </div>
    );
  }

  // Default: text input (also for objects as JSON)
  if (field.type === "object") {
    return (
      <div className="floimg-field">
        <label className="floimg-field__label">{label}</label>
        <textarea
          value={value ? JSON.stringify(value, null, 2) : "{}"}
          onChange={(e) => {
            try {
              onChange(JSON.parse(e.target.value));
            } catch {
              // Invalid JSON, ignore
            }
          }}
          rows={4}
          className="floimg-field__input font-mono text-xs"
        />
        {field.description && <p className="floimg-field__hint">{field.description}</p>}
      </div>
    );
  }

  // String input (default)
  return (
    <div className="floimg-field">
      <label className="floimg-field__label">{label}</label>
      {name === "prompt" || name === "code" || name === "text" ? (
        <textarea
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="floimg-field__input"
        />
      ) : (
        <input
          type="text"
          value={String(value || "")}
          onChange={(e) => onChange(e.target.value)}
          className="floimg-field__input"
        />
      )}
      {field.description && <p className="floimg-field__hint">{field.description}</p>}
    </div>
  );
}

// ============================================================================
// Output Schema Editor for text/vision nodes
// ============================================================================

interface OutputSchemaEditorProps {
  nodeId: string;
  outputSchema?: OutputSchema;
  updateNodeData: (id: string, data: Partial<TextNodeData | VisionNodeData>) => void;
}

function OutputSchemaEditor({ nodeId, outputSchema, updateNodeData }: OutputSchemaEditorProps) {
  const [newPropertyName, setNewPropertyName] = useState("");

  const properties = outputSchema?.properties || {};
  const propertyEntries = Object.entries(properties);

  const handleAddProperty = () => {
    if (!newPropertyName.trim()) return;

    const newSchema: OutputSchema = {
      type: "object",
      properties: {
        ...properties,
        [newPropertyName.trim()]: { type: "string" },
      },
    };

    updateNodeData(nodeId, { outputSchema: newSchema });
    setNewPropertyName("");
  };

  const handleRemoveProperty = (key: string) => {
    const newProperties = { ...properties };
    delete newProperties[key];

    if (Object.keys(newProperties).length === 0) {
      updateNodeData(nodeId, { outputSchema: undefined });
    } else {
      updateNodeData(nodeId, {
        outputSchema: { type: "object", properties: newProperties },
      });
    }
  };

  const handleTypeChange = (key: string, type: OutputProperty["type"]) => {
    updateNodeData(nodeId, {
      outputSchema: {
        type: "object",
        properties: {
          ...properties,
          [key]: { ...properties[key], type },
        },
      },
    });
  };

  const handleDescriptionChange = (key: string, description: string) => {
    updateNodeData(nodeId, {
      outputSchema: {
        type: "object",
        properties: {
          ...properties,
          [key]: { ...properties[key], description: description || undefined },
        },
      },
    });
  };

  return (
    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-zinc-700">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300">Output Schema</h3>
        <span className="text-xs text-gray-500 dark:text-zinc-500">
          {propertyEntries.length > 0
            ? `${propertyEntries.length} output${propertyEntries.length > 1 ? "s" : ""}`
            : "No outputs defined"}
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3">
        Define output properties to enable connecting individual JSON fields to other nodes.
      </p>

      {/* Existing properties */}
      {propertyEntries.length > 0 && (
        <div className="space-y-2 mb-3">
          {propertyEntries.map(([key, prop]) => (
            <div
              key={key}
              className="flex items-center gap-2 p-2 bg-pink-50 dark:bg-pink-900/20 rounded border border-pink-200 dark:border-pink-800"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-pink-700 dark:text-pink-300 truncate">
                    {key}
                  </span>
                  <select
                    value={prop.type}
                    onChange={(e) =>
                      handleTypeChange(key, e.target.value as OutputProperty["type"])
                    }
                    className="text-xs px-1.5 py-0.5 rounded border border-pink-300 dark:border-pink-700 bg-white dark:bg-zinc-800 text-gray-700 dark:text-zinc-300"
                  >
                    <option value="string">string</option>
                    <option value="number">number</option>
                    <option value="boolean">boolean</option>
                    <option value="object">object</option>
                    <option value="array">array</option>
                  </select>
                </div>
                <input
                  type="text"
                  value={prop.description || ""}
                  onChange={(e) => handleDescriptionChange(key, e.target.value)}
                  placeholder="Description (optional)"
                  className="mt-1 w-full text-xs px-2 py-1 rounded border border-pink-200 dark:border-pink-700 bg-white dark:bg-zinc-800 text-gray-600 dark:text-zinc-400 placeholder-gray-400 dark:placeholder-zinc-500"
                />
              </div>
              <button
                onClick={() => handleRemoveProperty(key)}
                className="text-pink-500 hover:text-pink-700 dark:text-pink-400 dark:hover:text-pink-300 p-1"
                title="Remove property"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add new property */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newPropertyName}
          onChange={(e) => setNewPropertyName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddProperty()}
          placeholder="Property name..."
          className="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-900 text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-500"
        />
        <button
          onClick={handleAddProperty}
          disabled={!newPropertyName.trim()}
          className="px-3 py-1.5 text-sm font-medium text-white bg-pink-500 rounded hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add
        </button>
      </div>

      {/* Hint about usage */}
      {propertyEntries.length > 0 && (
        <p className="mt-3 text-xs text-gray-500 dark:text-zinc-500">
          Connect from the small pink handles on the right of the node to route individual
          properties.
        </p>
      )}
    </div>
  );
}
