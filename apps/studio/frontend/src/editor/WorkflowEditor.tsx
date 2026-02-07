import { useCallback, useMemo, useRef } from "react";
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  MarkerType,
  type Connection,
  type NodeMouseHandler,
  type OnNodesChange,
  type OnEdgesChange,
  type DefaultEdgeOptions,
  type EdgeTypes,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import "./studio-theme.css";
import type { GeneratorNodeData } from "@teamflojo/floimg-studio-shared";
import { useWorkflowStore } from "../stores/workflowStore";
import { useNotificationStore } from "../stores/notificationStore";
import { nodeTypes } from "./nodeTypes";
import { WarningEdge } from "./WarningEdge";

// Custom edge types for warning visualization
const edgeTypes: EdgeTypes = {
  warning: WarningEdge,
};

// Premium edge styling with refined colors
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#71717a",
    width: 18,
    height: 18,
  },
  style: {
    stroke: "#71717a",
    strokeWidth: 2,
    strokeLinecap: "round",
  },
  // Make edges easier to select
  interactionWidth: 20,
};

export function WorkflowEditor() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);
  const showNotification = useNotificationStore((s) => s.showNotification);

  // Track last rejection reason for onConnectEnd feedback
  const lastRejectionReason = useRef<string | null>(null);

  // Memoize nodeTypes to prevent React Flow warning during HMR
  // The nodeTypes object is defined outside, but HMR can cause module re-evaluation
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  // Validate connections based on node types
  // Returns true if valid, sets rejection reason if not
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const { source, target, targetHandle } = connection;
      lastRejectionReason.current = null;

      if (!source || !target) return false;

      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (!sourceNode || !targetNode) return false;

      // Get node labels for clear error messages
      const sourceData = sourceNode.data as Record<string, unknown>;
      const targetData = targetNode.data as Record<string, unknown>;
      const sourceLabel =
        (sourceData.providerLabel as string) || (sourceData.label as string) || sourceNode.type;
      const targetLabel =
        (targetData.providerLabel as string) || (targetData.label as string) || targetNode.type;

      // Rule 1: Cannot connect FROM a save node (no output)
      if (sourceNode.type === "save") {
        lastRejectionReason.current = `${sourceLabel} has no output to connect`;
        return false;
      }

      // Rule 2: Cannot connect TO a generator UNLESS it has specific input handles
      // AI generators have "text" (for prompts) and "references" (for reference images) handles
      if (targetNode.type === "generator") {
        const data = targetNode.data as GeneratorNodeData;
        // Allow connections to text handle if it's an AI generator
        if (targetHandle === "text" && data.isAI) return true;
        // Allow connections to references handle if it accepts reference images
        if (targetHandle === "references" && data.acceptsReferenceImages) return true;
        // Block all other connections to generators
        lastRejectionReason.current = `${targetLabel} doesn't accept this input type`;
        return false;
      }

      // Rule 3: Cannot connect TO an input node (no input port)
      if (targetNode.type === "input") {
        lastRejectionReason.current = `${targetLabel} is an input node and can't receive connections`;
        return false;
      }

      // Rule 4: No self-connections
      if (source === target) {
        lastRejectionReason.current = "Cannot connect a node to itself";
        return false;
      }

      // Note: We allow replacing existing connections - handled in onConnect
      return true;
    },
    [nodes]
  );

  // Show notification when a connection is rejected
  const onConnectEnd = useCallback(() => {
    if (lastRejectionReason.current) {
      showNotification(lastRejectionReason.current, "warning", 3000);
      lastRejectionReason.current = null;
    }
  }, [showNotification]);

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
    },
    [edges, setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      // "references" handles accept multiple connections (for reference images)
      // All other handles (text, image, default) are single-connection and auto-replace
      const isMultiConnectionHandle = connection.targetHandle === "references";

      if (!isMultiConnectionHandle) {
        // Remove any existing connection to the same target handle before adding new one
        // Handle edge creation inconsistencies from AI generation or YAML import
        const edgesToRemove = edges.filter((e) => {
          if (e.target !== connection.target) return false;

          // Exact handle match (including both being null/undefined)
          const existingHandle = e.targetHandle || null;
          const newHandle = connection.targetHandle || null;
          if (existingHandle === newHandle) return true;

          // For "text" or "image" handle connections, also remove edges with no targetHandle
          // These are the primary single-input handles that should auto-replace
          if (
            (connection.targetHandle === "text" || connection.targetHandle === "image") &&
            !e.targetHandle
          ) {
            return true;
          }

          // If connecting to default handle (no targetHandle), remove edges to "image" handle
          // since that's the main input for transforms
          if (!connection.targetHandle && e.targetHandle === "image") {
            return true;
          }

          return false;
        });

        if (edgesToRemove.length > 0) {
          const removeIds = new Set(edgesToRemove.map((e) => e.id));
          setEdges(edges.filter((e) => !removeIds.has(e.id)));
        }
      }
      addEdge(connection);
    },
    [addEdge, edges, setEdges]
  );

  const onNodeClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      setSelectedNode(node.id);
    },
    [setSelectedNode]
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  return (
    <div className="h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={memoizedNodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        edgesFocusable={true}
        deleteKeyCode={["Backspace", "Delete"]}
        proOptions={{ hideAttribution: true }}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        minZoom={0.1}
        maxZoom={4}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1.5} />
        <Controls showInteractive={false} />
        <MiniMap
          nodeStrokeWidth={2}
          nodeColor="#71717a"
          maskColor="rgba(0, 0, 0, 0.1)"
          zoomable
          pannable
        />
      </ReactFlow>
    </div>
  );
}
