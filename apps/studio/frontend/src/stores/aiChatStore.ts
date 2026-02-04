import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  GenerateWorkflowMessage,
  GeneratedWorkflowData,
  GenerateModel,
  GenerateStatusReason,
  GenerationPhase,
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
        }),
    }),
    {
      name: "floimg-ai-chat",
      // Only persist these fields - don't persist transient state
      partialize: (state) => ({
        messages: state.messages,
        selectedModel: state.selectedModel,
      }),
    }
  )
);
