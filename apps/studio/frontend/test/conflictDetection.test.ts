import { describe, it, expect, beforeEach } from "vitest";
import {
  useAIChatStore,
  type CanvasSnapshot,
  type AppliedSnapshot,
} from "../src/stores/aiChatStore";
import type { AIWorkflowOperation } from "@teamflojo/floimg-studio-shared";

describe("Conflict Detection", () => {
  beforeEach(() => {
    // Reset store before each test
    useAIChatStore.setState({
      lastAppliedSnapshot: null,
      canvasSnapshot: null,
    });
  });

  describe("detectConflicts", () => {
    it("should return no conflicts when there is no lastAppliedSnapshot", () => {
      const currentSnapshot: CanvasSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "test" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      const operations: AIWorkflowOperation[] = [
        { type: "modify", nodeId: "node_1", parameters: { prompt: "updated" } },
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.safeOperations).toHaveLength(1);
    });

    it("should detect modified_by_both conflict", () => {
      // Set up last applied snapshot
      const lastSnapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "original" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot has user edits (different parameters)
      const currentSnapshot: CanvasSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "user edited" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      // AI wants to modify the same node
      const operations: AIWorkflowOperation[] = [
        { type: "modify", nodeId: "node_1", parameters: { prompt: "ai wants this" } },
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("modified_by_both");
      expect(result.conflicts[0].nodeId).toBe("node_1");
      expect(result.safeOperations).toHaveLength(0);
    });

    it("should detect deleted_by_ai conflict", () => {
      // Set up last applied snapshot
      const lastSnapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "original" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot has user edits
      const currentSnapshot: CanvasSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "user edited" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      // AI wants to delete the node user just modified
      const operations: AIWorkflowOperation[] = [{ type: "delete", nodeId: "node_1" }];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("deleted_by_ai");
      expect(result.conflicts[0].nodeId).toBe("node_1");
    });

    it("should detect deleted_by_user conflict", () => {
      // Set up last applied snapshot with a node
      const lastSnapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "original" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot - user deleted the node
      const currentSnapshot: CanvasSnapshot = {
        nodes: [],
        edges: [],
        nodeCount: 0,
        hasContent: false,
      };

      // AI wants to modify the deleted node
      const operations: AIWorkflowOperation[] = [
        { type: "modify", nodeId: "node_1", parameters: { prompt: "ai wants to modify" } },
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("deleted_by_user");
      expect(result.conflicts[0].nodeId).toBe("node_1");
    });

    it("should detect reconnect_conflict", () => {
      // Set up last applied snapshot with an edge
      const lastSnapshot: AppliedSnapshot = {
        nodes: [
          { id: "node_1", type: "generator", parameters: {} },
          { id: "node_2", type: "transform", parameters: {} },
        ],
        edges: [{ source: "node_1", target: "node_2" }],
        nodeCount: 2,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot - user disconnected the edge
      const currentSnapshot: CanvasSnapshot = {
        nodes: [
          { id: "node_1", type: "generator", parameters: {} },
          { id: "node_2", type: "transform", parameters: {} },
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
      };

      // AI wants to reconnect the nodes
      const operations: AIWorkflowOperation[] = [
        { type: "connect", source: "node_1", target: "node_2" },
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("reconnect_conflict");
    });

    it("should separate safe operations from conflicting ones", () => {
      // Set up last applied snapshot
      const lastSnapshot: AppliedSnapshot = {
        nodes: [
          { id: "node_1", type: "generator", parameters: { prompt: "original" } },
          { id: "node_2", type: "transform", parameters: { width: 800 } },
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot - user only edited node_1
      const currentSnapshot: CanvasSnapshot = {
        nodes: [
          { id: "node_1", type: "generator", parameters: { prompt: "user edited" } },
          { id: "node_2", type: "transform", parameters: { width: 800 } }, // unchanged
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
      };

      // AI wants to modify both nodes
      const operations: AIWorkflowOperation[] = [
        { type: "modify", nodeId: "node_1", parameters: { prompt: "ai wants" } }, // conflict
        { type: "modify", nodeId: "node_2", parameters: { width: 1024 } }, // safe
        { type: "add", nodeType: "save:filesystem" }, // safe (new node)
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].nodeId).toBe("node_1");
      expect(result.safeOperations).toHaveLength(2);
    });

    it("should not conflict on unmodified nodes", () => {
      // Set up last applied snapshot
      const lastSnapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "original" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot - user hasn't changed anything
      const currentSnapshot: CanvasSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: { prompt: "original" } }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      // AI wants to modify the node
      const operations: AIWorkflowOperation[] = [
        { type: "modify", nodeId: "node_1", parameters: { prompt: "ai update" } },
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(false);
      expect(result.conflicts).toHaveLength(0);
      expect(result.safeOperations).toHaveLength(1);
    });

    it("should detect label changes as modifications", () => {
      // Set up last applied snapshot
      const lastSnapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", label: "Original Label", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now() - 1000,
      };
      useAIChatStore.setState({ lastAppliedSnapshot: lastSnapshot });

      // Current snapshot - user changed the label
      const currentSnapshot: CanvasSnapshot = {
        nodes: [{ id: "node_1", type: "generator", label: "User Label", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      // AI wants to modify the same node
      const operations: AIWorkflowOperation[] = [
        { type: "modify", nodeId: "node_1", label: "AI Label" },
      ];

      const result = useAIChatStore.getState().detectConflicts(currentSnapshot, operations);

      expect(result.hasConflicts).toBe(true);
      expect(result.conflicts).toHaveLength(1);
      expect(result.conflicts[0].type).toBe("modified_by_both");
    });
  });

  describe("setLastAppliedSnapshot", () => {
    it("should store the snapshot after AI operations", () => {
      const snapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now(),
        appliedOperations: [{ type: "add", nodeType: "generator:openai" }],
      };

      useAIChatStore.getState().setLastAppliedSnapshot(snapshot);

      const stored = useAIChatStore.getState().lastAppliedSnapshot;
      expect(stored).toEqual(snapshot);
    });

    it("should clear snapshot on resetSession", () => {
      const snapshot: AppliedSnapshot = {
        nodes: [{ id: "node_1", type: "generator", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
        timestamp: Date.now(),
      };
      useAIChatStore.setState({ lastAppliedSnapshot: snapshot });

      useAIChatStore.getState().resetSession();

      expect(useAIChatStore.getState().lastAppliedSnapshot).toBeNull();
    });
  });
});
