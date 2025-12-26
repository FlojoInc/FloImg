import { useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  type Connection,
  type NodeMouseHandler,
  type OnNodesChange,
  type OnEdgesChange,
  type DefaultEdgeOptions,
  applyNodeChanges,
  applyEdgeChanges,
} from "reactflow";
import "reactflow/dist/style.css";
import { useWorkflowStore } from "../stores/workflowStore";
import { nodeTypes } from "./nodeTypes";

// Default edge styling with arrows to show direction
const defaultEdgeOptions: DefaultEdgeOptions = {
  type: "smoothstep",
  animated: false,
  markerEnd: {
    type: MarkerType.ArrowClosed,
    color: "#64748b",
    width: 20,
    height: 20,
  },
  style: {
    stroke: "#64748b",
    strokeWidth: 2,
  },
};

export function WorkflowEditor() {
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const addEdge = useWorkflowStore((s) => s.addEdge);
  const setSelectedNode = useWorkflowStore((s) => s.setSelectedNode);

  // Validate connections based on node types
  const isValidConnection = useCallback(
    (connection: Connection) => {
      const { source, target } = connection;
      if (!source || !target) return false;

      const sourceNode = nodes.find((n) => n.id === source);
      const targetNode = nodes.find((n) => n.id === target);

      if (!sourceNode || !targetNode) return false;

      // Rule 1: Cannot connect FROM a save node (no output)
      if (sourceNode.type === "save") return false;

      // Rule 2: Cannot connect TO a generator or input (no input port)
      if (targetNode.type === "generator" || targetNode.type === "input") return false;

      // Rule 3: Each input port only accepts one connection
      const existingInputConnection = edges.find((e) => e.target === target);
      if (existingInputConnection) return false;

      // Rule 4: No self-connections
      if (source === target) return false;

      return true;
    },
    [nodes, edges]
  );

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
      addEdge(connection);
    },
    [addEdge]
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
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        isValidConnection={isValidConnection}
        nodesDraggable={true}
        nodesConnectable={true}
        elementsSelectable={true}
        proOptions={{ hideAttribution: true }}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
      >
        <Background />
        <Controls />
        <MiniMap nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  );
}
