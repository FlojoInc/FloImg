import { describe, it, expect } from "vitest";
import type { CanvasSnapshot, ExecutionContext } from "../src/stores/aiChatStore";

/**
 * Quick action suggestion based on canvas state
 */
interface QuickAction {
  label: string;
  prompt: string;
  icon: "add" | "edit" | "save" | "sparkles";
}

/**
 * Get quick actions based on canvas state and execution context
 * (Copied from AIPanel.tsx for testing)
 */
function getQuickActions(
  canvasSnapshot: CanvasSnapshot | undefined,
  executionContext: ExecutionContext | undefined
): QuickAction[] {
  const actions: QuickAction[] = [];

  // Empty canvas - suggest generating a new workflow
  if (!canvasSnapshot?.hasContent) {
    actions.push({
      label: "Generate new workflow",
      prompt: "Create a workflow that generates an AI image and saves it",
      icon: "sparkles",
    });
    return actions;
  }

  // Has nodes - analyze what's present
  const hasGenerators = canvasSnapshot.nodes.some(
    (n) => n.type?.startsWith("generator:") || n.type?.startsWith("generator")
  );
  const hasSaveNode = canvasSnapshot.nodes.some(
    (n) => n.type?.startsWith("save:") || n.type === "save"
  );
  const hasTransforms = canvasSnapshot.nodes.some(
    (n) => n.type?.startsWith("transform:") || n.type === "transform"
  );

  // Suggest adding post-processing if only generators
  if (hasGenerators && !hasTransforms) {
    actions.push({
      label: "Add post-processing",
      prompt: "Add resize and format conversion to optimize the output images",
      icon: "add",
    });
  }

  // Suggest adding save node if missing
  if (!hasSaveNode) {
    actions.push({
      label: "Add save node",
      prompt: "Add a save node to store the final output",
      icon: "save",
    });
  }

  // After execution - suggest improvements
  if (executionContext?.status === "completed") {
    actions.push({
      label: "Improve results",
      prompt: "How can I improve the quality of these results?",
      icon: "sparkles",
    });
  }

  // After error - suggest fixes
  if (executionContext?.status === "error") {
    actions.push({
      label: "Fix errors",
      prompt: `The workflow failed with: ${executionContext.error}. Help me fix this.`,
      icon: "edit",
    });
  }

  // General improvements
  if (canvasSnapshot.nodeCount >= 2) {
    actions.push({
      label: "Add variations",
      prompt: "Add a fan-out node to generate multiple variations of this workflow",
      icon: "add",
    });
  }

  // Limit to 3 actions
  return actions.slice(0, 3);
}

describe("Quick Actions", () => {
  describe("getQuickActions", () => {
    it("should suggest generating new workflow for empty canvas", () => {
      const actions = getQuickActions(undefined, undefined);

      expect(actions).toHaveLength(1);
      expect(actions[0].label).toBe("Generate new workflow");
      expect(actions[0].icon).toBe("sparkles");
    });

    it("should suggest generating new workflow for canvas with no content", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [],
        edges: [],
        nodeCount: 0,
        hasContent: false,
      };

      const actions = getQuickActions(snapshot, undefined);

      expect(actions).toHaveLength(1);
      expect(actions[0].label).toBe("Generate new workflow");
    });

    it("should suggest post-processing for workflow with only generators", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [{ id: "gen_1", type: "generator:openai", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      const actions = getQuickActions(snapshot, undefined);

      expect(actions.some((a) => a.label === "Add post-processing")).toBe(true);
      expect(actions.some((a) => a.label === "Add save node")).toBe(true);
    });

    it("should not suggest post-processing if transforms exist", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [
          { id: "gen_1", type: "generator:openai", parameters: {} },
          { id: "transform_1", type: "transform:sharp:resize", parameters: {} },
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
      };

      const actions = getQuickActions(snapshot, undefined);

      expect(actions.some((a) => a.label === "Add post-processing")).toBe(false);
    });

    it("should suggest adding save node when missing", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [{ id: "gen_1", type: "generator:openai", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };

      const actions = getQuickActions(snapshot, undefined);

      expect(actions.some((a) => a.label === "Add save node")).toBe(true);
    });

    it("should not suggest save node when one exists", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [
          { id: "gen_1", type: "generator:openai", parameters: {} },
          { id: "save_1", type: "save:filesystem", parameters: {} },
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
      };

      const actions = getQuickActions(snapshot, undefined);

      expect(actions.some((a) => a.label === "Add save node")).toBe(false);
    });

    it("should suggest improving results after successful execution", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [{ id: "gen_1", type: "generator:openai", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };
      const context: ExecutionContext = {
        status: "completed",
        nodeCount: 1,
        outputs: [],
      };

      const actions = getQuickActions(snapshot, context);

      expect(actions.some((a) => a.label === "Improve results")).toBe(true);
    });

    it("should suggest fixing errors after failed execution", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [{ id: "gen_1", type: "generator:openai", parameters: {} }],
        edges: [],
        nodeCount: 1,
        hasContent: true,
      };
      const context: ExecutionContext = {
        status: "error",
        nodeCount: 1,
        outputs: [],
        error: "API rate limit exceeded",
      };

      const actions = getQuickActions(snapshot, context);

      expect(actions.some((a) => a.label === "Fix errors")).toBe(true);
      expect(actions.find((a) => a.label === "Fix errors")?.prompt).toContain(
        "API rate limit exceeded"
      );
    });

    it("should suggest adding variations for workflows with 2+ nodes", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [
          { id: "gen_1", type: "generator:openai", parameters: {} },
          { id: "save_1", type: "save:filesystem", parameters: {} },
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
      };

      const actions = getQuickActions(snapshot, undefined);

      expect(actions.some((a) => a.label === "Add variations")).toBe(true);
    });

    it("should limit to 3 actions maximum", () => {
      const snapshot: CanvasSnapshot = {
        nodes: [
          { id: "gen_1", type: "generator:openai", parameters: {} },
          { id: "gen_2", type: "generator:stability", parameters: {} },
        ],
        edges: [],
        nodeCount: 2,
        hasContent: true,
      };
      const context: ExecutionContext = {
        status: "completed",
        nodeCount: 2,
        outputs: [],
      };

      const actions = getQuickActions(snapshot, context);

      // Multiple suggestions possible but capped at 3
      expect(actions.length).toBeLessThanOrEqual(3);
    });
  });
});
