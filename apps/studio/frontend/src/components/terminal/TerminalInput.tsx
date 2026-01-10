import { useCallback, useRef, KeyboardEvent } from "react";
import { useTerminalStore } from "../../stores/terminalStore";
import { useWorkflowStore } from "../../stores/workflowStore";
import { useSettingsStore } from "../../stores/settingsStore";
import { createSSEConnection } from "../../api/sse";
import type {
  ExecutionSSEEvent,
  GeneratedWorkflowData,
  ExecutionStepResult,
} from "@teamflojo/floimg-studio-shared";

// Command definitions
const COMMANDS = {
  help: "Show available commands",
  workflows: "Browse and select saved workflows",
  run: "Run a workflow by name: /run [workflow-name]",
  new: "Create a new workflow with AI assistance",
  images: "Browse generated images",
  clear: "Clear terminal history",
  status: "Show current workflow status",
};

interface TerminalInputProps {
  onApplyWorkflow?: (workflow: GeneratedWorkflowData) => void;
}

export function TerminalInput({ onApplyWorkflow: _onApplyWorkflow }: TerminalInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inputValue = useTerminalStore((s) => s.inputValue);
  const setInputValue = useTerminalStore((s) => s.setInputValue);
  const isProcessing = useTerminalStore((s) => s.isProcessing);
  const setProcessing = useTerminalStore((s) => s.setProcessing);
  const addMessage = useTerminalStore((s) => s.addMessage);
  const updateMessage = useTerminalStore((s) => s.updateMessage);
  const clearMessages = useTerminalStore((s) => s.clearMessages);
  const openPanel = useTerminalStore((s) => s.openPanel);
  const conversationMode = useTerminalStore((s) => s.conversationMode);
  const setConversationMode = useTerminalStore((s) => s.setConversationMode);
  const appendToHistory = useTerminalStore((s) => s.appendToHistory);
  const setActiveExecutionMessageId = useTerminalStore((s) => s.setActiveExecutionMessageId);

  const savedWorkflows = useWorkflowStore((s) => s.savedWorkflows);
  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const aiProviders = useSettingsStore((s) => s.ai);

  // Handle /help command
  const handleHelp = useCallback(() => {
    const helpText = Object.entries(COMMANDS)
      .map(([cmd, desc]) => `  **/${cmd}** - ${desc}`)
      .join("\n");
    addMessage({
      type: "system",
      content: `**Available Commands:**\n\n${helpText}\n\nYou can also type naturally to chat with the AI assistant.`,
    });
  }, [addMessage]);

  // Handle /clear command
  const handleClear = useCallback(() => {
    clearMessages();
  }, [clearMessages]);

  // Handle /workflows command
  const handleWorkflows = useCallback(() => {
    if (savedWorkflows.length === 0) {
      addMessage({
        type: "system",
        content:
          "No saved workflows found. Create one in the Editor tab or use **/new** to create with AI.",
      });
      return;
    }
    addMessage({
      type: "system",
      content: `Found ${savedWorkflows.length} workflow${savedWorkflows.length !== 1 ? "s" : ""}. Opening selector...`,
    });
    openPanel("workflow");
  }, [savedWorkflows.length, addMessage, openPanel]);

  // Handle /run command
  const handleRun = useCallback(
    async (args: string[]) => {
      const workflowName = args.join(" ").trim();

      // If no name provided, show selector
      if (!workflowName) {
        if (savedWorkflows.length === 0) {
          addMessage({
            type: "system",
            content: "No saved workflows found. Create one first.",
          });
          return;
        }
        addMessage({
          type: "system",
          content: "Select a workflow to run:",
        });
        openPanel("workflow");
        return;
      }

      // Find workflow by name (case-insensitive partial match)
      const workflow = savedWorkflows.find(
        (w) =>
          w.name.toLowerCase() === workflowName.toLowerCase() ||
          w.name.toLowerCase().includes(workflowName.toLowerCase())
      );

      if (!workflow) {
        addMessage({
          type: "error",
          content: `Workflow "${workflowName}" not found. Use **/workflows** to see available workflows.`,
        });
        return;
      }

      // Execute the workflow
      addMessage({
        type: "system",
        content: `Executing **${workflow.name}**...`,
      });

      const executionMsgId = addMessage({
        type: "execution",
        content: "Starting execution...",
        metadata: {
          nodeStatuses: {},
          totalNodes: workflow.nodes.length,
          completedNodes: 0,
        },
      });

      setActiveExecutionMessageId(executionMsgId);
      setProcessing(true);

      const enabledProviders = Object.entries(aiProviders)
        .filter(([, config]) => config.enabled && config.apiKey)
        .reduce(
          (acc, [key, config]) => {
            acc[key] = config;
            return acc;
          },
          {} as Record<string, { apiKey: string; enabled: boolean }>
        );

      let completedCount = 0;
      const nodeStatuses: Record<string, ExecutionStepResult["status"]> = {};

      createSSEConnection<ExecutionSSEEvent>(
        "/api/execute/stream",
        {
          nodes: workflow.nodes,
          edges: workflow.edges,
          aiProviders: enabledProviders,
        },
        {
          onMessage: (event) => {
            if (event.type === "execution.step") {
              const { nodeId, status } = event.data;
              nodeStatuses[nodeId] = status;
              if (status === "completed") {
                completedCount++;
              }
              updateMessage(executionMsgId, {
                metadata: {
                  nodeStatuses: { ...nodeStatuses },
                  totalNodes: workflow.nodes.length,
                  completedNodes: completedCount,
                },
              });
            }

            if (event.type === "execution.completed") {
              const { imageIds, imageUrls } = event.data;
              addMessage({
                type: "result",
                content: `Completed! Generated ${imageIds?.length || 0} image${(imageIds?.length || 0) !== 1 ? "s" : ""}.`,
                metadata: {
                  imageIds,
                  imageUrls,
                },
              });
              setActiveExecutionMessageId(null);
              setProcessing(false);
            }

            if (event.type === "execution.error") {
              addMessage({
                type: "error",
                content: `Execution failed: ${event.data.error}`,
              });
              setActiveExecutionMessageId(null);
              setProcessing(false);
            }
          },
          onError: (error) => {
            addMessage({
              type: "error",
              content: `Connection error: ${error.message}`,
            });
            setActiveExecutionMessageId(null);
            setProcessing(false);
          },
          onClose: () => {
            setProcessing(false);
          },
        }
      );
    },
    [
      savedWorkflows,
      addMessage,
      updateMessage,
      openPanel,
      aiProviders,
      setProcessing,
      setActiveExecutionMessageId,
    ]
  );

  // Handle /images command
  const handleImages = useCallback(() => {
    addMessage({
      type: "system",
      content: "Opening image gallery...",
    });
    openPanel("image");
  }, [addMessage, openPanel]);

  // Handle /status command
  const handleStatus = useCallback(() => {
    const activeWorkflowName = useWorkflowStore.getState().activeWorkflowName;
    const nodeCount = nodes.length;
    const edgeCount = edges.length;

    if (nodeCount === 0) {
      addMessage({
        type: "system",
        content:
          "No workflow loaded on canvas. Use **/workflows** to load one or **/new** to create one.",
      });
      return;
    }

    addMessage({
      type: "system",
      content: `**Current Workflow:** ${activeWorkflowName}\n**Nodes:** ${nodeCount}\n**Connections:** ${edgeCount}`,
    });
  }, [nodes.length, edges.length, addMessage]);

  // Handle /new command - start AI workflow creation
  const handleNew = useCallback(() => {
    setConversationMode("creating");
    addMessage({
      type: "assistant",
      content:
        "What kind of image workflow would you like to create? Describe what you want to accomplish - for example:\n\n- Generate a portrait with DALL-E and resize it\n- Take an uploaded image and apply artistic transforms\n- Create variations of an image with different styles",
    });
  }, [setConversationMode, addMessage]);

  // Parse and handle input
  const handleSubmit = useCallback(() => {
    const input = inputValue.trim();
    if (!input || isProcessing) return;

    // Add user message
    addMessage({ type: "user", content: input });
    setInputValue("");

    // Check if it's a command
    if (input.startsWith("/")) {
      const parts = input.slice(1).split(/\s+/);
      const command = parts[0].toLowerCase();
      const args = parts.slice(1);

      switch (command) {
        case "help":
          handleHelp();
          break;
        case "clear":
          handleClear();
          break;
        case "workflows":
          handleWorkflows();
          break;
        case "run":
          handleRun(args);
          break;
        case "images":
          handleImages();
          break;
        case "status":
          handleStatus();
          break;
        case "new":
          handleNew();
          break;
        default:
          addMessage({
            type: "error",
            content: `Unknown command: /${command}. Type **/help** for available commands.`,
          });
      }
      return;
    }

    // If in conversation mode, send to AI (to be implemented in Phase 3)
    if (conversationMode === "creating") {
      appendToHistory({ role: "user", content: input });
      addMessage({
        type: "assistant",
        content:
          "AI workflow generation coming soon! For now, use the **AI Generate** button in the Editor tab.",
        metadata: { isStreaming: false },
      });
      return;
    }

    // Default: treat as question, suggest commands
    addMessage({
      type: "system",
      content: "Type **/help** for commands, or **/new** to create a workflow with AI assistance.",
    });
  }, [
    inputValue,
    isProcessing,
    addMessage,
    setInputValue,
    handleHelp,
    handleClear,
    handleWorkflows,
    handleRun,
    handleImages,
    handleStatus,
    handleNew,
    conversationMode,
    appendToHistory,
  ]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  // Auto-resize textarea
  const handleInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, []);

  return (
    <div className="border-t border-zinc-800 p-4">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-500 font-mono text-sm">
            {conversationMode === "creating" ? "ai>" : "$"}
          </div>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              handleInput();
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              conversationMode === "creating"
                ? "Describe what you want to create..."
                : "Type a command or /help..."
            }
            disabled={isProcessing}
            rows={1}
            className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-100 placeholder-zinc-500 font-mono text-sm resize-none focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:opacity-50"
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !inputValue.trim()}
          className="px-4 py-3 bg-teal-600 text-white rounded-lg font-medium text-sm hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isProcessing ? (
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 5l7 7-7 7M5 5l7 7-7 7"
              />
            </svg>
          )}
        </button>
      </div>
      {conversationMode === "creating" && (
        <div className="mt-2 flex items-center gap-2">
          <span className="text-xs text-zinc-500">AI mode active - describing a new workflow</span>
          <button
            onClick={() => {
              setConversationMode("idle");
              addMessage({
                type: "system",
                content: "Exited AI workflow creation mode.",
              });
            }}
            className="text-xs text-zinc-400 hover:text-zinc-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
