import { create } from "zustand";
import type { ExecutionStepResult } from "@teamflojo/floimg-studio-shared";

// Message types for the terminal feed
export type TerminalMessageType =
  | "user"
  | "assistant"
  | "system"
  | "execution"
  | "result"
  | "error";

// Workflow data from AI generation
export interface GeneratedWorkflowData {
  nodes: unknown[];
  edges: unknown[];
  name?: string;
}

// AI conversation message for history
export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
}

// Terminal message with metadata
export interface TerminalMessage {
  id: string;
  type: TerminalMessageType;
  content: string;
  timestamp: number;
  metadata?: {
    // For execution messages
    nodeStatuses?: Record<string, ExecutionStepResult["status"]>;
    totalNodes?: number;
    completedNodes?: number;
    // For result messages
    imageIds?: string[];
    imageUrls?: string[];
    previews?: Record<string, string>;
    // For workflow preview messages
    workflowData?: GeneratedWorkflowData;
    workflowId?: string;
    workflowName?: string;
    // For streaming AI responses
    isStreaming?: boolean;
  };
}

// Panel types for slide-out selection
export type PanelType = "workflow" | "image" | "upload" | null;

// Conversation mode for multi-turn AI chat
export type ConversationMode = "idle" | "creating" | "configuring";

interface TerminalStore {
  // Message feed
  messages: TerminalMessage[];
  addMessage: (msg: Omit<TerminalMessage, "id" | "timestamp">) => string;
  updateMessage: (id: string, updates: Partial<TerminalMessage>) => void;
  appendToMessageContent: (id: string, content: string) => void;
  clearMessages: () => void;

  // Input state
  inputValue: string;
  setInputValue: (value: string) => void;
  isProcessing: boolean;
  setProcessing: (processing: boolean) => void;

  // Panel state for slide-out selectors
  activePanel: PanelType;
  openPanel: (panel: PanelType) => void;
  closePanel: () => void;

  // AI conversation state
  conversationMode: ConversationMode;
  setConversationMode: (mode: ConversationMode) => void;
  conversationHistory: ConversationMessage[];
  appendToHistory: (msg: ConversationMessage) => void;
  clearHistory: () => void;

  // Active execution tracking
  activeExecutionMessageId: string | null;
  setActiveExecutionMessageId: (id: string | null) => void;

  // Pending workflow from AI (before applying to canvas)
  pendingWorkflow: GeneratedWorkflowData | null;
  setPendingWorkflow: (workflow: GeneratedWorkflowData | null) => void;
}

// Generate unique message ID
const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

export const useTerminalStore = create<TerminalStore>((set) => ({
  // Message feed
  messages: [],

  addMessage: (msg) => {
    const id = generateId();
    const message: TerminalMessage = {
      ...msg,
      id,
      timestamp: Date.now(),
    };
    set((state) => ({
      messages: [...state.messages, message],
    }));
    return id;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) => (msg.id === id ? { ...msg, ...updates } : msg)),
    }));
  },

  appendToMessageContent: (id, content) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + content } : msg
      ),
    }));
  },

  clearMessages: () => {
    set({
      messages: [],
      conversationHistory: [],
      conversationMode: "idle",
      pendingWorkflow: null,
    });
  },

  // Input state
  inputValue: "",
  setInputValue: (value) => set({ inputValue: value }),
  isProcessing: false,
  setProcessing: (processing) => set({ isProcessing: processing }),

  // Panel state
  activePanel: null,
  openPanel: (panel) => set({ activePanel: panel }),
  closePanel: () => set({ activePanel: null }),

  // AI conversation state
  conversationMode: "idle",
  setConversationMode: (mode) => set({ conversationMode: mode }),
  conversationHistory: [],

  appendToHistory: (msg) => {
    set((state) => ({
      conversationHistory: [...state.conversationHistory, msg],
    }));
  },

  clearHistory: () => {
    set({
      conversationHistory: [],
      conversationMode: "idle",
      pendingWorkflow: null,
    });
  },

  // Execution tracking
  activeExecutionMessageId: null,
  setActiveExecutionMessageId: (id) => set({ activeExecutionMessageId: id }),

  // Pending workflow
  pendingWorkflow: null,
  setPendingWorkflow: (workflow) => set({ pendingWorkflow: workflow }),
}));
