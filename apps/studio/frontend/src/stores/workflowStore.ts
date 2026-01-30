import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Node, Edge, Connection } from "reactflow";
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
  NodeDefinition,
  GeneratedWorkflowData,
  StudioNodeType,
  ExecutionSSEEvent,
  ErrorCategory,
} from "@teamflojo/floimg-studio-shared";
import { nodesToPipeline } from "@teamflojo/floimg-studio-shared";
import type { Template } from "@teamflojo/floimg-studio-shared";
import { exportYaml } from "../api/client";
import { createSSEConnection, type SSEConnection } from "../api/sse";

// Module-level variable to store active SSE connection (not in store since it's not serializable)
let activeExecutionConnection: SSEConnection | null = null;
// Track execution start time for duration calculation
let executionStartTime: number | null = null;
import type { StudioNode, StudioEdge, StudioNodeData } from "@teamflojo/floimg-studio-shared";
import { useSettingsStore } from "./settingsStore";

type NodeData =
  | GeneratorNodeData
  | TransformNodeData
  | SaveNodeData
  | InputNodeData
  | VisionNodeData
  | TextNodeData
  | FanOutNodeData
  | CollectNodeData
  | RouterNodeData;

type NodeExecutionStatus = "idle" | "pending" | "running" | "completed" | "error";

interface DataOutput {
  dataType: "text" | "json";
  content: string;
  parsed?: Record<string, unknown>;
}

// Execution history entry - stores data URLs for universal access (works for all user types)
export interface ExecutionRunOutput {
  nodeId: string;
  nodeName: string;
  preview: string; // data URL (base64) - works for guests, self-hosted, and cloud users
  imageId?: string; // if saved to storage (FSC authenticated only)
}

export interface ExecutionRun {
  id: string;
  timestamp: number;
  status: "completed" | "error";
  duration: number; // milliseconds
  nodeCount: number;
  outputs: ExecutionRunOutput[];
  error?: string;
  errorNodeId?: string;
}

// Saved workflow structure for persistence
export interface SavedWorkflow {
  id: string;
  name: string;
  nodes: Node<NodeData>[];
  edges: Edge[];
  createdAt: number;
  updatedAt: number;
  templateId?: string;
}

interface ExecutionState {
  status: "idle" | "running" | "completed" | "error";
  imageIds: string[];
  imageUrls: string[]; // Presigned cloud URLs for thumbnails (FSC only)
  previews: Record<string, string>; // nodeId -> data URL
  dataOutputs: Record<string, DataOutput>; // nodeId -> text/json output (for vision/text nodes)
  nodeStatus: Record<string, NodeExecutionStatus>; // per-node execution status
  /** Per-node timing: startTime when running, duration when completed */
  nodeTiming: Record<string, { startTime?: number; duration?: number }>;
  error?: string;
  /** ID of the node that caused the error (for error highlighting) */
  errorNodeId?: string;
  /** Machine-readable error code (e.g., "GENERATION_ERROR", "NETWORK_ERROR") */
  errorCode?: string;
  /** Error category for handling strategies */
  errorCategory?: ErrorCategory;
  /** Whether the operation can be retried */
  retryable?: boolean;
}

interface WorkflowStore {
  // Nodes and edges (React Flow compatible)
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Template tracking
  currentTemplateId: string | null;
  loadTemplate: (template: Template) => void;
  clearWorkflow: () => void;

  // Workflow persistence
  savedWorkflows: SavedWorkflow[];
  activeWorkflowId: string | null;
  activeWorkflowName: string;
  hasUnsavedChanges: boolean;
  showLibrary: boolean;

  // Remix/fork attribution
  parentWorkflowId: string | null;

  // Workflow persistence methods
  saveWorkflow: (name?: string) => string;
  loadWorkflow: (id: string) => void;
  deleteWorkflow: (id: string) => void;
  renameWorkflow: (id: string, name: string) => void;
  duplicateWorkflow: (id: string) => string;
  newWorkflow: () => void;
  setActiveWorkflowName: (name: string) => void;
  toggleLibrary: () => void;
  markDirty: () => void;

  // Preview visibility per node (default: true)
  previewVisible: Record<string, boolean>;
  togglePreview: (id: string) => void;

  // Node registry
  generators: NodeDefinition[];
  transforms: NodeDefinition[];
  textProviders: NodeDefinition[];
  visionProviders: NodeDefinition[];
  setGenerators: (generators: NodeDefinition[]) => void;
  setTransforms: (transforms: NodeDefinition[]) => void;
  setTextProviders: (textProviders: NodeDefinition[]) => void;
  setVisionProviders: (visionProviders: NodeDefinition[]) => void;

  // Node operations
  addNode: (definition: NodeDefinition, position: { x: number; y: number }) => void;
  updateNodeData: (id: string, data: Partial<NodeData>) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  setNodes: (nodes: Node<NodeData>[]) => void;

  // Edge operations
  addEdge: (connection: Connection) => void;
  deleteEdge: (id: string) => void;
  setEdges: (edges: Edge[]) => void;

  // Selection
  setSelectedNode: (id: string | null) => void;

  // Execution
  execution: ExecutionState;
  execute: () => Promise<void>;
  cancelExecution: () => void;

  // Execution history - stores past runs with data URLs for universal access
  executionHistory: ExecutionRun[];
  addExecutionRun: (run: ExecutionRun) => void;
  clearHistory: () => void;
  // Unseen runs indicator - counts runs since last viewing History tab
  unseenRunCount: number;
  hasUnseenErrors: boolean; // True if any unseen run has errors
  markRunsAsSeen: () => void;
  // Pinned runs - favorite runs that persist at top of history
  pinnedRunIds: string[];
  togglePinRun: (runId: string) => void;

  // Export
  exportToYaml: () => Promise<string>;

  // Import
  importFromYaml: (nodes: StudioNode[], edges: StudioEdge[], name?: string) => void;

  // AI-generated workflow
  loadGeneratedWorkflow: (workflow: GeneratedWorkflowData) => void;

  // Remix/fork loading
  loadRemixImage: (imageUrl: string) => void;
  loadFromWorkflowJson: (
    json: { nodes: StudioNode[]; edges: StudioEdge[] },
    metadata?: { name?: string; parentWorkflowId?: string }
  ) => void;

  // Output inspector
  inspectedNodeId: string | null;
  openOutputInspector: (nodeId: string) => void;
  closeOutputInspector: () => void;
}

let nodeIdCounter = 0;

function generateNodeId(): string {
  return `node_${++nodeIdCounter}`;
}

// Helper to generate unique workflow IDs
function generateWorkflowId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `wf_${timestamp}_${random}`;
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => {
      // Helper to enrich node data with definition properties (isAI, acceptsReferenceImages, etc.)
      // Used by loadTemplate, importFromYaml, and loadGeneratedWorkflow
      const enrichNodeData = (studioNode: StudioNode): NodeData => {
        if (studioNode.type === "generator") {
          const data = studioNode.data as GeneratorNodeData;
          const def = get().generators.find((g) => g.name === data.generatorName);
          return {
            ...data,
            isAI: data.isAI ?? def?.isAI,
            acceptsReferenceImages: data.acceptsReferenceImages ?? def?.acceptsReferenceImages,
            maxReferenceImages: data.maxReferenceImages ?? def?.maxReferenceImages,
          };
        }
        if (studioNode.type === "transform") {
          const data = studioNode.data as TransformNodeData;
          const def = get().transforms.find(
            (t) => t.name === data.operation && t.providerName === data.providerName
          );
          return {
            ...data,
            isAI: data.isAI ?? def?.isAI,
            acceptsReferenceImages: data.acceptsReferenceImages ?? def?.acceptsReferenceImages,
            maxReferenceImages: data.maxReferenceImages ?? def?.maxReferenceImages,
          };
        }
        return studioNode.data as NodeData;
      };

      return {
        nodes: [],
        edges: [],
        selectedNodeId: null,
        currentTemplateId: null,
        previewVisible: {},
        generators: [],
        transforms: [],
        textProviders: [],
        visionProviders: [],

        // Workflow persistence state
        savedWorkflows: [],
        activeWorkflowId: null,
        activeWorkflowName: "Untitled Workflow",
        hasUnsavedChanges: false,
        showLibrary: false,
        parentWorkflowId: null,

        execution: {
          status: "idle",
          imageIds: [],
          imageUrls: [],
          previews: {},
          dataOutputs: {},
          nodeStatus: {},
          nodeTiming: {},
        },

        // Execution history - limited to 20 runs for memory efficiency
        executionHistory: [],
        // Unseen runs tracking
        unseenRunCount: 0,
        hasUnseenErrors: false,

        // Output inspector state
        inspectedNodeId: null,
        openOutputInspector: (nodeId) => set({ inspectedNodeId: nodeId }),
        closeOutputInspector: () => set({ inspectedNodeId: null }),

        // Execution history methods
        addExecutionRun: (run) => {
          set((state) => {
            // Limit to 20 runs (newest at the beginning)
            const MAX_HISTORY = 20;
            const newHistory = [run, ...state.executionHistory].slice(0, MAX_HISTORY);
            return {
              executionHistory: newHistory,
              unseenRunCount: state.unseenRunCount + 1,
              hasUnseenErrors: state.hasUnseenErrors || run.status === "error",
            };
          });
        },

        clearHistory: () =>
          set({
            executionHistory: [],
            unseenRunCount: 0,
            hasUnseenErrors: false,
            pinnedRunIds: [],
          }),

        markRunsAsSeen: () => set({ unseenRunCount: 0, hasUnseenErrors: false }),

        // Pinned runs - favorites that persist at top of history
        pinnedRunIds: [],
        togglePinRun: (runId) => {
          set((state) => {
            const isPinned = state.pinnedRunIds.includes(runId);
            return {
              pinnedRunIds: isPinned
                ? state.pinnedRunIds.filter((id) => id !== runId)
                : [...state.pinnedRunIds, runId],
            };
          });
        },

        loadTemplate: (template) => {
          // Convert StudioNodes to React Flow nodes with new IDs
          const idMap = new Map<string, string>();

          const nodes: Node<NodeData>[] = template.workflow.nodes.map((studioNode) => {
            const newId = generateNodeId();
            idMap.set(studioNode.id, newId);

            return {
              id: newId,
              type: studioNode.type,
              position: studioNode.position,
              data: enrichNodeData(studioNode),
            };
          });

          // Convert edges with mapped IDs
          const edges: Edge[] = template.workflow.edges.map((studioEdge) => {
            const newSource = idMap.get(studioEdge.source) || studioEdge.source;
            const newTarget = idMap.get(studioEdge.target) || studioEdge.target;

            return {
              id: `edge_${newSource}_${newTarget}`,
              source: newSource,
              target: newTarget,
            };
          });

          set({
            nodes,
            edges,
            selectedNodeId: null,
            currentTemplateId: template.id,
            previewVisible: {},
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        clearWorkflow: () => {
          set({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            currentTemplateId: null,
            previewVisible: {},
            parentWorkflowId: null,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        togglePreview: (id) => {
          set((state) => ({
            previewVisible: {
              ...state.previewVisible,
              [id]: state.previewVisible[id] === false ? true : false, // default true, toggle
            },
          }));
        },

        setGenerators: (generators) => set({ generators }),
        setTransforms: (transforms) => set({ transforms }),
        setTextProviders: (textProviders) => set({ textProviders }),
        setVisionProviders: (visionProviders) => set({ visionProviders }),

        addNode: (definition, position) => {
          const id = generateNodeId();
          let data: NodeData;

          if (definition.type === "generator") {
            data = {
              generatorName: definition.name,
              params: getDefaultParams(definition),
              isAI: definition.isAI, // Track if this is an AI generator (can accept text input)
              acceptsReferenceImages: definition.acceptsReferenceImages,
              maxReferenceImages: definition.maxReferenceImages,
            } as GeneratorNodeData;
          } else if (definition.type === "transform") {
            data = {
              operation: definition.name,
              providerName: definition.providerName, // Track which provider this transform belongs to
              isAI: definition.isAI, // Track if this is an AI transform (can accept text input)
              params: getDefaultParams(definition),
              acceptsReferenceImages: definition.acceptsReferenceImages,
              maxReferenceImages: definition.maxReferenceImages,
            } as TransformNodeData;
          } else if (definition.type === "input") {
            data = {
              uploadId: undefined,
              filename: undefined,
              mime: undefined,
            } as InputNodeData;
          } else if (definition.type === "vision") {
            data = {
              providerName: definition.name,
              providerLabel: definition.label, // Human-readable label (e.g., "Gemini Vision")
              params: getDefaultParams(definition),
            } as VisionNodeData;
          } else if (definition.type === "text") {
            data = {
              providerName: definition.name,
              providerLabel: definition.label, // Human-readable label (e.g., "Gemini Text")
              params: getDefaultParams(definition),
            } as TextNodeData;
          } else {
            // Save node - read provider and destination from definition params
            const props = definition.params?.properties || {};
            const provider = (props.provider?.default as string) || "filesystem";
            const destination = (props.destination?.default as string) || "./output/image.png";
            data = {
              destination,
              provider,
            } as SaveNodeData;
          }

          const newNode: Node<NodeData> = {
            id,
            type: definition.type,
            position,
            data,
          };

          set((state) => ({
            nodes: [...state.nodes, newNode],
          }));
        },

        updateNodeData: (id, data) => {
          set((state) => ({
            nodes: state.nodes.map((node) =>
              node.id === id ? { ...node, data: { ...node.data, ...data } } : node
            ),
          }));
        },

        deleteNode: (id) => {
          set((state) => ({
            nodes: state.nodes.filter((n) => n.id !== id),
            edges: state.edges.filter((e) => e.source !== id && e.target !== id),
            selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
          }));
        },

        duplicateNode: (id) => {
          const state = get();
          const nodeToDuplicate = state.nodes.find((n) => n.id === id);
          if (!nodeToDuplicate) return;

          const newId = generateNodeId();
          const newNode: Node<NodeData> = {
            ...nodeToDuplicate,
            id: newId,
            position: {
              x: nodeToDuplicate.position.x + 50,
              y: nodeToDuplicate.position.y + 50,
            },
            data: JSON.parse(JSON.stringify(nodeToDuplicate.data)), // Deep clone
            selected: false,
          };

          set({
            nodes: [...state.nodes, newNode],
            selectedNodeId: newId, // Select the new node
          });
        },

        setNodes: (nodes) => set({ nodes }),

        addEdge: (connection) => {
          if (!connection.source || !connection.target) return;

          // Include sourceHandle and targetHandle in edge ID for uniqueness
          const handleSuffix = [connection.sourceHandle, connection.targetHandle]
            .filter(Boolean)
            .join("_");
          const id = handleSuffix
            ? `edge_${connection.source}_${connection.target}_${handleSuffix}`
            : `edge_${connection.source}_${connection.target}`;

          const newEdge: Edge = {
            id,
            source: connection.source,
            target: connection.target,
            sourceHandle: connection.sourceHandle ?? undefined,
            targetHandle: connection.targetHandle ?? undefined,
          };

          set((state) => ({
            edges: [...state.edges, newEdge],
          }));
        },

        deleteEdge: (id) => {
          set((state) => ({
            edges: state.edges.filter((e) => e.id !== id),
          }));
        },

        setEdges: (edges) => set({ edges }),

        setSelectedNode: (id) => set({ selectedNodeId: id }),

        execute: async () => {
          const { nodes, edges } = get();

          // Convert React Flow nodes to StudioNodes
          const studioNodes = nodes.map((n) => ({
            id: n.id,
            type: n.type as StudioNodeType,
            position: n.position,
            data: n.data,
          }));

          const studioEdges = edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            targetHandle: e.targetHandle ?? undefined,
          }));

          // Convert to Pipeline format (canonical format used by SDK/CLI/API)
          const { pipeline, nodeToVar } = nodesToPipeline(studioNodes, studioEdges);

          // Extract input uploads - map variable names to upload IDs
          const inputUploads: Record<string, string> = {};
          for (const node of studioNodes) {
            if (node.type === "input") {
              const data = node.data as InputNodeData;
              const varName = nodeToVar.get(node.id);
              if (data.uploadId && varName) {
                inputUploads[varName] = data.uploadId;
              }
            }
          }

          // Get AI provider settings
          const aiProviders = useSettingsStore.getState().getConfiguredProviders();

          // Set all nodes to "pending" status (not running yet)
          const initialNodeStatus: Record<string, NodeExecutionStatus> = {};
          for (const node of nodes) {
            initialNodeStatus[node.id] = "pending";
          }

          // Track start time for duration calculation
          executionStartTime = Date.now();

          set({
            execution: {
              status: "running",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: initialNodeStatus,
              nodeTiming: {}, // Reset timing for new execution
              // Clear previous error state
              error: undefined,
              errorNodeId: undefined,
              errorCode: undefined,
              errorCategory: undefined,
              retryable: undefined,
            },
          });

          // Use SSE streaming for real-time progress updates
          return new Promise<void>((resolve, reject) => {
            activeExecutionConnection = createSSEConnection<ExecutionSSEEvent>(
              "/api/execute/stream",
              {
                steps: pipeline.steps,
                name: pipeline.name,
                inputUploads,
                aiProviders,
              },
              {
                onMessage: (event) => {
                  const state = get();

                  if (event.type === "execution.started") {
                    // All nodes start as pending, they'll transition to running as they execute
                  }

                  if (event.type === "execution.step") {
                    const step = event.data;

                    // Update the specific node's status
                    const newNodeStatus = {
                      ...state.execution.nodeStatus,
                      [step.id]: step.status as NodeExecutionStatus,
                    };

                    // Update timing based on status
                    const currentTiming = state.execution.nodeTiming[step.id] || {};
                    let newTiming = { ...state.execution.nodeTiming };
                    if (step.status === "running") {
                      // Record start time when step begins
                      newTiming[step.id] = { startTime: Date.now() };
                    } else if (step.status === "completed" || step.status === "error") {
                      // Calculate duration when step completes
                      const startTime = currentTiming.startTime || Date.now();
                      newTiming[step.id] = {
                        ...currentTiming,
                        duration: Date.now() - startTime,
                      };
                    }

                    // Update previews if this step has one
                    const newPreviews = step.preview
                      ? { ...state.execution.previews, [step.id]: step.preview }
                      : state.execution.previews;

                    // Update dataOutputs if this is a text/vision node
                    const newDataOutputs =
                      step.dataType && step.content
                        ? {
                            ...state.execution.dataOutputs,
                            [step.id]: {
                              dataType: step.dataType,
                              content: step.content,
                              parsed: step.parsed,
                            },
                          }
                        : state.execution.dataOutputs;

                    set({
                      execution: {
                        ...state.execution,
                        nodeStatus: newNodeStatus,
                        nodeTiming: newTiming,
                        previews: newPreviews,
                        dataOutputs: newDataOutputs,
                      },
                    });
                  }

                  if (event.type === "execution.completed") {
                    // Mark any remaining pending nodes as completed
                    const finalNodeStatus = { ...state.execution.nodeStatus };
                    for (const nodeId of Object.keys(finalNodeStatus)) {
                      if (
                        finalNodeStatus[nodeId] === "pending" ||
                        finalNodeStatus[nodeId] === "running"
                      ) {
                        finalNodeStatus[nodeId] = "completed";
                      }
                    }

                    // Calculate duration
                    const duration = executionStartTime ? Date.now() - executionStartTime : 0;
                    executionStartTime = null;

                    // Build outputs from previews (data URLs that work for all user types)
                    const outputs: ExecutionRunOutput[] = Object.entries(
                      state.execution.previews
                    ).map(([nodeId, preview]) => {
                      const node = state.nodes.find((n) => n.id === nodeId);
                      const nodeData = node?.data as NodeData | undefined;
                      // Get a readable name for the node
                      let nodeName = "Unknown Node";
                      if (nodeData && "generatorName" in nodeData) {
                        nodeName = nodeData.generatorName;
                      } else if (nodeData && "operation" in nodeData) {
                        nodeName = nodeData.operation;
                      } else if (node?.type) {
                        nodeName = node.type.charAt(0).toUpperCase() + node.type.slice(1);
                      }
                      return {
                        nodeId,
                        nodeName,
                        preview,
                      };
                    });

                    // Create and add execution run to history
                    const run: ExecutionRun = {
                      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                      timestamp: Date.now(),
                      status: "completed",
                      duration,
                      nodeCount: state.nodes.length,
                      outputs,
                    };
                    get().addExecutionRun(run);

                    set({
                      execution: {
                        ...state.execution,
                        status: "completed",
                        imageIds: event.data.imageIds,
                        imageUrls: event.data.imageUrls,
                        nodeStatus: finalNodeStatus,
                      },
                    });
                    resolve();
                  }

                  if (event.type === "execution.error") {
                    // Mark nodes as error
                    const errorNodeStatus = { ...state.execution.nodeStatus };
                    if (event.data.id) {
                      errorNodeStatus[event.data.id] = "error";
                    }

                    // Calculate duration
                    const duration = executionStartTime ? Date.now() - executionStartTime : 0;
                    executionStartTime = null;

                    // Build outputs from any previews we got before the error
                    const outputs: ExecutionRunOutput[] = Object.entries(
                      state.execution.previews
                    ).map(([nodeId, preview]) => {
                      const node = state.nodes.find((n) => n.id === nodeId);
                      const nodeData = node?.data as NodeData | undefined;
                      let nodeName = "Unknown Node";
                      if (nodeData && "generatorName" in nodeData) {
                        nodeName = nodeData.generatorName;
                      } else if (nodeData && "operation" in nodeData) {
                        nodeName = nodeData.operation;
                      } else if (node?.type) {
                        nodeName = node.type.charAt(0).toUpperCase() + node.type.slice(1);
                      }
                      return { nodeId, nodeName, preview };
                    });

                    // Create and add failed execution run to history
                    const run: ExecutionRun = {
                      id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
                      timestamp: Date.now(),
                      status: "error",
                      duration,
                      nodeCount: state.nodes.length,
                      outputs,
                      error: event.data.error,
                      errorNodeId: event.data.id,
                    };
                    get().addExecutionRun(run);

                    set({
                      execution: {
                        ...state.execution,
                        status: "error",
                        nodeStatus: errorNodeStatus,
                        error: event.data.error,
                        errorNodeId: event.data.id,
                        // Structured error metadata from backend
                        errorCode: event.data.errorCode,
                        errorCategory: event.data.errorCategory,
                        retryable: event.data.retryable,
                      },
                    });
                    reject(new Error(event.data.error));
                  }
                },
                onError: (error) => {
                  const state = get();
                  const errorNodeStatus: Record<string, NodeExecutionStatus> = {};
                  for (const nodeId of Object.keys(state.execution.nodeStatus)) {
                    errorNodeStatus[nodeId] = "error";
                  }

                  set({
                    execution: {
                      ...state.execution,
                      status: "error",
                      nodeStatus: errorNodeStatus,
                      error: error.message,
                    },
                  });
                  reject(error);
                },
                onClose: () => {
                  // Clear the connection reference
                  activeExecutionConnection = null;

                  // Stream closed - check why
                  const state = get();
                  if (state.execution.status === "running") {
                    // Check if this was a user cancellation (status would be 'cancelled' if so)
                    // Otherwise treat as unexpected closure
                    set({
                      execution: {
                        ...state.execution,
                        status: "error",
                        error: "Connection closed unexpectedly",
                      },
                    });
                    reject(new Error("Connection closed unexpectedly"));
                  }
                },
              }
            );
          });
        },

        cancelExecution: () => {
          // Abort the active connection if any
          if (activeExecutionConnection) {
            activeExecutionConnection.abort();
            activeExecutionConnection = null;
          }

          // Reset execution state to idle
          set({
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        exportToYaml: async () => {
          const { nodes, edges } = get();

          const studioNodes = nodes.map((n) => ({
            id: n.id,
            type: n.type as "generator" | "transform" | "save",
            position: n.position,
            data: n.data,
          }));

          const studioEdges = edges.map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            sourceHandle: e.sourceHandle ?? undefined,
            targetHandle: e.targetHandle ?? undefined,
          }));

          const result = await exportYaml(studioNodes, studioEdges);
          return result.yaml;
        },

        importFromYaml: (studioNodes, studioEdges, name) => {
          // Convert StudioNodes to React Flow nodes with new IDs
          const idMap = new Map<string, string>();

          const nodes: Node<NodeData>[] = studioNodes.map((studioNode) => {
            const newId = generateNodeId();
            idMap.set(studioNode.id, newId);

            return {
              id: newId,
              type: studioNode.type,
              position: studioNode.position,
              data: enrichNodeData(studioNode),
            };
          });

          // Convert edges with mapped IDs
          const edges: Edge[] = studioEdges.map((studioEdge) => {
            const newSource = idMap.get(studioEdge.source) || studioEdge.source;
            const newTarget = idMap.get(studioEdge.target) || studioEdge.target;

            return {
              id: `edge_${newSource}_${newTarget}`,
              source: newSource,
              target: newTarget,
            };
          });

          set({
            nodes,
            edges,
            selectedNodeId: null,
            currentTemplateId: null,
            previewVisible: {},
            activeWorkflowId: null,
            activeWorkflowName: name || "Imported Workflow",
            hasUnsavedChanges: true,
            parentWorkflowId: null,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        // Workflow persistence methods
        markDirty: () => set({ hasUnsavedChanges: true }),

        toggleLibrary: () => set((state) => ({ showLibrary: !state.showLibrary })),

        setActiveWorkflowName: (name) => set({ activeWorkflowName: name, hasUnsavedChanges: true }),

        newWorkflow: () => {
          set({
            nodes: [],
            edges: [],
            selectedNodeId: null,
            currentTemplateId: null,
            previewVisible: {},
            activeWorkflowId: null,
            activeWorkflowName: "Untitled Workflow",
            hasUnsavedChanges: false,
            parentWorkflowId: null,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        saveWorkflow: (name) => {
          const {
            nodes,
            edges,
            activeWorkflowId,
            activeWorkflowName,
            savedWorkflows,
            currentTemplateId,
          } = get();
          const now = Date.now();

          if (activeWorkflowId) {
            // Update existing workflow
            const updated = savedWorkflows.map((wf) =>
              wf.id === activeWorkflowId
                ? { ...wf, name: name || activeWorkflowName, nodes, edges, updatedAt: now }
                : wf
            );
            set({
              savedWorkflows: updated,
              activeWorkflowName: name || activeWorkflowName,
              hasUnsavedChanges: false,
            });
            return activeWorkflowId;
          } else {
            // Create new workflow
            const id = generateWorkflowId();
            const newWorkflow: SavedWorkflow = {
              id,
              name: name || activeWorkflowName,
              nodes,
              edges,
              createdAt: now,
              updatedAt: now,
              templateId: currentTemplateId || undefined,
            };
            set({
              savedWorkflows: [...savedWorkflows, newWorkflow],
              activeWorkflowId: id,
              activeWorkflowName: name || activeWorkflowName,
              hasUnsavedChanges: false,
            });
            return id;
          }
        },

        loadWorkflow: (id) => {
          const { savedWorkflows } = get();
          const workflow = savedWorkflows.find((wf) => wf.id === id);
          if (!workflow) return;

          // Enrich node data with definition properties (in case workflow was saved before enrichment existed)
          const enrichedNodes = workflow.nodes.map((node) => ({
            ...node,
            data: enrichNodeData({
              id: node.id,
              type: node.type as StudioNodeType,
              position: node.position,
              data: node.data as StudioNodeData,
            }),
          }));

          set({
            nodes: enrichedNodes,
            edges: workflow.edges,
            selectedNodeId: null,
            currentTemplateId: workflow.templateId || null,
            previewVisible: {},
            activeWorkflowId: id,
            activeWorkflowName: workflow.name,
            hasUnsavedChanges: false,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        deleteWorkflow: (id) => {
          const { savedWorkflows, activeWorkflowId } = get();
          const filtered = savedWorkflows.filter((wf) => wf.id !== id);

          if (activeWorkflowId === id) {
            // If deleting the active workflow, clear the canvas
            set({
              savedWorkflows: filtered,
              nodes: [],
              edges: [],
              selectedNodeId: null,
              currentTemplateId: null,
              previewVisible: {},
              activeWorkflowId: null,
              activeWorkflowName: "Untitled Workflow",
              hasUnsavedChanges: false,
              execution: {
                status: "idle",
                imageIds: [],
                imageUrls: [],
                previews: {},
                dataOutputs: {},
                nodeStatus: {},
                nodeTiming: {},
              },
            });
          } else {
            set({ savedWorkflows: filtered });
          }
        },

        renameWorkflow: (id, name) => {
          const { savedWorkflows, activeWorkflowId } = get();
          const updated = savedWorkflows.map((wf) =>
            wf.id === id ? { ...wf, name, updatedAt: Date.now() } : wf
          );
          set({
            savedWorkflows: updated,
            ...(activeWorkflowId === id ? { activeWorkflowName: name } : {}),
          });
        },

        duplicateWorkflow: (id) => {
          const { savedWorkflows } = get();
          const workflow = savedWorkflows.find((wf) => wf.id === id);
          if (!workflow) return "";

          const now = Date.now();
          const newId = generateWorkflowId();
          const duplicate: SavedWorkflow = {
            ...workflow,
            id: newId,
            name: `${workflow.name} (Copy)`,
            createdAt: now,
            updatedAt: now,
          };
          set({ savedWorkflows: [...savedWorkflows, duplicate] });
          return newId;
        },

        loadGeneratedWorkflow: (workflow: GeneratedWorkflowData) => {
          // Convert AI-generated workflow to React Flow nodes
          const idMap = new Map<string, string>();

          // Flow-based layout: arrange nodes left-to-right following data flow
          const COLUMN_SPACING = 300; // Horizontal space between columns
          const ROW_SPACING = 180; // Vertical space between nodes in same column

          // Step 1: Build dependency graph to compute node depths
          const incomingEdges = new Map<string, string[]>();
          const outgoingEdges = new Map<string, string[]>();
          for (const node of workflow.nodes) {
            incomingEdges.set(node.id, []);
            outgoingEdges.set(node.id, []);
          }
          for (const edge of workflow.edges) {
            incomingEdges.get(edge.target)?.push(edge.source);
            outgoingEdges.get(edge.source)?.push(edge.target);
          }

          // Step 2: Compute depth (column) for each node using topological order
          const nodeDepth = new Map<string, number>();
          const visited = new Set<string>();

          function computeDepth(nodeId: string): number {
            if (nodeDepth.has(nodeId)) return nodeDepth.get(nodeId)!;
            if (visited.has(nodeId)) return 0; // Cycle protection
            visited.add(nodeId);

            const incoming = incomingEdges.get(nodeId) || [];
            if (incoming.length === 0) {
              nodeDepth.set(nodeId, 0);
              return 0;
            }

            const maxParentDepth = Math.max(...incoming.map(computeDepth));
            const depth = maxParentDepth + 1;
            nodeDepth.set(nodeId, depth);
            return depth;
          }

          for (const node of workflow.nodes) {
            computeDepth(node.id);
          }

          // Step 3: Group nodes by depth (column)
          const nodesByDepth = new Map<number, string[]>();
          for (const node of workflow.nodes) {
            const depth = nodeDepth.get(node.id) || 0;
            if (!nodesByDepth.has(depth)) nodesByDepth.set(depth, []);
            nodesByDepth.get(depth)!.push(node.id);
          }

          // Step 4: Calculate positions based on depth and vertical index
          const nodePositions = new Map<string, { x: number; y: number }>();
          for (const [depth, nodeIds] of nodesByDepth) {
            const columnHeight = nodeIds.length * ROW_SPACING;
            const startY = 100 + (columnHeight > ROW_SPACING ? -columnHeight / 4 : 0);

            nodeIds.forEach((nodeId, verticalIndex) => {
              nodePositions.set(nodeId, {
                x: 100 + depth * COLUMN_SPACING,
                y: startY + verticalIndex * ROW_SPACING,
              });
            });
          }

          const nodes: Node<NodeData>[] = workflow.nodes.map((genNode) => {
            const newId = generateNodeId();
            idMap.set(genNode.id, newId);

            // Parse nodeType to extract type and name
            // Format: "generator:dalle-3", "transform:sharp:resize", "input:upload", "flow:fanout", etc.
            const parts = genNode.nodeType.split(":");

            // Use computed flow position
            const position = nodePositions.get(genNode.id) || { x: 100, y: 100 };

            // Handle flow control nodes specially (flow:fanout, flow:collect, flow:router)
            // The actual node type is the second part, not "flow"
            if (parts[0] === "flow") {
              const flowNodeType = parts[1] as "fanout" | "collect" | "router";
              let data: NodeData;

              if (flowNodeType === "fanout") {
                data = {
                  mode: (genNode.parameters.mode as "array" | "count") || "count",
                  count: (genNode.parameters.count as number) || 3,
                  arrayProperty: genNode.parameters.arrayProperty as string | undefined,
                } as FanOutNodeData;
              } else if (flowNodeType === "collect") {
                data = {
                  expectedInputs: (genNode.parameters.expectedCount as number) || 3,
                  waitMode: "all",
                } as CollectNodeData;
              } else {
                // router
                data = {
                  selectionProperty:
                    (genNode.parameters.selectionProperty as string) || "best_index",
                  selectionType: "index",
                  outputCount: 1,
                  contextProperty: genNode.parameters.contextProperty as string | undefined,
                } as RouterNodeData;
              }

              return {
                id: newId,
                type: flowNodeType as StudioNodeType,
                position,
                data,
              };
            }

            // Standard node types
            const nodeType = parts[0] as StudioNodeType;

            // Build node data based on type
            let data: NodeData;

            if (nodeType === "generator") {
              const generatorName = parts.slice(1).join(":");
              // Look up generator definition to get acceptsReferenceImages and other properties
              const generatorDef = get().generators.find((g) => g.name === generatorName);
              data = {
                generatorName,
                params: genNode.parameters,
                isAI: generatorDef?.isAI ?? true, // Use definition or assume AI
                acceptsReferenceImages: generatorDef?.acceptsReferenceImages,
                maxReferenceImages: generatorDef?.maxReferenceImages,
              } as GeneratorNodeData;
            } else if (nodeType === "transform") {
              const providerName = parts[1];
              const operation = parts.slice(2).join(":");
              // Look up transform definition to get isAI and acceptsReferenceImages
              const transformDef = get().transforms.find(
                (t) => t.providerName === providerName && t.name === operation
              );
              data = {
                operation,
                providerName,
                params: genNode.parameters,
                isAI: transformDef?.isAI,
                acceptsReferenceImages: transformDef?.acceptsReferenceImages,
                maxReferenceImages: transformDef?.maxReferenceImages,
              } as TransformNodeData;
            } else if (nodeType === "input") {
              data = {
                uploadId: undefined,
                filename: undefined,
                mime: undefined,
              } as InputNodeData;
            } else if (nodeType === "vision") {
              const providerName = parts.slice(1).join(":");
              data = {
                providerName,
                params: genNode.parameters,
              } as VisionNodeData;
            } else if (nodeType === "text") {
              const providerName = parts.slice(1).join(":");
              // Extract jsonSchema from params and convert to outputSchema for UI
              const jsonSchema = genNode.parameters.jsonSchema as
                | { properties?: Record<string, { type?: string; description?: string }> }
                | undefined;
              const outputSchema = jsonSchema?.properties
                ? {
                    type: "object" as const,
                    properties: Object.fromEntries(
                      Object.entries(jsonSchema.properties).map(([key, prop]) => [
                        key,
                        {
                          type:
                            (prop.type as "string" | "number" | "boolean" | "object" | "array") ||
                            "string",
                          description: prop.description,
                        },
                      ])
                    ),
                  }
                : undefined;
              data = {
                providerName,
                params: genNode.parameters,
                outputSchema,
              } as TextNodeData;
            } else {
              // Default to save node
              data = {
                destination: (genNode.parameters.destination as string) || "./output/image.png",
                provider: (genNode.parameters.provider as string) || "filesystem",
              } as SaveNodeData;
            }

            return {
              id: newId,
              type: nodeType,
              position,
              data,
            };
          });

          // Convert edges with mapped IDs
          const edges: Edge[] = workflow.edges.map((genEdge) => {
            const newSource = idMap.get(genEdge.source) || genEdge.source;
            const newTarget = idMap.get(genEdge.target) || genEdge.target;

            // Include handles in edge ID for uniqueness (multiple edges from same source)
            const handleSuffix = [genEdge.sourceHandle, genEdge.targetHandle]
              .filter(Boolean)
              .join("_");
            const edgeId = handleSuffix
              ? `edge_${newSource}_${newTarget}_${handleSuffix}`
              : `edge_${newSource}_${newTarget}`;

            return {
              id: edgeId,
              source: newSource,
              target: newTarget,
              sourceHandle: genEdge.sourceHandle ?? undefined,
              targetHandle: genEdge.targetHandle ?? undefined,
            };
          });

          set({
            nodes,
            edges,
            selectedNodeId: null,
            currentTemplateId: null,
            previewVisible: {},
            activeWorkflowId: null,
            activeWorkflowName: "AI Generated Workflow",
            hasUnsavedChanges: true,
            parentWorkflowId: null,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        loadRemixImage: (imageUrl: string) => {
          const nodeId = generateNodeId();
          const inputNode: Node<NodeData> = {
            id: nodeId,
            type: "input",
            position: { x: 200, y: 200 },
            data: {
              imageUrl,
              filename: imageUrl.split("/").pop() || "remix-image",
            } as InputNodeData,
          };

          set({
            nodes: [inputNode],
            edges: [],
            selectedNodeId: null,
            currentTemplateId: null,
            previewVisible: {},
            activeWorkflowId: null,
            activeWorkflowName: "Remixed Workflow",
            hasUnsavedChanges: true,
            parentWorkflowId: null,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },

        loadFromWorkflowJson: (json, metadata) => {
          const idMap = new Map<string, string>();

          const nodes: Node<NodeData>[] = json.nodes.map((studioNode) => {
            const newId = generateNodeId();
            idMap.set(studioNode.id, newId);

            return {
              id: newId,
              type: studioNode.type,
              position: studioNode.position,
              data: enrichNodeData(studioNode),
            };
          });

          const edges: Edge[] = json.edges.map((studioEdge) => {
            const newSource = idMap.get(studioEdge.source) || studioEdge.source;
            const newTarget = idMap.get(studioEdge.target) || studioEdge.target;
            const handleSuffix = [studioEdge.sourceHandle, studioEdge.targetHandle]
              .filter(Boolean)
              .join("_");
            const edgeId = handleSuffix
              ? `edge_${newSource}_${newTarget}_${handleSuffix}`
              : `edge_${newSource}_${newTarget}`;

            return {
              id: edgeId,
              source: newSource,
              target: newTarget,
              sourceHandle: studioEdge.sourceHandle ?? undefined,
              targetHandle: studioEdge.targetHandle ?? undefined,
            };
          });

          set({
            nodes,
            edges,
            selectedNodeId: null,
            currentTemplateId: null,
            previewVisible: {},
            activeWorkflowId: null,
            activeWorkflowName: metadata?.name || "Forked Workflow",
            hasUnsavedChanges: true,
            parentWorkflowId: metadata?.parentWorkflowId || null,
            execution: {
              status: "idle",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: {},
              nodeTiming: {},
            },
          });
        },
      };
    },
    {
      name: "floimg-studio-workflows",
      // Only persist savedWorkflows - current canvas state is ephemeral
      partialize: (state) => ({
        savedWorkflows: state.savedWorkflows,
      }),
    }
  )
);

// Helper to extract default values from schema
function getDefaultParams(definition: NodeDefinition): Record<string, unknown> {
  const params: Record<string, unknown> = {};

  if (definition.params?.properties) {
    for (const [key, field] of Object.entries(definition.params.properties)) {
      if (field.default !== undefined) {
        params[key] = field.default;
      }
    }
  }

  return params;
}
