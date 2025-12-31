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
  NodeDefinition,
  GalleryTemplate,
} from "@teamflojo/floimg-studio-shared";
import { executeWorkflow, exportYaml } from "../api/client";
import type { StudioNode, StudioEdge } from "@teamflojo/floimg-studio-shared";
import { useSettingsStore } from "./settingsStore";

type NodeData =
  | GeneratorNodeData
  | TransformNodeData
  | SaveNodeData
  | InputNodeData
  | VisionNodeData
  | TextNodeData;

type NodeExecutionStatus = "idle" | "running" | "completed" | "error";

interface DataOutput {
  dataType: "text" | "json";
  content: string;
  parsed?: Record<string, unknown>;
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
  error?: string;
}

interface WorkflowStore {
  // Nodes and edges (React Flow compatible)
  nodes: Node<NodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;

  // Template tracking
  currentTemplateId: string | null;
  loadTemplate: (template: GalleryTemplate) => void;
  clearWorkflow: () => void;

  // Workflow persistence
  savedWorkflows: SavedWorkflow[];
  activeWorkflowId: string | null;
  activeWorkflowName: string;
  hasUnsavedChanges: boolean;
  showLibrary: boolean;

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

  // Export
  exportToYaml: () => Promise<string>;

  // Import
  importFromYaml: (nodes: StudioNode[], edges: StudioEdge[], name?: string) => void;
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
    (set, get) => ({
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

      execution: {
        status: "idle",
        imageIds: [],
        imageUrls: [],
        previews: {},
        dataOutputs: {},
        nodeStatus: {},
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
            data: studioNode.data as NodeData,
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
          execution: {
            status: "idle",
            imageIds: [],
            imageUrls: [],
            previews: {},
            dataOutputs: {},
            nodeStatus: {},
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
          } as GeneratorNodeData;
        } else if (definition.type === "transform") {
          data = {
            operation: definition.name,
            providerName: definition.providerName, // Track which provider this transform belongs to
            isAI: definition.isAI, // Track if this is an AI transform (can accept text input)
            params: getDefaultParams(definition),
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

        // Get AI provider settings
        const aiProviders = useSettingsStore.getState().getConfiguredProviders();

        // Set all nodes to "running" status
        const initialNodeStatus: Record<string, NodeExecutionStatus> = {};
        for (const node of nodes) {
          initialNodeStatus[node.id] = "running";
        }

        set({
          execution: {
            status: "running",
            imageIds: [],
            imageUrls: [],
            previews: {},
            dataOutputs: {},
            nodeStatus: initialNodeStatus,
          },
        });

        try {
          const result = await executeWorkflow(studioNodes, studioEdges, aiProviders);

          // Set all nodes to completed or error based on result
          const finalNodeStatus: Record<string, NodeExecutionStatus> = {};
          for (const node of nodes) {
            finalNodeStatus[node.id] = result.status === "completed" ? "completed" : "error";
          }

          if (result.status === "completed") {
            set({
              execution: {
                status: "completed",
                imageIds: result.imageIds,
                imageUrls: result.imageUrls || [],
                previews: result.previews || {},
                dataOutputs: result.dataOutputs || {},
                nodeStatus: finalNodeStatus,
              },
            });
          } else {
            set({
              execution: {
                status: "error",
                imageIds: [],
                imageUrls: [],
                previews: {},
                dataOutputs: {},
                nodeStatus: finalNodeStatus,
                error: result.error,
              },
            });
          }
        } catch (error) {
          // Set all nodes to error status
          const errorNodeStatus: Record<string, NodeExecutionStatus> = {};
          for (const node of nodes) {
            errorNodeStatus[node.id] = "error";
          }

          set({
            execution: {
              status: "error",
              imageIds: [],
              imageUrls: [],
              previews: {},
              dataOutputs: {},
              nodeStatus: errorNodeStatus,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
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
            data: studioNode.data as NodeData,
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
          execution: {
            status: "idle",
            imageIds: [],
            imageUrls: [],
            previews: {},
            dataOutputs: {},
            nodeStatus: {},
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
          execution: {
            status: "idle",
            imageIds: [],
            imageUrls: [],
            previews: {},
            dataOutputs: {},
            nodeStatus: {},
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

        set({
          nodes: workflow.nodes,
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
    }),
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
