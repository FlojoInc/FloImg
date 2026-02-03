import { memo, useCallback, useRef, useState, useEffect } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import type {
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  InputNodeData,
  VisionNodeData,
  TextNodeData,
  FanOutNodeData,
  CollectNodeData,
  RouterNodeData,
} from "@teamflojo/floimg-studio-shared";
import { useWorkflowStore } from "../stores/workflowStore";
import { useRequiredStorageAdapter } from "../providers/StorageAdapterProvider";

// Helper to get execution status class for node styling
function getExecutionClass(nodeStatus: string | undefined): string {
  if (nodeStatus === "pending") return "floimg-node--pending";
  if (nodeStatus === "running") return "floimg-node--running";
  if (nodeStatus === "completed") return "floimg-node--completed";
  if (nodeStatus === "error") return "floimg-node--error";
  return "";
}

// Format duration for display (e.g., "1.2s", "45s", "1m 23s")
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

// Timing badge shown on nodes after execution
function TimingBadge({ nodeId }: { nodeId: string }) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[nodeId]);
  const nodeTiming = useWorkflowStore((s) => s.execution.nodeTiming[nodeId]);
  const [elapsed, setElapsed] = useState(0);

  // Live counter for running nodes
  useEffect(() => {
    if (nodeStatus !== "running" || !nodeTiming?.startTime) {
      return;
    }

    // Update elapsed time every 100ms while running
    // Using setInterval instead of RAF for consistent 100ms updates
    const interval = setInterval(() => {
      const startTime = nodeTiming.startTime;
      if (!startTime) return;
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [nodeStatus, nodeTiming?.startTime]);

  // Show elapsed time while running
  if (nodeStatus === "running" && nodeTiming?.startTime) {
    return (
      <div className="floimg-node__timing floimg-node__timing--running" title="Running...">
        {formatDuration(elapsed)}
      </div>
    );
  }

  // Show duration after completion
  if ((nodeStatus === "completed" || nodeStatus === "error") && nodeTiming?.duration) {
    const isSlow = nodeTiming.duration > 5000;
    return (
      <div
        className={`floimg-node__timing ${isSlow ? "floimg-node__timing--slow" : ""}`}
        title={`Completed in ${formatDuration(nodeTiming.duration)}`}
      >
        {formatDuration(nodeTiming.duration)}
      </div>
    );
  }

  return null;
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

// Error badge shown on nodes that failed during execution
function ErrorBadge({ nodeId }: { nodeId: string }) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[nodeId]);
  const errorNodeId = useWorkflowStore((s) => s.execution.errorNodeId);
  const error = useWorkflowStore((s) => s.execution.error);

  // Only show badge if this node is in error state
  if (nodeStatus !== "error") return null;

  // Get error message - only show if this is the node that caused the error
  const errorMessage = errorNodeId === nodeId ? error : "Execution failed";

  return (
    <div className="floimg-node__error-badge" title={errorMessage || "Execution failed"}>
      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
          clipRule="evenodd"
        />
      </svg>
    </div>
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

  // AI generators get a text input handle for dynamic prompts
  const isAI = data.isAI;
  // Check if this generator accepts reference images
  const acceptsReferences = data.acceptsReferenceImages;

  return (
    <div
      className={`floimg-node floimg-node--generator relative min-w-[190px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      {/* Text input handle for AI generators (optional - for dynamic prompts) */}
      {isAI && (
        <Handle
          type="target"
          position={Position.Top}
          id="text"
          className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
          title="Text input (optional prompt from text/vision node)"
        />
      )}
      {/* Reference images input handle (for AI generators) */}
      {acceptsReferences && (
        <Handle
          type="target"
          position={Position.Left}
          id="references"
          className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white dark:!border-zinc-800"
          style={{ top: "50%" }}
          title={`Reference images (up to ${data.maxReferenceImages || 14})`}
        />
      )}
      {preview && previewVisible && (
        <div className="floimg-node__preview">
          <img src={preview} alt="Preview" className="w-full h-20 object-contain rounded-md" />
        </div>
      )}
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />
      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-blue-500/10">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
        </div>
        <span className="floimg-node__title text-blue-600 dark:text-blue-400">
          {data.generatorName}
        </span>
        <PreviewToggle
          nodeId={id}
          color="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        />
      </div>
      <div className="floimg-node__content">
        {isAI && (
          <div className="text-[10px] text-pink-500/80 dark:text-pink-400/80 mb-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-pink-400" />
            Text input for dynamic prompt
          </div>
        )}
        {acceptsReferences && (
          <div className="text-[10px] text-violet-500/80 dark:text-violet-400/80 mb-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-violet-400" />
            Reference images
          </div>
        )}
        <div className="space-y-0.5">
          {Object.entries(data.params)
            .filter(([, value]) => typeof value !== "object" || value === null)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key} className="floimg-node__param truncate">
                <span className="text-zinc-400 dark:text-zinc-500">{key}:</span>{" "}
                {String(value).slice(0, 20)}
              </div>
            ))}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-white dark:!border-zinc-800"
      />
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

  // AI transforms get an indigo accent to indicate AI-powered
  const isAI = data.isAI;
  // Check if this transform accepts reference images
  const acceptsReferences = data.acceptsReferenceImages;

  const nodeTypeClass = isAI ? "floimg-node--ai-transform" : "floimg-node--transform";

  return (
    <div
      className={`floimg-node ${nodeTypeClass} relative min-w-[190px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      {/* Text input handle for AI transforms (optional - for dynamic prompts) */}
      {isAI && (
        <Handle
          type="target"
          position={Position.Top}
          id="text"
          className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
          title="Text input (optional prompt from text/vision node)"
        />
      )}
      {/* Image input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        className="!w-3 !h-3 !bg-teal-500 !border-2 !border-white dark:!border-zinc-800"
      />
      {/* Reference images input handle (for AI transforms that accept additional references) */}
      {acceptsReferences && (
        <Handle
          type="target"
          position={Position.Bottom}
          id="references"
          className="!w-3 !h-3 !bg-violet-500 !border-2 !border-white dark:!border-zinc-800"
          title={`Reference images (up to ${data.maxReferenceImages || 13})`}
        />
      )}
      {preview && previewVisible && (
        <div className="floimg-node__preview">
          <img src={preview} alt="Preview" className="w-full h-20 object-contain rounded-md" />
        </div>
      )}
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />
      <div className="floimg-node__header">
        <div className={`floimg-node__icon ${isAI ? "bg-indigo-500/10" : "bg-teal-500/10"}`}>
          {isAI ? (
            <svg className="w-2.5 h-2.5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M13 7H7v6h6V7z" />
              <path
                fillRule="evenodd"
                d="M7 2a1 1 0 012 0v1h2V2a1 1 0 112 0v1h2a2 2 0 012 2v2h1a1 1 0 110 2h-1v2h1a1 1 0 110 2h-1v2a2 2 0 01-2 2h-2v1a1 1 0 11-2 0v-1H9v1a1 1 0 11-2 0v-1H5a2 2 0 01-2-2v-2H2a1 1 0 110-2h1V9H2a1 1 0 010-2h1V5a2 2 0 012-2h2V2zM5 5h10v10H5V5z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <div className="w-2 h-2 rounded-full bg-teal-500" />
          )}
        </div>
        <span
          className={`floimg-node__title ${isAI ? "text-indigo-600 dark:text-indigo-400" : "text-teal-600 dark:text-teal-400"}`}
        >
          {data.operation}
        </span>
        <PreviewToggle
          nodeId={id}
          color="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        />
      </div>
      <div className="floimg-node__content">
        {isAI && (
          <div className="text-[10px] text-pink-500/80 dark:text-pink-400/80 mb-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-pink-400" />
            Text input for dynamic prompt
          </div>
        )}
        {acceptsReferences && (
          <div className="text-[10px] text-violet-500/80 dark:text-violet-400/80 mb-1.5 flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-violet-400" />
            Reference images
          </div>
        )}
        <div className="space-y-0.5">
          {Object.entries(data.params)
            .filter(([, value]) => typeof value !== "object" || value === null)
            .slice(0, 2)
            .map(([key, value]) => (
              <div key={key} className="floimg-node__param truncate">
                <span className="text-zinc-400 dark:text-zinc-500">{key}:</span>{" "}
                {String(value).slice(0, 20)}
              </div>
            ))}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className={`!w-3 !h-3 ${isAI ? "!bg-indigo-500" : "!bg-teal-500"} !border-2 !border-white dark:!border-zinc-800`}
      />
    </div>
  );
});

// Save Node (sink nodes - have input only)
export const SaveNode = memo(function SaveNode({ id, data, selected }: NodeProps<SaveNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);

  const executionClass = getExecutionClass(nodeStatus);

  return (
    <div
      className={`floimg-node floimg-node--save relative min-w-[190px] ${selected ? "selected" : ""} ${executionClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-white dark:!border-zinc-800"
      />
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />
      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-emerald-500/10">
          <svg
            className="w-2.5 h-2.5 text-emerald-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <span className="floimg-node__title text-emerald-600 dark:text-emerald-400">Save</span>
      </div>
      <div className="floimg-node__content">
        <div className="floimg-node__param truncate">{data.destination}</div>
      </div>
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
  const storageAdapter = useRequiredStorageAdapter();

  const executionClass = getExecutionClass(nodeStatus);

  // Handle file selection via storage adapter
  const handleFileSelect = useCallback(
    async (file: File) => {
      try {
        const result = await storageAdapter.upload(file);
        updateNodeData(id, {
          uploadId: result.reference,
          filename: result.filename,
          mime: result.mime,
        });
      } catch (error) {
        console.error("Upload failed:", error);
      }
    },
    [id, updateNodeData, storageAdapter]
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
  const getPreviewUrl = useCallback(() => {
    if (preview) return preview;
    if (!data.uploadId) return null;
    return storageAdapter.getPreviewUrl(data.uploadId);
  }, [preview, data.uploadId, storageAdapter]);

  const previewUrl = getPreviewUrl();

  return (
    <div
      className={`floimg-node floimg-node--input relative min-w-[190px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      {previewUrl && previewVisible ? (
        <div className="floimg-node__preview">
          <img
            src={previewUrl}
            alt="Uploaded"
            className="w-full h-20 object-contain rounded-md"
            crossOrigin="use-credentials"
          />
        </div>
      ) : !previewUrl ? (
        <div
          className="h-20 flex items-center justify-center cursor-pointer bg-amber-50/50 dark:bg-amber-900/20 hover:bg-amber-100/50 dark:hover:bg-amber-900/30 transition-colors border-b border-amber-100/50 dark:border-amber-800/30"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          <div className="text-center text-amber-500 dark:text-amber-400">
            <svg
              className="w-6 h-6 mx-auto mb-1 opacity-60"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <div className="text-[10px] opacity-70">Drop or click</div>
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
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />
      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-amber-500/10">
          <svg
            className="w-2.5 h-2.5 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="floimg-node__title text-amber-600 dark:text-amber-400">Input</span>
        <PreviewToggle
          nodeId={id}
          color="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
        />
      </div>
      <div className="floimg-node__content">
        <div className="floimg-node__param truncate">{data.filename || "No image selected"}</div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-zinc-800"
      />
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

  // Get output schema properties for multi-output handles
  const outputProperties = data.outputSchema?.properties
    ? Object.entries(data.outputSchema.properties)
    : [];
  const hasMultiOutput = outputProperties.length > 0;

  return (
    <div
      className={`floimg-node floimg-node--vision relative min-w-[190px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      {/* Text/context input handle (top) - for workflow context */}
      <Handle
        type="target"
        position={Position.Top}
        id="context"
        className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
        title="Context input (optional - from text/vision node for evaluation context)"
      />
      {/* Image input handle (left) - for images to analyze */}
      <Handle
        type="target"
        position={Position.Left}
        id="image"
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white dark:!border-zinc-800"
        title="Image input"
      />
      {dataOutput && (
        <div className="bg-cyan-50/50 dark:bg-cyan-900/20 border-b border-cyan-100/50 dark:border-cyan-800/30 p-2.5 max-h-20 overflow-auto">
          <pre className="text-[11px] text-cyan-700 dark:text-cyan-300 whitespace-pre-wrap font-mono">
            {dataOutput.content?.slice(0, 150)}
            {(dataOutput.content?.length || 0) > 150 && "..."}
          </pre>
          {dataOutput.content && dataOutput.content.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openOutputInspector(id);
              }}
              className="mt-1.5 text-[10px] text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium"
            >
              View Full Output
            </button>
          )}
        </div>
      )}
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />
      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-cyan-500/10">
          <svg className="w-2.5 h-2.5 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
            <path
              fillRule="evenodd"
              d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span className="floimg-node__title text-cyan-600 dark:text-cyan-400">
          {data.providerLabel || data.providerName}
        </span>
      </div>
      <div className="floimg-node__content">
        {data.params.prompt ? (
          <div className="floimg-node__param truncate">
            {String(data.params.prompt).slice(0, 30)}...
          </div>
        ) : null}
        {/* Show output schema info if defined - limit to 3 to keep node compact */}
        {hasMultiOutput && (
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
            <div className="text-[10px] text-cyan-500 dark:text-cyan-400 font-medium mb-1">
              Outputs:
            </div>
            {outputProperties.slice(0, 3).map(([key]) => (
              <div
                key={key}
                className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
                {key}
              </div>
            ))}
            {outputProperties.length > 3 && (
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                +{outputProperties.length - 3} more
              </div>
            )}
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
            className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white dark:!border-zinc-800"
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
              className="!w-2.5 !h-2.5 !bg-cyan-400 !border-2 !border-white dark:!border-zinc-800"
              style={{
                top: `${70 + index * 14}%`,
              }}
              title={`${key}: ${prop.description || prop.type}`}
            />
          ))}
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white dark:!border-zinc-800"
        />
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

  // Get output schema properties for multi-output handles
  const outputProperties = data.outputSchema?.properties
    ? Object.entries(data.outputSchema.properties)
    : [];
  const hasMultiOutput = outputProperties.length > 0;

  return (
    <div
      className={`floimg-node floimg-node--text relative min-w-[190px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
      />
      {dataOutput && (
        <div className="bg-pink-50/50 dark:bg-pink-900/20 border-b border-pink-100/50 dark:border-pink-800/30 p-2.5 max-h-20 overflow-auto">
          <pre className="text-[11px] text-pink-700 dark:text-pink-300 whitespace-pre-wrap font-mono">
            {dataOutput.content?.slice(0, 150)}
            {(dataOutput.content?.length || 0) > 150 && "..."}
          </pre>
          {dataOutput.content && dataOutput.content.length > 100 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openOutputInspector(id);
              }}
              className="mt-1.5 text-[10px] text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 font-medium"
            >
              View Full Output
            </button>
          )}
        </div>
      )}
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />
      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-pink-500/10">
          <svg className="w-2.5 h-2.5 text-pink-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <span className="floimg-node__title text-pink-600 dark:text-pink-400">
          {data.providerLabel || data.providerName}
        </span>
      </div>
      <div className="floimg-node__content">
        {data.params.prompt ? (
          <div className="floimg-node__param truncate">
            {String(data.params.prompt).slice(0, 30)}...
          </div>
        ) : null}
        {/* Show output schema info if defined - limit to 3 to keep node compact */}
        {hasMultiOutput && (
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
            <div className="text-[10px] text-pink-500 dark:text-pink-400 font-medium mb-1">
              Outputs:
            </div>
            {outputProperties.slice(0, 3).map(([key]) => (
              <div
                key={key}
                className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1"
              >
                <span className="w-1 h-1 rounded-full bg-pink-400"></span>
                {key}
              </div>
            ))}
            {outputProperties.length > 3 && (
              <div className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                +{outputProperties.length - 3} more
              </div>
            )}
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
            className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
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
              className="!w-2.5 !h-2.5 !bg-pink-400 !border-2 !border-white dark:!border-zinc-800"
              style={{
                top: `${70 + index * 14}%`,
              }}
              title={`${key}: ${prop.description || prop.type}`}
            />
          ))}
        </>
      ) : (
        <Handle
          type="source"
          position={Position.Right}
          className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
        />
      )}
    </div>
  );
});

// ============================================
// Iterative Workflow Nodes
// ============================================

// Fan-Out Node - distributes execution across parallel branches
export const FanOutNode = memo(function FanOutNode({
  id,
  data,
  selected,
}: NodeProps<FanOutNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);

  const executionClass = getExecutionClass(nodeStatus);

  // Determine output count based on mode
  const outputCount = data.mode === "count" ? data.count || 3 : 3;

  return (
    <div
      className={`floimg-node floimg-node--iterative relative min-w-[170px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      {/* Input handle - accepts data/array from upstream */}
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white dark:!border-zinc-800"
        style={{ top: "50%" }}
      />
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />

      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-orange-500/10">
          <svg
            className="w-2.5 h-2.5 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
        <span className="floimg-node__title text-orange-600 dark:text-orange-400">Fan-Out</span>
        <span className="ml-auto text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium">
          ×{outputCount}
        </span>
      </div>
      <div className="floimg-node__content">
        <div className="floimg-node__param">
          {data.mode === "array" ? (
            <span>Iterate: {data.arrayProperty || "items"}</span>
          ) : (
            <span>Duplicate: {outputCount} copies</span>
          )}
        </div>
      </div>

      {/* Dynamic output handles */}
      {Array.from({ length: outputCount }).map((_, i) => (
        <Handle
          key={i}
          type="source"
          position={Position.Right}
          id={`out[${i}]`}
          className="!w-2.5 !h-2.5 !bg-orange-400 !border-2 !border-white dark:!border-zinc-800"
          style={{
            top: `${((i + 1) / (outputCount + 1)) * 100}%`,
          }}
          title={`Output ${i}`}
        />
      ))}
    </div>
  );
});

// Collect Node - gathers outputs from parallel branches
export const CollectNode = memo(function CollectNode({
  id,
  data,
  selected,
}: NodeProps<CollectNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);

  const executionClass = getExecutionClass(nodeStatus);

  const inputCount = data.expectedInputs || 3;

  return (
    <div
      className={`floimg-node floimg-node--iterative relative min-w-[170px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      {/* Dynamic input handles */}
      {Array.from({ length: inputCount }).map((_, i) => (
        <Handle
          key={i}
          type="target"
          position={Position.Left}
          id={`in[${i}]`}
          className="!w-2.5 !h-2.5 !bg-orange-400 !border-2 !border-white dark:!border-zinc-800"
          style={{
            top: `${((i + 1) / (inputCount + 1)) * 100}%`,
          }}
          title={`Input ${i}`}
        />
      ))}
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />

      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-orange-500/10">
          <svg
            className="w-2.5 h-2.5 text-orange-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 7h12m0 0l-4-4m4 4l-4 4m8 6H8m0 0l4 4m-4-4l4-4"
            />
          </svg>
        </div>
        <span className="floimg-node__title text-orange-600 dark:text-orange-400">Collect</span>
        <span className="ml-auto text-[10px] bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded-full font-medium">
          {inputCount}→1
        </span>
      </div>
      <div className="floimg-node__content">
        <div className="floimg-node__param">
          {data.waitMode === "all" ? "Wait for all" : "Use available"}
        </div>
      </div>

      {/* Output handle - single array output */}
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        className="!w-3 !h-3 !bg-orange-500 !border-2 !border-white dark:!border-zinc-800"
        style={{ top: "50%" }}
      />
    </div>
  );
});

// Router Node - routes based on AI selection
export const RouterNode = memo(function RouterNode({
  id,
  data,
  selected,
}: NodeProps<RouterNodeData>) {
  const nodeStatus = useWorkflowStore((s) => s.execution.nodeStatus[id]);

  const executionClass = getExecutionClass(nodeStatus);

  const hasContextOutput = !!data.contextProperty;

  return (
    <div
      className={`floimg-node floimg-node--iterative relative min-w-[170px] overflow-hidden ${selected ? "selected" : ""} ${executionClass}`}
    >
      {/* Candidates input - array of options */}
      <Handle
        type="target"
        position={Position.Left}
        id="candidates"
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-zinc-800"
        style={{ top: "35%" }}
        title="Candidates (array)"
      />
      {/* Selection input - AI decision data */}
      <Handle
        type="target"
        position={Position.Left}
        id="selection"
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-white dark:!border-zinc-800"
        style={{ top: "65%" }}
        title="Selection (from vision/text)"
      />
      <ErrorBadge nodeId={id} />
      <TimingBadge nodeId={id} />

      <div className="floimg-node__header">
        <div className="floimg-node__icon bg-amber-500/10">
          <svg
            className="w-2.5 h-2.5 text-amber-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 5l7 7-7 7M5 5l7 7-7 7"
            />
          </svg>
        </div>
        <span className="floimg-node__title text-amber-600 dark:text-amber-400">Router</span>
      </div>
      <div className="floimg-node__content">
        <div className="space-y-1">
          <div className="floimg-node__param flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-amber-400"></span>
            candidates
          </div>
          <div className="floimg-node__param flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-cyan-400"></span>
            selection.{data.selectionProperty || "winner"}
          </div>
        </div>
        {hasContextOutput && (
          <div className="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-700/50">
            <div className="text-[10px] text-amber-500/80 dark:text-amber-400/80">
              + context: {data.contextProperty}
            </div>
          </div>
        )}
      </div>

      {/* Winner output */}
      <Handle
        type="source"
        position={Position.Right}
        id="winner"
        className="!w-3 !h-3 !bg-amber-500 !border-2 !border-white dark:!border-zinc-800"
        style={{ top: hasContextOutput ? "35%" : "50%" }}
        title="Selected item"
      />
      {/* Context output (optional) */}
      {hasContextOutput && (
        <Handle
          type="source"
          position={Position.Right}
          id="context"
          className="!w-3 !h-3 !bg-pink-500 !border-2 !border-white dark:!border-zinc-800"
          style={{ top: "65%" }}
          title={`Context: ${data.contextProperty}`}
        />
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
  // Iterative workflow nodes
  fanout: FanOutNode,
  collect: CollectNode,
  router: RouterNode,
};
