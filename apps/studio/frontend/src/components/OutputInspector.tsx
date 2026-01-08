import { useState, useCallback } from "react";

// Size/depth limits to prevent browser freeze on large outputs
const MAX_JSON_DEPTH = 20;
const MAX_ARRAY_ITEMS = 500;
const LARGE_OUTPUT_THRESHOLD = 100_000; // 100KB

interface DataOutput {
  dataType: "text" | "json";
  content: string;
  parsed?: Record<string, unknown>;
}

interface OutputInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeLabel: string;
  output: DataOutput;
}

export function OutputInspector({ isOpen, onClose, nodeLabel, output }: OutputInspectorProps) {
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    const textToCopy =
      viewMode === "formatted" && output.parsed
        ? JSON.stringify(output.parsed, null, 2)
        : output.content;

    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [viewMode, output]);

  if (!isOpen) return null;

  const hasFormattedView = output.dataType === "json" && output.parsed;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <svg
              className="h-5 w-5 text-pink-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {nodeLabel} Output
              </h3>
              <span className="text-xs text-gray-500 dark:text-zinc-400">
                {output.dataType === "json" ? "Structured JSON" : "Text"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            {hasFormattedView && (
              <div className="flex bg-gray-100 dark:bg-zinc-700 rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode("formatted")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "formatted"
                      ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Formatted
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    viewMode === "raw"
                      ? "bg-white dark:bg-zinc-600 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Raw
                </button>
              </div>
            )}
            {/* Close button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Large output warning */}
        {output.content.length > LARGE_OUTPUT_THRESHOLD && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 flex items-center gap-2">
            <svg
              className="h-4 w-4 text-amber-600 dark:text-amber-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <span className="text-sm text-amber-700 dark:text-amber-300">
              Large output ({Math.round(output.content.length / 1024)}KB) - rendering may be slow
            </span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {viewMode === "formatted" && hasFormattedView ? (
            <JsonTree data={output.parsed!} />
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-zinc-200 bg-gray-50 dark:bg-zinc-900 rounded-lg p-4 overflow-auto">
              {output.content}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            {output.content.length.toLocaleString()} characters
          </span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-900/30 rounded-lg transition-colors"
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy to Clipboard
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple JSON tree viewer component with depth/size limits
function JsonTree({ data }: { data: Record<string, unknown> }) {
  return (
    <div className="font-mono text-sm">
      <JsonNode value={data} depth={0} maxDepth={MAX_JSON_DEPTH} />
    </div>
  );
}

interface JsonNodeProps {
  value: unknown;
  depth: number;
  keyName?: string;
  maxDepth: number;
}

function JsonNode({ value, depth, keyName, maxDepth }: JsonNodeProps) {
  const indent = depth * 16;

  // Check depth limit
  if (depth >= maxDepth) {
    return (
      <div style={{ marginLeft: indent }} className="py-0.5">
        {keyName && <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-600 dark:text-zinc-400">: </span>}
        <span className="text-zinc-500 italic">[max depth reached]</span>
      </div>
    );
  }

  if (value === null) {
    return (
      <div style={{ marginLeft: indent }} className="py-0.5">
        {keyName && <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-600 dark:text-zinc-400">: </span>}
        <span className="text-gray-500 dark:text-zinc-500">null</span>
      </div>
    );
  }

  if (typeof value === "boolean") {
    return (
      <div style={{ marginLeft: indent }} className="py-0.5">
        {keyName && <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-600 dark:text-zinc-400">: </span>}
        <span className="text-blue-600 dark:text-blue-400">{value.toString()}</span>
      </div>
    );
  }

  if (typeof value === "number") {
    return (
      <div style={{ marginLeft: indent }} className="py-0.5">
        {keyName && <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-600 dark:text-zinc-400">: </span>}
        <span className="text-green-600 dark:text-green-400">{value}</span>
      </div>
    );
  }

  if (typeof value === "string") {
    // Truncate long strings in the tree view
    const displayValue = value.length > 100 ? value.slice(0, 100) + "..." : value;
    return (
      <div style={{ marginLeft: indent }} className="py-0.5">
        {keyName && <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>}
        {keyName && <span className="text-gray-600 dark:text-zinc-400">: </span>}
        <span className="text-amber-600 dark:text-amber-400">&quot;{displayValue}&quot;</span>
      </div>
    );
  }

  if (Array.isArray(value)) {
    const itemsToRender = value.slice(0, MAX_ARRAY_ITEMS);
    const hiddenCount = value.length - itemsToRender.length;

    return (
      <div style={{ marginLeft: indent }}>
        {keyName && (
          <div className="py-0.5">
            <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>
            <span className="text-gray-600 dark:text-zinc-400">: </span>
            <span className="text-gray-500 dark:text-zinc-500">[{value.length} items]</span>
          </div>
        )}
        {!keyName && <span className="text-gray-500 dark:text-zinc-500 py-0.5 block">[</span>}
        {itemsToRender.map((item, index) => (
          <JsonNode key={index} value={item} depth={depth + 1} maxDepth={maxDepth} />
        ))}
        {hiddenCount > 0 && (
          <div style={{ marginLeft: (depth + 1) * 16 }} className="py-0.5 text-zinc-500 italic">
            ...and {hiddenCount} more items
          </div>
        )}
        {!keyName && <span className="text-gray-500 dark:text-zinc-500 py-0.5 block">]</span>}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value);
    return (
      <div style={{ marginLeft: indent }}>
        {keyName && (
          <div className="py-0.5">
            <span className="text-pink-600 dark:text-pink-400">&quot;{keyName}&quot;</span>
            <span className="text-gray-600 dark:text-zinc-400">: </span>
            <span className="text-gray-500 dark:text-zinc-500">{"{"}</span>
          </div>
        )}
        {!keyName && <span className="text-gray-500 dark:text-zinc-500 py-0.5 block">{"{"}</span>}
        {entries.map(([key, val]) => (
          <JsonNode key={key} value={val} depth={depth + 1} keyName={key} maxDepth={maxDepth} />
        ))}
        <div style={{ marginLeft: keyName ? 0 : indent }} className="py-0.5">
          <span className="text-gray-500 dark:text-zinc-500">{"}"}</span>
        </div>
      </div>
    );
  }

  return null;
}
