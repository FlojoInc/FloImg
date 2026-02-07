import { memo, useState } from "react";
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from "reactflow";

/**
 * Custom edge component that displays warning indicator for ambiguous connections.
 * Used when an image output is connected to a text input when references handle is available.
 *
 * Features:
 * - Dashed amber stroke for visual differentiation
 * - Persistent warning badge visible without hover
 * - Tooltip on hover for full warning message
 */
export const WarningEdge = memo(function WarningEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}: EdgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const warning = data?.warning as string | undefined;

  // Warning edge uses dashed amber stroke
  const warningStyle = {
    stroke: "#f59e0b", // amber-500
    strokeWidth: 2,
    strokeDasharray: "6 4",
    strokeLinecap: "round" as const,
  };

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={warningStyle} />
      {warning && (
        <>
          {/* Invisible wider path for easier hover detection */}
          <path
            d={edgePath}
            fill="none"
            strokeWidth={20}
            stroke="transparent"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
            style={{ cursor: "help" }}
          />
          <EdgeLabelRenderer>
            {/* Always-visible warning badge */}
            <div
              style={{
                position: "absolute",
                transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                pointerEvents: "all",
              }}
              className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow-md cursor-help border-2 border-amber-400"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              <span className="text-white text-[11px] font-bold leading-none">!</span>
            </div>

            {/* Tooltip on hover for full message */}
            {showTooltip && (
              <div
                style={{
                  position: "absolute",
                  transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 16}px)`,
                  pointerEvents: "none",
                  zIndex: 1000,
                }}
                className="px-2.5 py-1.5 bg-amber-50 dark:bg-amber-950 border border-amber-300 dark:border-amber-700 rounded-md shadow-lg text-xs text-amber-800 dark:text-amber-200 max-w-[200px] text-center whitespace-nowrap"
              >
                <div className="flex items-center gap-1.5">
                  <svg
                    className="w-3.5 h-3.5 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{warning}</span>
                </div>
              </div>
            )}
          </EdgeLabelRenderer>
        </>
      )}
    </>
  );
});
