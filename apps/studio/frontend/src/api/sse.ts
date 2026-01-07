/**
 * Server-Sent Events (SSE) client utility
 *
 * Handles POST-based SSE connections for streaming execution and generation updates.
 * Uses fetch with streaming response body parsing.
 */

export interface SSEConnectionHandlers<T> {
  onMessage: (event: T) => void;
  onError: (error: Error) => void;
  onClose: () => void;
}

export interface SSEConnection {
  abort: () => void;
}

/**
 * Create an SSE connection using POST request with JSON body.
 *
 * SSE typically uses GET, but we need POST to send workflow data.
 * This implements manual SSE parsing over a fetch streaming response.
 */
export function createSSEConnection<T>(
  url: string,
  body: unknown,
  handlers: SSEConnectionHandlers<T>
): SSEConnection {
  const controller = new AbortController();

  // Start the streaming request
  (async () => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorBody.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Response body is not readable");
      }

      const decoder = new globalThis.TextDecoder();
      let buffer = "";

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          // Process any remaining data in buffer
          if (buffer.trim()) {
            processBuffer(buffer, handlers);
          }
          break;
        }

        // Decode chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE messages (separated by double newlines)
        const messages = buffer.split("\n\n");
        buffer = messages.pop() || ""; // Keep incomplete message in buffer

        for (const message of messages) {
          if (message.trim()) {
            processSSEMessage(message, handlers);
          }
        }
      }

      handlers.onClose();
    } catch (error) {
      // Don't report abort errors
      if (error instanceof Error && error.name === "AbortError") {
        handlers.onClose();
        return;
      }
      handlers.onError(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return {
    abort: () => controller.abort(),
  };
}

/**
 * Process a single SSE message block
 */
function processSSEMessage<T>(message: string, handlers: SSEConnectionHandlers<T>): void {
  const lines = message.split("\n");
  let data = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      // Accumulate data lines (SSE spec allows multiple data: lines)
      data += (data ? "\n" : "") + line.slice(6);
    }
    // Ignore other SSE fields (event:, id:, retry:) for simplicity
  }

  if (data) {
    try {
      const parsed = JSON.parse(data) as T;
      handlers.onMessage(parsed);
    } catch {
      console.warn("Failed to parse SSE data:", data);
    }
  }
}

/**
 * Process remaining buffer content
 */
function processBuffer<T>(buffer: string, handlers: SSEConnectionHandlers<T>): void {
  const lines = buffer.split("\n");
  let data = "";

  for (const line of lines) {
    if (line.startsWith("data: ")) {
      data += (data ? "\n" : "") + line.slice(6);
    }
  }

  if (data) {
    try {
      const parsed = JSON.parse(data) as T;
      handlers.onMessage(parsed);
    } catch {
      // Ignore incomplete data at end of stream
    }
  }
}
