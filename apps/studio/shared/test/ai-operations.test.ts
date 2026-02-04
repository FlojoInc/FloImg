import { describe, it, expect } from "vitest";
import type {
  AIWorkflowOperation,
  AIIterativeResponse,
  CanvasSnapshot,
  GenerationSSEIterative,
  OperationConflict,
  ConflictDetectionResult,
  ResolvedConflict,
  ConflictType,
} from "../src/index.js";

describe("AI Operation Types", () => {
  describe("AIWorkflowOperation", () => {
    it("should accept a valid add operation", () => {
      const op: AIWorkflowOperation = {
        type: "add",
        nodeType: "transform:sharp:resize",
        label: "Resize to 800x600",
        parameters: { width: 800, height: 600 },
      };

      expect(op.type).toBe("add");
      expect(op.nodeType).toBe("transform:sharp:resize");
      expect(op.parameters).toEqual({ width: 800, height: 600 });
    });

    it("should accept a valid modify operation", () => {
      const op: AIWorkflowOperation = {
        type: "modify",
        nodeId: "node_1",
        parameters: { width: 1024 },
        explanation: "Changed resize width to 1024",
      };

      expect(op.type).toBe("modify");
      expect(op.nodeId).toBe("node_1");
      expect(op.parameters).toEqual({ width: 1024 });
    });

    it("should accept a valid delete operation", () => {
      const op: AIWorkflowOperation = {
        type: "delete",
        nodeId: "node_2",
        explanation: "Removed grayscale transform",
      };

      expect(op.type).toBe("delete");
      expect(op.nodeId).toBe("node_2");
    });

    it("should accept a valid connect operation", () => {
      const op: AIWorkflowOperation = {
        type: "connect",
        source: "node_1",
        target: "node_2",
        sourceHandle: "output",
        targetHandle: "input",
      };

      expect(op.type).toBe("connect");
      expect(op.source).toBe("node_1");
      expect(op.target).toBe("node_2");
    });

    it("should accept a valid disconnect operation", () => {
      const op: AIWorkflowOperation = {
        type: "disconnect",
        source: "node_1",
        target: "node_2",
      };

      expect(op.type).toBe("disconnect");
    });
  });

  describe("AIIterativeResponse", () => {
    it("should accept operations-mode response", () => {
      const response: AIIterativeResponse = {
        operations: [
          { type: "add", nodeType: "transform:sharp:resize" },
          { type: "connect", source: "gen_1", target: "resize_1" },
        ],
        explanation: "Added resize node after generator",
        suggestions: ["You might also want to add a save node"],
      };

      expect(response.operations).toHaveLength(2);
      expect(response.explanation).toBeTruthy();
      expect(response.suggestions).toHaveLength(1);
    });

    it("should accept workflow-mode response (fallback)", () => {
      const response: AIIterativeResponse = {
        workflow: {
          nodes: [{ id: "gen_1", nodeType: "generator:openai", parameters: {} }],
          edges: [],
        },
        explanation: "Generated a new workflow",
      };

      expect(response.workflow).toBeDefined();
      expect(response.workflow?.nodes).toHaveLength(1);
    });
  });

  describe("CanvasSnapshot", () => {
    it("should represent an empty canvas", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [],
        edges: [],
        nodeCount: 0,
        hasContent: false,
      };

      expect(snapshot.hasContent).toBe(false);
      expect(snapshot.nodeCount).toBe(0);
    });

    it("should represent a canvas with content", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [
          { id: "node_1", type: "generator", label: "DALL-E" },
          { id: "node_2", type: "transform", label: "Resize" },
        ],
        edges: [{ source: "node_1", target: "node_2" }],
        nodeCount: 2,
        hasContent: true,
      };

      expect(snapshot.hasContent).toBe(true);
      expect(snapshot.nodeCount).toBe(2);
      expect(snapshot.nodes).toHaveLength(2);
      expect(snapshot.edges).toHaveLength(1);
    });

    it("should include node parameters when present", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [
          {
            id: "node_1",
            type: "generator",
            parameters: { prompt: "A sunset" },
          },
        ],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      expect(snapshot.nodes[0].parameters).toEqual({ prompt: "A sunset" });
    });
  });

  describe("GenerationSSEIterative", () => {
    it("should be a valid SSE event type", () => {
      const event: GenerationSSEIterative = {
        type: "generation.iterative",
        data: {
          operations: [{ type: "add", nodeType: "generator:openai" }],
          explanation: "Added generator node",
        },
      };

      expect(event.type).toBe("generation.iterative");
      expect(event.data.operations).toHaveLength(1);
    });
  });
});

describe("Operation Type Validation", () => {
  it("should only allow valid operation types", () => {
    // TypeScript compile-time check - this validates the union type
    const validTypes: AIWorkflowOperation["type"][] = [
      "add",
      "modify",
      "delete",
      "connect",
      "disconnect",
    ];

    expect(validTypes).toHaveLength(5);
    expect(validTypes).toContain("add");
    expect(validTypes).toContain("modify");
    expect(validTypes).toContain("delete");
    expect(validTypes).toContain("connect");
    expect(validTypes).toContain("disconnect");
  });

  it("should validate add operations require nodeType", () => {
    // When type is "add", nodeType should be provided
    const addOp: AIWorkflowOperation = {
      type: "add",
      nodeType: "generator:openai",
    };

    expect(addOp.nodeType).toBeDefined();
  });

  it("should validate modify/delete operations require nodeId", () => {
    // When type is "modify" or "delete", nodeId should be provided
    const modifyOp: AIWorkflowOperation = {
      type: "modify",
      nodeId: "node_123",
      parameters: { width: 500 },
    };

    const deleteOp: AIWorkflowOperation = {
      type: "delete",
      nodeId: "node_456",
    };

    expect(modifyOp.nodeId).toBeDefined();
    expect(deleteOp.nodeId).toBeDefined();
  });

  it("should validate connect/disconnect operations require source and target", () => {
    // When type is "connect" or "disconnect", source and target should be provided
    const connectOp: AIWorkflowOperation = {
      type: "connect",
      source: "node_1",
      target: "node_2",
    };

    const disconnectOp: AIWorkflowOperation = {
      type: "disconnect",
      source: "node_3",
      target: "node_4",
    };

    expect(connectOp.source).toBeDefined();
    expect(connectOp.target).toBeDefined();
    expect(disconnectOp.source).toBeDefined();
    expect(disconnectOp.target).toBeDefined();
  });
});

describe("Node Type Format", () => {
  it("should use colon-separated format for node types", () => {
    // Node types follow the pattern: category:provider:operation
    const nodeTypes = [
      "generator:openai",
      "generator:stability",
      "generator:google-imagen",
      "transform:sharp:resize",
      "transform:sharp:grayscale",
      "transform:stability:removeBackground",
      "save:filesystem",
      "save:s3",
      "input:upload",
      "vision:gemini",
      "text:gemini",
      "fanout",
      "collect",
      "router",
    ];

    nodeTypes.forEach((nodeType) => {
      // All node types should be non-empty strings
      expect(typeof nodeType).toBe("string");
      expect(nodeType.length).toBeGreaterThan(0);

      // Multi-part types should have colons
      if (nodeType.includes(":")) {
        const parts = nodeType.split(":");
        expect(parts.length).toBeGreaterThanOrEqual(2);
        expect(parts[0]).toBeTruthy(); // First part (category) should exist
      }
    });
  });
});

describe("Conflict Detection Types", () => {
  it("should define all conflict types", () => {
    const conflictTypes: ConflictType[] = [
      "modified_by_both",
      "deleted_by_ai",
      "deleted_by_user",
      "reconnect_conflict",
    ];

    expect(conflictTypes).toHaveLength(4);
  });

  it("should structure OperationConflict correctly", () => {
    const conflict: OperationConflict = {
      operation: { type: "modify", nodeId: "node_1", parameters: { width: 800 } },
      type: "modified_by_both",
      nodeId: "node_1",
      description: "Both you and AI modified this node",
      userValue: { width: 500 },
      aiValue: { width: 800 },
    };

    expect(conflict.operation.type).toBe("modify");
    expect(conflict.type).toBe("modified_by_both");
    expect(conflict.nodeId).toBe("node_1");
    expect(conflict.userValue).toEqual({ width: 500 });
    expect(conflict.aiValue).toEqual({ width: 800 });
  });

  it("should structure ConflictDetectionResult correctly", () => {
    const result: ConflictDetectionResult = {
      hasConflicts: true,
      conflicts: [
        {
          operation: { type: "modify", nodeId: "node_1" },
          type: "modified_by_both",
          nodeId: "node_1",
          description: "Conflict detected",
        },
      ],
      safeOperations: [{ type: "add", nodeType: "generator:openai" }],
    };

    expect(result.hasConflicts).toBe(true);
    expect(result.conflicts).toHaveLength(1);
    expect(result.safeOperations).toHaveLength(1);
  });

  it("should structure ResolvedConflict correctly", () => {
    const resolved: ResolvedConflict = {
      conflict: {
        operation: { type: "delete", nodeId: "node_1" },
        type: "deleted_by_ai",
        nodeId: "node_1",
        description: "AI wants to delete node you modified",
      },
      resolution: "keep_mine",
    };

    expect(resolved.conflict.type).toBe("deleted_by_ai");
    expect(resolved.resolution).toBe("keep_mine");
  });

  it("should accept all valid resolution types", () => {
    const resolutions: ResolvedConflict["resolution"][] = ["keep_mine", "accept_ai", "skip"];

    expect(resolutions).toHaveLength(3);
    expect(resolutions).toContain("keep_mine");
    expect(resolutions).toContain("accept_ai");
    expect(resolutions).toContain("skip");
  });
});
