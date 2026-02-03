import { useState, useRef, useEffect, useCallback } from "react";
import type {
  GenerateWorkflowMessage,
  GeneratedWorkflowData,
  GenerateStatusReason,
  GenerationPhase,
  GenerationSSEEvent,
  GenerateModel,
} from "@teamflojo/floimg-studio-shared";
import { getGenerateStatus } from "../api/client";
import { createSSEConnection, type SSEConnection } from "../api/sse";

// Module-level connection reference for cancellation
// (Not in component state because SSEConnection is not serializable)
let activeGenerationConnection: SSEConnection | null = null;

/**
 * Analytics data for successful workflow generation
 */
export interface GenerationSuccessData {
  nodeCount: number;
  hasAINodes: boolean;
  promptLength: number;
  isConversation: boolean;
}

/**
 * Analytics data for failed workflow generation
 */
export interface GenerationFailedData {
  errorType: "invalid_node_type" | "generation_error" | "rate_limit" | "network" | "unknown";
  promptLength: number;
  isConversation: boolean;
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyWorkflow: (workflow: GeneratedWorkflowData) => void;
  /** Called when workflow generation succeeds (for analytics) */
  onGenerationSuccess?: (data: GenerationSuccessData) => void;
  /** Called when workflow generation fails (for analytics) */
  onGenerationFailed?: (data: GenerationFailedData) => void;
}

/**
 * Categorize an error message into an analytics-friendly error type
 */
function categorizeError(errorMessage: string): GenerationFailedData["errorType"] {
  if (errorMessage.includes("Unknown node type")) {
    return "invalid_node_type";
  }
  if (
    errorMessage.includes("rate limit") ||
    errorMessage.includes("429") ||
    errorMessage.includes("quota")
  ) {
    return "rate_limit";
  }
  if (
    errorMessage.includes("network") ||
    errorMessage.includes("Failed to fetch") ||
    errorMessage.includes("timeout") ||
    errorMessage.includes("ECONNREFUSED")
  ) {
    return "network";
  }
  if (
    errorMessage.includes("generate") ||
    errorMessage.includes("Gemini") ||
    errorMessage.includes("workflow")
  ) {
    return "generation_error";
  }
  return "unknown";
}

/**
 * Check if a node type is an AI node (generator or AI transform)
 */
function isAINode(nodeType: string): boolean {
  return (
    nodeType.startsWith("generator:") ||
    nodeType.startsWith("transform:stability") ||
    nodeType.startsWith("transform:openai") ||
    nodeType.startsWith("transform:replicate") ||
    nodeType.startsWith("vision:") ||
    nodeType.startsWith("text:")
  );
}

export function AIChat({
  isOpen,
  onClose,
  onApplyWorkflow,
  onGenerationSuccess,
  onGenerationFailed,
}: AIChatProps) {
  const [messages, setMessages] = useState<GenerateWorkflowMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [generationPhase, setGenerationPhase] = useState<GenerationPhase | null>(null);
  const [generationMessage, setGenerationMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusReason, setStatusReason] = useState<GenerateStatusReason | undefined>();
  const [isCloudDeployment, setIsCloudDeployment] = useState(false);
  const [supportUrl, setSupportUrl] = useState<string | undefined>();
  const [availableModels, setAvailableModels] = useState<GenerateModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: Event) {
      if (
        modelDropdownRef.current &&
        !modelDropdownRef.current.contains(event.target as HTMLElement)
      ) {
        setIsModelDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Check if generation is available on mount
  useEffect(() => {
    if (isOpen && isAvailable === null) {
      getGenerateStatus()
        .then((status) => {
          setIsAvailable(status.available);
          setStatusMessage(status.message);
          setStatusReason(status.reason);
          setIsCloudDeployment(status.isCloudDeployment ?? false);
          setSupportUrl(status.supportUrl);
          if (status.availableModels) {
            setAvailableModels(status.availableModels);
            // Set default model
            const defaultModel = status.availableModels.find((m) => m.isDefault);
            setSelectedModel(defaultModel?.id || status.availableModels[0]?.id || "");
          }
        })
        .catch(() => {
          setIsAvailable(false);
          setStatusMessage("Failed to check AI availability");
          setStatusReason("service_unavailable");
        });
    }
  }, [isOpen, isAvailable]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return;

    const userMessage: GenerateWorkflowMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setError(null);
    setGenerationPhase(null);
    setGenerationMessage("");

    let receivedWorkflow: GeneratedWorkflowData | undefined;
    const promptLength = userMessage.content.length;
    const isConversation = messages.length > 0;

    activeGenerationConnection = createSSEConnection<GenerationSSEEvent>(
      "/api/generate/workflow/stream",
      { prompt: userMessage.content, history: messages, model: selectedModel },
      {
        onMessage: (event) => {
          if (event.type === "generation.started") {
            // Started - no visible change needed
          }

          if (event.type === "generation.progress") {
            setGenerationPhase(event.data.phase);
            setGenerationMessage(event.data.message);
          }

          if (event.type === "generation.completed") {
            receivedWorkflow = event.data;

            // Call analytics callback on success
            if (onGenerationSuccess) {
              const nodeCount = event.data.nodes.length;
              const hasAINodes = event.data.nodes.some((node) => isAINode(node.nodeType));
              onGenerationSuccess({
                nodeCount,
                hasAINodes,
                promptLength,
                isConversation,
              });
            }
          }

          if (event.type === "generation.error") {
            setError(event.data.error);

            // Call analytics callback on failure
            if (onGenerationFailed) {
              onGenerationFailed({
                errorType: categorizeError(event.data.error),
                promptLength,
                isConversation,
              });
            }
          }
        },
        onError: (err) => {
          activeGenerationConnection = null;
          setError(err.message || "Failed to generate workflow");
          setIsLoading(false);
          setGenerationPhase(null);

          // Call analytics callback on network error
          if (onGenerationFailed) {
            onGenerationFailed({
              errorType: "network",
              promptLength,
              isConversation,
            });
          }
        },
        onClose: () => {
          activeGenerationConnection = null;
          // Stream completed - add the assistant message
          const assistantMessage: GenerateWorkflowMessage = {
            role: "assistant",
            content: receivedWorkflow
              ? "I've created a workflow based on your description. Click 'Apply to Canvas' to use it."
              : "I couldn't generate a workflow. Please try a different description.",
            workflow: receivedWorkflow,
            timestamp: Date.now(),
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setIsLoading(false);
          setGenerationPhase(null);
          setGenerationMessage("");
        },
      }
    );
  }, [input, isLoading, messages, selectedModel, onGenerationSuccess, onGenerationFailed]);

  const handleCancelGeneration = useCallback(() => {
    if (activeGenerationConnection) {
      activeGenerationConnection.abort();
      activeGenerationConnection = null;
    }
    setIsLoading(false);
    setGenerationPhase(null);
    setGenerationMessage("");
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleApply = (workflow: GeneratedWorkflowData) => {
    onApplyWorkflow(workflow);
    onClose();
  };

  const handleNewChat = () => {
    setMessages([]);
    setError(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-teal-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                AI Workflow Generator
              </h3>
            </div>
            {/* Model selector dropdown */}
            {availableModels.length > 1 ? (
              <div className="relative" ref={modelDropdownRef}>
                <button
                  onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
                  className="flex items-center gap-1.5 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-1 rounded hover:bg-teal-200 dark:hover:bg-teal-800 transition-colors"
                  disabled={isLoading}
                >
                  <span>
                    {availableModels.find((m) => m.id === selectedModel)?.name || "Select Model"}
                  </span>
                  <svg
                    className={`h-3 w-3 transition-transform ${isModelDropdownOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {isModelDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-zinc-800 rounded-lg shadow-lg border border-gray-200 dark:border-zinc-700 py-1 z-10">
                    {availableModels.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-zinc-700 ${
                          selectedModel === model.id ? "bg-teal-50 dark:bg-teal-900/30" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {model.name}
                          </span>
                          {model.isDefault && (
                            <span className="text-xs text-teal-600 dark:text-teal-400">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                          {model.description}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded">
                {availableModels[0]?.name || "Gemini"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="p-2 text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200 hover:bg-gray-100 dark:hover:bg-zinc-700 rounded"
                title="New Chat"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
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

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {isAvailable === false && (
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {/* Icon varies by reason */}
                {statusReason === "tier_limit" ? (
                  <svg
                    className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5"
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
                )}
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    {statusReason === "tier_limit"
                      ? "AI Workflow Generation Not Available"
                      : "AI Generation Not Available"}
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">{statusMessage}</p>

                  {/* Context-aware actions */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-3">
                    {statusReason === "tier_limit" && (
                      <a
                        href="/pricing"
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        View Plans
                      </a>
                    )}
                    {statusReason === "service_unavailable" && supportUrl && (
                      <a
                        href={supportUrl}
                        className="text-sm font-medium text-amber-700 hover:text-amber-800 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        Contact Support
                      </a>
                    )}
                    {statusReason === "not_configured" && !isCloudDeployment && (
                      <a
                        href="https://floimg.com/docs/studio/ai-workflows"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
                      >
                        View Setup Guide
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.length === 0 && isAvailable !== false && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 dark:bg-teal-900/50 rounded-full mb-4">
                <svg
                  className="h-8 w-8 text-teal-600 dark:text-teal-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Describe your workflow
              </h4>
              <p className="text-sm text-gray-500 dark:text-zinc-400 max-w-md mx-auto">
                Tell me what you want to create and I&apos;ll generate a workflow for you. For
                example:
              </p>
              <div className="mt-4 space-y-2">
                {[
                  "Generate an image of a sunset and resize it to 800x600",
                  "Use Gemini text to generate 3 creative image prompts about space exploration, then generate images from each prompt",
                  "Generate an image with Gemini, then use it as a reference to create a variation with different lighting",
                  "Create a product mockup: generate a minimalist logo, then composite it onto a t-shirt image",
                  "Build an AI art pipeline: generate a base image, apply artistic style transfer, then upscale to 4K",
                ].map((example, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(example)}
                    className="block w-full text-left text-sm px-4 py-2 bg-gray-100 dark:bg-zinc-700 hover:bg-gray-200 dark:hover:bg-zinc-600 rounded-lg text-gray-700 dark:text-zinc-300 transition-colors"
                  >
                    &quot;{example}&quot;
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === "user"
                    ? "bg-teal-600 text-white"
                    : "bg-gray-100 dark:bg-zinc-700 text-gray-900 dark:text-white"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

                {/* Workflow preview for assistant messages */}
                {msg.role === "assistant" && msg.workflow && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-zinc-600">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500 dark:text-zinc-400">
                        Generated Workflow
                      </span>
                      <button
                        onClick={() => handleApply(msg.workflow!)}
                        className="text-xs px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded transition-colors"
                      >
                        Apply to Canvas
                      </button>
                    </div>
                    <div className="bg-white dark:bg-zinc-800 rounded p-2 text-xs">
                      <div className="space-y-1">
                        {msg.workflow.nodes.map((node, nodeIdx) => (
                          <div
                            key={nodeIdx}
                            className="flex items-center gap-2 text-gray-600 dark:text-zinc-300"
                          >
                            <span className="font-mono bg-gray-100 dark:bg-zinc-700 px-1.5 py-0.5 rounded">
                              {node.nodeType.split(":").pop()}
                            </span>
                            {node.label && <span className="text-gray-400">({node.label})</span>}
                          </div>
                        ))}
                        {msg.workflow.edges.length > 0 && (
                          <div className="text-gray-400 dark:text-zinc-500 pt-1">
                            {msg.workflow.edges.length} connection
                            {msg.workflow.edges.length !== 1 ? "s" : ""}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-zinc-700 rounded-lg px-4 py-3">
                <div className="flex items-center gap-3">
                  {/* Phase indicator */}
                  <div className="flex items-center gap-2">
                    {generationPhase === "analyzing" && (
                      <svg
                        className="h-4 w-4 text-teal-500 animate-pulse"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    )}
                    {generationPhase === "selecting_nodes" && (
                      <svg
                        className="h-4 w-4 text-teal-500 animate-pulse"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                        />
                      </svg>
                    )}
                    {generationPhase === "generating" && (
                      <svg
                        className="h-4 w-4 text-teal-500 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    )}
                    {generationPhase === "validating" && (
                      <svg
                        className="h-4 w-4 text-teal-500 animate-pulse"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    )}
                    {!generationPhase && (
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        />
                        <div
                          className="w-2 h-2 bg-teal-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                      </div>
                    )}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-zinc-300">
                    {generationMessage || "Connecting..."}
                  </span>
                  {/* Cancel button */}
                  <button
                    onClick={handleCancelGeneration}
                    className="ml-2 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                    title="Cancel generation"
                  >
                    Cancel
                  </button>
                </div>
                {/* Progress steps */}
                {generationPhase && (
                  <div className="flex items-center gap-1 mt-2">
                    <div
                      className={`h-1 w-8 rounded-full ${generationPhase === "analyzing" || generationPhase === "selecting_nodes" || generationPhase === "generating" || generationPhase === "validating" ? "bg-teal-500" : "bg-gray-300 dark:bg-zinc-600"}`}
                    />
                    <div
                      className={`h-1 w-8 rounded-full ${generationPhase === "selecting_nodes" || generationPhase === "generating" || generationPhase === "validating" ? "bg-teal-500" : "bg-gray-300 dark:bg-zinc-600"}`}
                    />
                    <div
                      className={`h-1 w-8 rounded-full ${generationPhase === "generating" || generationPhase === "validating" ? "bg-teal-500" : "bg-gray-300 dark:bg-zinc-600"}`}
                    />
                    <div
                      className={`h-1 w-8 rounded-full ${generationPhase === "validating" ? "bg-teal-500" : "bg-gray-300 dark:bg-zinc-600"}`}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 dark:border-zinc-700 p-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isAvailable === false
                  ? "AI generation not available"
                  : "Describe what workflow you want to create..."
              }
              disabled={isLoading || isAvailable === false}
              rows={2}
              className="flex-1 resize-none rounded-lg border border-gray-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 px-4 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button
              onClick={handleSubmit}
              disabled={!input.trim() || isLoading || isAvailable === false}
              className="self-end px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-zinc-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
