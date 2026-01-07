import { memo, useCallback, useRef } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type {
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  InputNodeData,
  VisionNodeData,
  TextNodeData,
} from "@teamflojo/floimg-studio-shared";
import { useWorkflowStore } from "../stores/workflowStore";
import { uploadImage, getUploadBlobUrl } from "../api/client";

// Helper to get execution status class for node border
function getExecutionClass(nodeStatus: string | undefined): string {
  if (nodeStatus === "pending") {
    return "border-gray-400 dark:border-zinc-500";
  }
  if (nodeStatus === "running") {
    return "border-yellow-400 animate-pulse";
  }
  if (nodeStatus === "completed") {
    return "border-green-500";
  }
  if (nodeStatus === "error") {
    return "border-red-500";
  }
  return "";
}

// Eye icon for preview toggle
function PreviewToggle({ nodeId, color }: { nodeId: string; color: string }) {
  const previewVisible = useWorkflowStore((s) => s.previewVisible[nodeId] !== false);
  const togglePreview = useWorkflowStore((s) => s.togglePreview);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        togglePreview(nodeId);
      }}
      className={`ml-auto p-1 rounded hover:bg-gray-200 dark:hover:bg-zinc-600 transition-colors ${previewVisible ? "opacity-100" : "opacity-40"}`}
      title={previewVisible ? "Hide preview" : "Show preview"}
    >
      <svg className={`w-3.5 h-3.5 ${color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {previewVisible ? (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
        ) : (
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        )}
      </svg>
    </button>
  );
}

// Generator Node (source nodes - have output only)
// AI generators may also have a text input handle and/or references input handle
export const GeneratorNode = memo(function GeneratorNode({
  id,
  data,
  selected,
}: NodeProps<GeneratorNodeData>) {
  const preview = useWorkflowStore((s) => s.execution.previews[id]);
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);
  const previewVisible = useWorkflowStore((s) => s.previewVisible[id] !== false);

  const executionClass = getExecutionClass(nodeStatus);
  const borderClass = executionClass || (selected ? "border-blue-500" : "border-blue-200");

  // AI generators get a text input handle for dynamic prompts
  const isAI = data.isAI;
  // Check if this generator accepts reference images
  const acceptsReferences = data.acceptsReferenceImages;

  return (
    <div
      className={`rounded-lg border-2 bg-white dark:bg-zinc-800 shadow-md min-w-[180px] overflow-hidden ${borderClass}`}
    >
      {/* Text input handle for AI generators (optional - for dynamic prompts) */}
      {isAI && (
        <Handle
          type="target"
          position={Position.Top}
          id="text"
          className="w-3 h-3 !bg-pink-500"
          title="Text input (optional prompt from text/vision node)"
        />
      )}
      {/* Reference images input handle (for AI generators) */}
      {acceptsReferences && (
        <Handle
          type="target"
          position={Position.Left}
          id="references"
          className="w-3 h-3 !bg-violet-500"
          style={{ top: "50%" }}
          title={`Reference images (up to ${data.maxReferenceImages || 14})`}
        />
      )}
      {preview && previewVisible && (
        <div className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
          <img src={preview} alt="Preview" className="w-full h-24 object-contain" />
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="font-semibold text-sm text-blue-700 dark:text-blue-400">
            {data.generatorName}
          </span>
          <PreviewToggle nodeId={id} color="text-blue-500 dark:text-blue-400" />
        </div>
        {isAI && (
          <div className="text-[10px] text-pink-500 dark:text-pink-400 mb-1">
            ↑ Connect text node for dynamic prompt
          </div>
        )}
        {acceptsReferences && (
          <div className="text-[10px] text-violet-500 dark:text-violet-400 mb-1">
            ← Connect reference images
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-zinc-400">
          {Object.entries(data.params)
            .filter(([, value]) => typeof value !== "object" || value === null)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key} className="truncate">
                {key}: {String(value).slice(0, 20)}
              </div>
            ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-blue-500" />
    </div>
  );
});

// Transform Node (have both input and output)
// AI transforms also have an optional text input at the top
// AI transforms that accept references have a references input at the bottom
export const TransformNode = memo(function TransformNode({
  id,
  data,
  selected,
}: NodeProps<TransformNodeData>) {
  const preview = useWorkflowStore((s) => s.execution.previews[id]);
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);
  const previewVisible = useWorkflowStore((s) => s.previewVisible[id] !== false);

  const executionClass = getExecutionClass(nodeStatus);
  const borderClass = executionClass || (selected ? "border-teal-500" : "border-teal-200");

  // AI transforms get a purple accent to indicate AI-powered
  const isAI = data.isAI;
  // Check if this transform accepts reference images
  const acceptsReferences = data.acceptsReferenceImages;

  return (
    <div
      className={`rounded-lg border-2 bg-white dark:bg-zinc-800 shadow-md min-w-[180px] overflow-hidden ${borderClass}`}
    >
      {/* Text input handle for AI transforms (optional - for dynamic prompts) */}
      {isAI && (
        <Handle
          type="target"
          position={Position.Top}
          id="text"
          className="w-3 h-3 !bg-pink-500"
          title="Text input (optional prompt from text/vision node)"
        />
      )}
      {/* Image input handle */}
      <Handle type="target" position={Position.Left} id="image" className="w-3 h-3 !bg-teal-500" />
      {/* Reference images input handle (for AI transforms that accept additional references) */}
      {acceptsReferences && (
        <Handle
          type="target"
          position={Position.Bottom}
          id="references"
          className="w-3 h-3 !bg-violet-500"
          title={`Reference images (up to ${data.maxReferenceImages || 13})`}
        />
      )}
      {preview && previewVisible && (
        <div className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
          <img src={preview} alt="Preview" className="w-full h-24 object-contain" />
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          {isAI ? (
            <svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path
                fillRule="evenodd"
                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <div className="w-3 h-3 rounded-full bg-teal-500" />
          )}
          <span
            className={`font-semibold text-sm ${isAI ? "text-purple-700 dark:text-purple-400" : "text-teal-700 dark:text-teal-400"}`}
          >
            {data.operation}
          </span>
          <PreviewToggle
            nodeId={id}
            color={
              isAI ? "text-purple-500 dark:text-purple-400" : "text-teal-500 dark:text-teal-400"
            }
          />
        </div>
        {isAI && (
          <div className="text-[10px] text-pink-500 dark:text-pink-400 mb-1">
            ↑ Connect text node for dynamic prompt
          </div>
        )}
        {acceptsReferences && (
          <div className="text-[10px] text-violet-500 dark:text-violet-400 mb-1">
            ↓ Connect reference images
          </div>
        )}
        <div className="text-xs text-gray-500 dark:text-zinc-400">
          {Object.entries(data.params)
            .filter(([, value]) => typeof value !== "object" || value === null)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key} className="truncate">
                {key}: {String(value).slice(0, 20)}
              </div>
            ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-teal-500" />
    </div>
  );
});

// Save Node (sink nodes - have input only)
export const SaveNode = memo(function SaveNode({ id, data, selected }: NodeProps<SaveNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);

  const executionClass = getExecutionClass(nodeStatus);
  const borderClass = executionClass || (selected ? "border-green-500" : "border-green-200");

  return (
    <div
      className={`px-4 py-3 rounded-lg border-2 bg-white dark:bg-zinc-800 shadow-md min-w-[180px] ${borderClass}`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-green-500" />
      <div className="flex items-center gap-2 mb-2">
        <div className="w-3 h-3 rounded-full bg-green-500" />
        <span className="font-semibold text-sm text-green-700 dark:text-green-400">Save</span>
      </div>
      <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">{data.destination}</div>
    </div>
  );
});

// Input Node (source nodes with uploaded images - have output only)
export const InputNode = memo(function InputNode({ id, data, selected }: NodeProps<InputNodeData>) {
  const preview = useWorkflowStore((s) => s.execution.previews[id]);
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);
  const previewVisible = useWorkflowStore((s) => s.previewVisible[id] !== false);
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const executionClass = getExecutionClass(nodeStatus);
  const borderClass = executionClass || (selected ? "border-amber-500" : "border-amber-200");

  // Handle file selection
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        const result = await uploadImage(file);
        updateNodeData(id, {
          uploadId: result.id,
          filename: result.filename,
          mime: result.mime,
        });
      } catch (error) {
        console.error("Upload failed:", error);
      }
    },
    [id, updateNodeData]
  );

  // Handle drag and drop
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  // Get preview URL - either execution preview or static upload URL
  const previewUrl = preview || (data.uploadId ? getUploadBlobUrl(data.uploadId) : null);

  return (
    <div
      className={`rounded-lg border-2 bg-white dark:bg-zinc-800 shadow-md min-w-[180px] overflow-hidden ${borderClass}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {previewUrl && previewVisible ? (
        <div className="bg-gray-100 dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-700">
          <img src={previewUrl} alt="Uploaded" className="w-full h-24 object-contain" />
        </div>
      ) : !previewUrl ? (
        <div
          className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-100 dark:border-amber-800 h-24 flex items-center justify-center cursor-pointer hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-center text-amber-600 dark:text-amber-400">
            <div className="text-2xl mb-1">+</div>
            <div className="text-xs">Drop image or click</div>
          </div>
        </div>
      ) : null}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="font-semibold text-sm text-amber-700 dark:text-amber-400">Input</span>
          <PreviewToggle nodeId={id} color="text-amber-500 dark:text-amber-400" />
        </div>
        <div className="text-xs text-gray-500 dark:text-zinc-400 truncate">
          {data.filename || "No image selected"}
        </div>
      </div>
      <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-amber-500" />
    </div>
  );
});

// Vision Node (AI image analysis - has input and output)
// Supports multiple output handles when outputSchema is defined
export const VisionNode = memo(function VisionNode({
  id,
  data,
  selected,
}: NodeProps<VisionNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);
  const dataOutput = useWorkflowStore((s) => s.execution.dataOutputs?.[id]);
  const openOutputInspector = useWorkflowStore((s) => s.openOutputInspector);

  const executionClass = getExecutionClass(nodeStatus);
  const borderClass = executionClass || (selected ? "border-cyan-500" : "border-cyan-200");

  // Get output schema properties for multi-output handles
  const outputProperties = data.outputSchema?.properties
    ? Object.entries(data.outputSchema.properties)
    : [];
  const hasMultiOutput = outputProperties.length > 0;

  return (
    <div
      className={`rounded-lg border-2 bg-white dark:bg-zinc-800 shadow-md min-w-[180px] overflow-hidden ${borderClass}`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-cyan-500" />
      {dataOutput && (
        <div className="bg-cyan-50 dark:bg-cyan-900/30 border-b border-cyan-100 dark:border-cyan-800 p-2 max-h-24 overflow-auto">
          <pre className="text-xs text-cyan-800 dark:text-cyan-200 whitespace-pre-wrap">
            {dataOutput.content?.slice(0, 200)}
            {(dataOutput.content?.length || 0) > 200 && "..."}
          </pre>
          {dataOutput.content && dataOutput.content.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openOutputInspector(id);
              }}
              className="mt-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300 hover:underline"
            >
              View Full Output
            </button>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3 h-3 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-sm text-cyan-700 dark:text-cyan-400">
            {data.providerLabel || data.providerName}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-zinc-400">
          {data.params.prompt ? (
            <div className="truncate">{String(data.params.prompt).slice(0, 30)}...</div>
          ) : null}
        </div>
        {/* Show output schema info if defined */}
        {hasMultiOutput && (
          <div className="mt-2 pt-2 border-t border-cyan-200 dark:border-cyan-800">
            <div className="text-[10px] text-cyan-500 dark:text-cyan-400 font-medium mb-1">
              Outputs:
            </div>
            {outputProperties.map(([key]) => (
              <div
                key={key}
                className="text-[10px] text-gray-500 dark:text-zinc-400 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                {key}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Multi-output handles: one for each schema property */}
      {hasMultiOutput ? (
        <>
          {/* Full output handle (backward compat) */}
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="w-3 h-3 !bg-cyan-500"
            style={{ top: "50%" }}
            title="Full JSON output"
          />
          {/* Individual property handles */}
          {outputProperties.map(([key, prop], index) => (
            <Handle
              key={key}
              type="source"
              position={Position.Right}
              id={`output.${key}`}
              className="w-2.5 h-2.5 !bg-cyan-400"
              style={{
                top: `${70 + index * 14}%`,
              }}
              title={`${key}: ${prop.description || prop.type}`}
            />
          ))}
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-cyan-500" />
      )}
    </div>
  );
});

// Text Node (AI text generation - has optional input and output)
// Supports multiple output handles when outputSchema is defined
export const TextNode = memo(function TextNode({ id, data, selected }: NodeProps<TextNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);
  const dataOutput = useWorkflowStore((s) => s.execution.dataOutputs?.[id]);
  const openOutputInspector = useWorkflowStore((s) => s.openOutputInspector);

  const executionClass = getExecutionClass(nodeStatus);
  const borderClass = executionClass || (selected ? "border-pink-500" : "border-pink-200");

  // Get output schema properties for multi-output handles
  const outputProperties = data.outputSchema?.properties
    ? Object.entries(data.outputSchema.properties)
    : [];
  const hasMultiOutput = outputProperties.length > 0;

  return (
    <div
      className={`rounded-lg border-2 bg-white dark:bg-zinc-800 shadow-md min-w-[180px] overflow-hidden ${borderClass}`}
    >
      <Handle type="target" position={Position.Left} className="w-3 h-3 !bg-pink-500" />
      {dataOutput && (
        <div className="bg-pink-50 dark:bg-pink-900/30 border-b border-pink-100 dark:border-pink-800 p-2 max-h-24 overflow-auto">
          <pre className="text-xs text-pink-800 dark:text-pink-200 whitespace-pre-wrap">
            {dataOutput.content?.slice(0, 200)}
            {(dataOutput.content?.length || 0) > 200 && "..."}
          </pre>
          {dataOutput.content && dataOutput.content.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openOutputInspector(id);
              }}
              className="mt-1 text-xs text-pink-600 dark:text-pink-400 hover:text-pink-800 dark:hover:text-pink-300 hover:underline"
            >
              View Full Output
            </button>
          )}
        </div>
      )}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-2">
          <svg className="w-3 h-3 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
          <span className="font-semibold text-sm text-pink-700 dark:text-pink-400">
            {data.providerLabel || data.providerName}
          </span>
        </div>
        <div className="text-xs text-gray-500 dark:text-zinc-400">
          {data.params.prompt ? (
            <div className="truncate">{String(data.params.prompt).slice(0, 30)}...</div>
          ) : null}
        </div>
        {/* Show output schema info if defined */}
        {hasMultiOutput && (
          <div className="mt-2 pt-2 border-t border-pink-200 dark:border-pink-800">
            <div className="text-[10px] text-pink-500 dark:text-pink-400 font-medium mb-1">
              Outputs:
            </div>
            {outputProperties.map(([key]) => (
              <div
                key={key}
                className="text-[10px] text-gray-500 dark:text-zinc-400 flex items-center gap-1"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400"></span>
                {key}
              </div>
            ))}
          </div>
        )}
      </div>
      {/* Multi-output handles: one for each schema property */}
      {hasMultiOutput ? (
        <>
          {/* Full output handle (backward compat) */}
          <Handle
            type="source"
            position={Position.Right}
            id="output"
            className="w-3 h-3 !bg-pink-500"
            style={{ top: "50%" }}
            title="Full JSON output"
          />
          {/* Individual property handles */}
          {outputProperties.map(([key, prop], index) => (
            <Handle
              key={key}
              type="source"
              position={Position.Right}
              id={`output.${key}`}
              className="w-2.5 h-2.5 !bg-pink-400"
              style={{
                top: `${70 + index * 14}%`,
              }}
              title={`${key}: ${prop.description || prop.type}`}
            />
          ))}
        </>
      ) : (
        <Handle type="source" position={Position.Right} className="w-3 h-3 !bg-pink-500" />
      )}
    </div>
  );
});

export const nodeTypes = {
  generator: GeneratorNode,
  transform: TransformNode,
  save: SaveNode,
  input: InputNode,
  vision: VisionNode,
  text: TextNode,
};
