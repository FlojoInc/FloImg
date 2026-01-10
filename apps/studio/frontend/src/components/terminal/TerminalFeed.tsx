import { useEffect, useRef } from "react";
import { useTerminalStore, type TerminalMessage } from "../../stores/terminalStore";
import { UserMessage } from "./messages/UserMessage";
import { AssistantMessage } from "./messages/AssistantMessage";
import { SystemMessage } from "./messages/SystemMessage";
import { ExecutionProgress } from "./messages/ExecutionProgress";
import { ImageResult } from "./messages/ImageResult";
import { ErrorMessage } from "./messages/ErrorMessage";

function MessageRenderer({ message }: { message: TerminalMessage }) {
  switch (message.type) {
    case "user":
      return <UserMessage content={message.content} />;
    case "assistant":
      return (
        <AssistantMessage
          content={message.content}
          workflowData={message.metadata?.workflowData}
          isStreaming={message.metadata?.isStreaming}
        />
      );
    case "system":
      return <SystemMessage content={message.content} />;
    case "execution":
      return (
        <ExecutionProgress
          nodeStatuses={message.metadata?.nodeStatuses}
          totalNodes={message.metadata?.totalNodes}
          completedNodes={message.metadata?.completedNodes}
        />
      );
    case "result":
      return (
        <ImageResult
          imageIds={message.metadata?.imageIds}
          imageUrls={message.metadata?.imageUrls}
          previews={message.metadata?.previews}
        />
      );
    case "error":
      return <ErrorMessage content={message.content} />;
    default:
      return null;
  }
}

export function TerminalFeed() {
  const messages = useTerminalStore((s) => s.messages);
  const feedRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div
      ref={feedRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent"
    >
      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center">
          <div className="text-zinc-600 mb-4">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-zinc-500 text-sm mb-2">Welcome to FloImg Terminal</p>
          <p className="text-zinc-600 text-xs max-w-sm">
            A command-line interface for managing and executing image workflows. Type{" "}
            <code className="text-teal-500">/help</code> to see available commands.
          </p>
        </div>
      ) : (
        messages.map((message) => (
          <div key={message.id} className="animate-fadeIn">
            <MessageRenderer message={message} />
          </div>
        ))
      )}
    </div>
  );
}
