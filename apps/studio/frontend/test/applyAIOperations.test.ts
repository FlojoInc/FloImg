import { describe, it, expect, beforeEach } from "vitest";
import { useWorkflowStore } from "../src/stores/workflowStore";
import type { AIWorkflowOperation } from "@teamflojo/floimg-studio-shared";

describe("applyAIOperations", () => {
  // Reset store before each test
  beforeEach(() => {
    useWorkflowStore.setState({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      generators: [],
      transforms: [],
      textProviders: [],
      visionProviders: [],
      hasUnsavedChanges: false,
    });
  });

  describe("add operations", () => {
    it("should add a generator node", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "add",
          nodeId: "gen_1",
          nodeType: "generator:openai",
          label: "DALL-E Generator",
          parameters: { prompt: "A sunset" },
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe("generator");
      expect(nodes[0].data.generatorName).toBe("openai");
      expect(nodes[0].data.params).toEqual({ prompt: "A sunset" });
    });

    it("should add a transform node", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "add",
          nodeType: "transform:sharp:resize",
          label: "Resize",
          parameters: { width: 800, height: 600 },
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe("transform");
      expect(nodes[0].data.operation).toBe("resize");
      expect(nodes[0].data.providerName).toBe("sharp");
    });

    it("should add a save node", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "add",
          nodeType: "save:filesystem",
          parameters: { destination: "./output/image.png" },
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe("save");
      expect(nodes[0].data.destination).toBe("./output/image.png");
    });

    it("should add a fanout node", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "add",
          nodeType: "fanout",
          parameters: { count: 3, mode: "count" },
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].type).toBe("fanout");
      expect(nodes[0].data.count).toBe(3);
    });

    it("should add multiple nodes with different positions", () => {
      const operations: AIWorkflowOperation[] = [
        { type: "add", nodeType: "generator:openai" },
        { type: "add", nodeType: "transform:sharp:resize" },
        { type: "add", nodeType: "save:filesystem" },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(3);

      // Each node should have a different y position (vertical offset)
      const yPositions = nodes.map((n) => n.position.y);
      const uniqueYPositions = new Set(yPositions);
      expect(uniqueYPositions.size).toBe(3);
    });

    it("should skip operations with invalid nodeType", () => {
      const operations: AIWorkflowOperation[] = [
        { type: "add", nodeType: "invalid:type" },
        { type: "add", nodeType: "" },
        { type: "add", nodeType: "generator:openai" },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1); // Only the valid operation
      expect(nodes[0].type).toBe("generator");
    });

    it("should skip operations with missing nodeType", () => {
      const operations: AIWorkflowOperation[] = [
        { type: "add" } as AIWorkflowOperation,
        { type: "add", nodeType: "generator:openai" },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
    });
  });

  describe("modify operations", () => {
    beforeEach(() => {
      // Set up initial node
      useWorkflowStore.setState({
        nodes: [
          {
            id: "existing_node",
            type: "transform",
            position: { x: 100, y: 100 },
            data: {
              operation: "resize",
              providerName: "sharp",
              params: { width: 500, height: 500 },
            },
          },
        ],
        edges: [],
      });
    });

    it("should modify existing node parameters", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "modify",
          nodeId: "existing_node",
          parameters: { width: 800, height: 600 },
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].data.params.width).toBe(800);
      expect(nodes[0].data.params.height).toBe(600);
    });

    it("should modify node label", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "modify",
          nodeId: "existing_node",
          label: "HD Resize",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes[0].data.providerLabel).toBe("HD Resize");
    });

    it("should skip modify for non-existent node", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "modify",
          nodeId: "non_existent_node",
          parameters: { width: 1000 },
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      // Original node unchanged
      expect(nodes[0].data.params.width).toBe(500);
    });

    it("should skip modify without nodeId", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "modify",
          parameters: { width: 1000 },
        } as AIWorkflowOperation,
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes[0].data.params.width).toBe(500);
    });
  });

  describe("delete operations", () => {
    beforeEach(() => {
      useWorkflowStore.setState({
        nodes: [
          {
            id: "node_1",
            type: "generator",
            position: { x: 100, y: 100 },
            data: { generatorName: "openai", params: {} },
          },
          {
            id: "node_2",
            type: "transform",
            position: { x: 300, y: 100 },
            data: { operation: "resize", providerName: "sharp", params: {} },
          },
        ],
        edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
      });
    });

    it("should delete a node", () => {
      const operations: AIWorkflowOperation[] = [{ type: "delete", nodeId: "node_2" }];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe("node_1");
    });

    it("should remove connected edges when deleting a node", () => {
      const operations: AIWorkflowOperation[] = [{ type: "delete", nodeId: "node_2" }];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { edges } = useWorkflowStore.getState();
      expect(edges).toHaveLength(0);
    });

    it("should skip delete for non-existent node", () => {
      const operations: AIWorkflowOperation[] = [{ type: "delete", nodeId: "non_existent" }];

      const initialNodes = useWorkflowStore.getState().nodes.length;
      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(initialNodes);
    });
  });

  describe("connect operations", () => {
    beforeEach(() => {
      useWorkflowStore.setState({
        nodes: [
          {
            id: "node_1",
            type: "generator",
            position: { x: 100, y: 100 },
            data: { generatorName: "openai", params: {} },
          },
          {
            id: "node_2",
            type: "transform",
            position: { x: 300, y: 100 },
            data: { operation: "resize", providerName: "sharp", params: {} },
          },
        ],
        edges: [],
      });
    });

    it("should connect two nodes", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "connect",
          source: "node_1",
          target: "node_2",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { edges } = useWorkflowStore.getState();
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe("node_1");
      expect(edges[0].target).toBe("node_2");
    });

    it("should include handles in edge", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "connect",
          source: "node_1",
          target: "node_2",
          sourceHandle: "output",
          targetHandle: "input",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { edges } = useWorkflowStore.getState();
      expect(edges[0].sourceHandle).toBe("output");
      expect(edges[0].targetHandle).toBe("input");
    });

    it("should not duplicate existing edge", () => {
      useWorkflowStore.setState({
        ...useWorkflowStore.getState(),
        edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
      });

      const operations: AIWorkflowOperation[] = [
        {
          type: "connect",
          source: "node_1",
          target: "node_2",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { edges } = useWorkflowStore.getState();
      expect(edges).toHaveLength(1);
    });

    it("should connect to newly added nodes using ID mapping", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "add",
          nodeId: "new_node",
          nodeType: "transform:sharp:grayscale",
        },
        {
          type: "connect",
          source: "node_1",
          target: "new_node",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes, edges } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(1);

      // The edge should connect to the real node ID, not "new_node"
      const addedNode = nodes.find(
        (n) => n.type === "transform" && n.data.operation === "grayscale"
      );
      expect(addedNode).toBeDefined();
      expect(edges[0].target).toBe(addedNode!.id);
    });
  });

  describe("disconnect operations", () => {
    beforeEach(() => {
      useWorkflowStore.setState({
        nodes: [
          {
            id: "node_1",
            type: "generator",
            position: { x: 100, y: 100 },
            data: { generatorName: "openai", params: {} },
          },
          {
            id: "node_2",
            type: "transform",
            position: { x: 300, y: 100 },
            data: { operation: "resize", providerName: "sharp", params: {} },
          },
        ],
        edges: [{ id: "edge_1", source: "node_1", target: "node_2" }],
      });
    });

    it("should disconnect two nodes", () => {
      const operations: AIWorkflowOperation[] = [
        {
          type: "disconnect",
          source: "node_1",
          target: "node_2",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { edges } = useWorkflowStore.getState();
      expect(edges).toHaveLength(0);
    });

    it("should only remove the specified edge", () => {
      useWorkflowStore.setState({
        ...useWorkflowStore.getState(),
        nodes: [
          ...useWorkflowStore.getState().nodes,
          {
            id: "node_3",
            type: "save",
            position: { x: 500, y: 100 },
            data: { destination: "./output.png", provider: "filesystem" },
          },
        ],
        edges: [
          { id: "edge_1", source: "node_1", target: "node_2" },
          { id: "edge_2", source: "node_2", target: "node_3" },
        ],
      });

      const operations: AIWorkflowOperation[] = [
        {
          type: "disconnect",
          source: "node_1",
          target: "node_2",
        },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { edges } = useWorkflowStore.getState();
      expect(edges).toHaveLength(1);
      expect(edges[0].source).toBe("node_2");
      expect(edges[0].target).toBe("node_3");
    });
  });

  describe("mixed operations", () => {
    it("should apply multiple operations in sequence", () => {
      const operations: AIWorkflowOperation[] = [
        { type: "add", nodeId: "gen", nodeType: "generator:openai" },
        { type: "add", nodeId: "resize", nodeType: "transform:sharp:resize" },
        { type: "add", nodeId: "save", nodeType: "save:filesystem" },
        { type: "connect", source: "gen", target: "resize" },
        { type: "connect", source: "resize", target: "save" },
      ];

      useWorkflowStore.getState().applyAIOperations(operations);

      const { nodes, edges } = useWorkflowStore.getState();
      expect(nodes).toHaveLength(3);
      expect(edges).toHaveLength(2);
    });

    it("should mark workflow as having unsaved changes", () => {
      expect(useWorkflowStore.getState().hasUnsavedChanges).toBe(false);

      const operations: AIWorkflowOperation[] = [{ type: "add", nodeType: "generator:openai" }];

      useWorkflowStore.getState().applyAIOperations(operations);

      expect(useWorkflowStore.getState().hasUnsavedChanges).toBe(true);
    });
  });
});
