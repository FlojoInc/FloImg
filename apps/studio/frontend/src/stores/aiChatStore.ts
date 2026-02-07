import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GenerateWorkflowMessage,
  GeneratedWorkflowData,
  GenerateModel,
  GenerateStatusReason,
  GenerationPhase,
  AIWorkflowOperation,
  OperationConflict,
  ConflictDetectionResult,
} from "@teamflojo/floimg-studio-shared";

/**
 * Canvas snapshot - serializable representation of current workflow state
 * Sent with each AI request so the AI knows what's on the canvas
 */
export interface CanvasSnapshot {
  nodes: {
    id: string;
    type: string;
    label?: string;
    parameters?: Record<string, unknown>;
  }[];
  edges: {
    source: string;
    target: string;
  }[];
  nodeCount: number;
  hasContent: boolean;
}

/**
 * Extended snapshot stored after AI operations are applied
 * Used to detect user edits between AI operations
 */
export interface AppliedSnapshot extends CanvasSnapshot {
  /** Timestamp when the snapshot was taken */
  timestamp: number;
  /** Operations that were applied to create this state */
  appliedOperations?: AIWorkflowOperation[];
}

/**
 * Last execution results context for AI awareness
 * Note: timestamp is optional and set when sending to AI, not when computing
 */
export interface ExecutionContext {
  status: "idle" | "completed" | "error";
  nodeCount: number;
  outputs: {
    nodeId: string;
    nodeName: string;
    hasImage: boolean;
    hasText: boolean;
  }[];
  error?: string;
}

interface AIChatState {
  // Panel visibility
  isOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;

  // Conversation state
  messages: GenerateWorkflowMessage[];
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string, workflow?: GeneratedWorkflowData) => void;
  clearMessages: () => void;

  // Generation state (not persisted)
  isLoading: boolean;
  generationPhase: GenerationPhase | null;
  generationMessage: string;
  error: string | null;
  setLoading: (loading: boolean) => void;
  setGenerationProgress: (phase: GenerationPhase | null, message: string) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Availability status (not persisted)
  isAvailable: boolean | null;
  statusMessage: string;
  statusReason: GenerateStatusReason | undefined;
  isCloudDeployment: boolean;
  supportUrl: string | undefined;
  setAvailability: (
    available: boolean,
    message: string,
    reason?: GenerateStatusReason,
    isCloud?: boolean,
    supportUrl?: string
  ) => void;

  // Model selection
  availableModels: GenerateModel[];
  selectedModel: string;
  setAvailableModels: (models: GenerateModel[]) => void;
  setSelectedModel: (modelId: string) => void;

  // Canvas awareness (computed from workflowStore, stored for context)
  canvasSnapshot: CanvasSnapshot | null;
  setCanvasSnapshot: (snapshot: CanvasSnapshot | null) => void;

  // Execution context
  executionContext: ExecutionContext | null;
  setExecutionContext: (context: ExecutionContext | null) => void;

  // Conflict detection - tracks state after AI operations for detecting user edits
  lastAppliedSnapshot: AppliedSnapshot | null;
  setLastAppliedSnapshot: (snapshot: AppliedSnapshot | null) => void;
  /** Detect conflicts between user edits and incoming AI operations */
  detectConflicts: (
    currentSnapshot: CanvasSnapshot,
    operations: AIWorkflowOperation[]
  ) => ConflictDetectionResult;

  // Session management
  resetSession: () => void;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set) => ({
      // Panel visibility
      isOpen: false,
      openPanel: () => set({ isOpen: true }),
      closePanel: () => set({ isOpen: false }),
      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

      // Conversation state
      messages: [],
      addUserMessage: (content) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              role: "user" as const,
              content,
              timestamp: Date.now(),
            },
          ],
        })),
      addAssistantMessage: (content, workflow) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              role: "assistant" as const,
              content,
              workflow,
              timestamp: Date.now(),
            },
          ],
        })),
      clearMessages: () => set({ messages: [], error: null }),

      // Generation state
      isLoading: false,
      generationPhase: null,
      generationMessage: "",
      error: null,
      setLoading: (loading) => set({ isLoading: loading }),
      setGenerationProgress: (phase, message) =>
        set({ generationPhase: phase, generationMessage: message }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),

      // Availability status
      isAvailable: null,
      statusMessage: "",
      statusReason: undefined,
      isCloudDeployment: false,
      supportUrl: undefined,
      setAvailability: (available, message, reason, isCloud, supportUrl) =>
        set({
          isAvailable: available,
          statusMessage: message,
          statusReason: reason,
          isCloudDeployment: isCloud ?? false,
          supportUrl,
        }),

      // Model selection
      availableModels: [],
      selectedModel: "",
      setAvailableModels: (models) => {
        const defaultModel = models.find((m) => m.isDefault);
        set({
          availableModels: models,
          selectedModel: defaultModel?.id || models[0]?.id || "",
        });
      },
      setSelectedModel: (modelId) => set({ selectedModel: modelId }),

      // Canvas awareness
      canvasSnapshot: null,
      setCanvasSnapshot: (snapshot) => set({ canvasSnapshot: snapshot }),

      // Execution context
      executionContext: null,
      setExecutionContext: (context) => set({ executionContext: context }),

      // Conflict detection
      lastAppliedSnapshot: null,
      setLastAppliedSnapshot: (snapshot) => set({ lastAppliedSnapshot: snapshot }),

      detectConflicts: (currentSnapshot, operations) => {
        const state = useAIChatStore.getState();
        const lastSnapshot = state.lastAppliedSnapshot;

        // No conflicts if there's no prior snapshot (first AI operation)
        if (!lastSnapshot) {
          return {
            hasConflicts: false,
            conflicts: [],
            safeOperations: operations,
          };
        }

        const conflicts: OperationConflict[] = [];
        const safeOperations: AIWorkflowOperation[] = [];

        // Build lookup maps for efficient comparison
        const lastNodes = new Map(lastSnapshot.nodes.map((n) => [n.id, n]));
        const currentNodes = new Map(currentSnapshot.nodes.map((n) => [n.id, n]));
        const lastEdges = new Set(lastSnapshot.edges.map((e) => `${e.source}->${e.target}`));
        const currentEdges = new Set(currentSnapshot.edges.map((e) => `${e.source}->${e.target}`));

        // Detect which nodes user has modified since last AI apply
        const userModifiedNodes = new Set<string>();
        const userDeletedNodes = new Set<string>();

        for (const [nodeId, lastNode] of lastNodes) {
          const currentNode = currentNodes.get(nodeId);
          if (!currentNode) {
            // User deleted this node
            userDeletedNodes.add(nodeId);
          } else {
            // Check if node parameters changed (ignoring position - that's not a conflict)
            const lastParams = JSON.stringify(lastNode.parameters || {});
            const currentParams = JSON.stringify(currentNode.parameters || {});
            if (lastParams !== currentParams || lastNode.label !== currentNode.label) {
              userModifiedNodes.add(nodeId);
            }
          }
        }

        // Detect which edges user has modified
        const userDeletedEdges = new Set<string>();
        for (const edgeKey of lastEdges) {
          if (!currentEdges.has(edgeKey)) {
            userDeletedEdges.add(edgeKey);
          }
        }

        // Check each operation for conflicts
        for (const op of operations) {
          let hasConflict = false;

          if (op.type === "modify" && op.nodeId) {
            if (userModifiedNodes.has(op.nodeId)) {
              // User modified this node, and AI wants to modify it too
              const currentNode = currentNodes.get(op.nodeId);
              conflicts.push({
                operation: op,
                type: "modified_by_both",
                nodeId: op.nodeId,
                description: `You modified "${currentNode?.label || op.nodeId}" since the last AI change. The AI also wants to modify it.`,
                userValue: currentNode?.parameters,
                aiValue: op.parameters,
              });
              hasConflict = true;
            } else if (userDeletedNodes.has(op.nodeId)) {
              // User deleted this node, but AI wants to modify it
              conflicts.push({
                operation: op,
                type: "deleted_by_user",
                nodeId: op.nodeId,
                description: `You deleted a node that the AI wants to modify.`,
              });
              hasConflict = true;
            }
          } else if (op.type === "delete" && op.nodeId) {
            if (userModifiedNodes.has(op.nodeId)) {
              // User modified this node, but AI wants to delete it
              const currentNode = currentNodes.get(op.nodeId);
              conflicts.push({
                operation: op,
                type: "deleted_by_ai",
                nodeId: op.nodeId,
                description: `You modified "${currentNode?.label || op.nodeId}", but the AI wants to delete it.`,
                userValue: currentNode?.parameters,
              });
              hasConflict = true;
            }
          } else if (op.type === "connect" && op.source && op.target) {
            const edgeKey = `${op.source}->${op.target}`;
            if (userDeletedEdges.has(edgeKey)) {
              // User disconnected these nodes, but AI wants to reconnect them
              conflicts.push({
                operation: op,
                type: "reconnect_conflict",
                nodeId: op.source,
                description: `You disconnected "${op.source}" from "${op.target}", but the AI wants to reconnect them.`,
              });
              hasConflict = true;
            }
          }

          if (!hasConflict) {
            safeOperations.push(op);
          }
        }

        return {
          hasConflicts: conflicts.length > 0,
          conflicts,
          safeOperations,
        };
      },

      // Session management
      resetSession: () =>
        set({
          messages: [],
          error: null,
          isLoading: false,
          generationPhase: null,
          generationMessage: "",
          canvasSnapshot: null,
          executionContext: null,
          lastAppliedSnapshot: null,
        }),
    }),
    {
      name: "floimg-ai-chat",
      // Persist conversation, model, and panel visibility
      partialize: (state) => ({
        messages: state.messages,
        selectedModel: state.selectedModel,
        isOpen: state.isOpen,
      }),
    }
  )
);
