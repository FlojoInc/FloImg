/**
 * Tests for AI workflow generator validation
 *
 * Tests the semantic validation logic that ensures AI-generated workflows
 * have proper parameter bindings and edge connections.
 */

import { describe, it, expect } from "vitest";
import { generatedToStudioFormat } from "../src/ai/workflow-generator.js";
import { nodesToPipeline } from "@teamflojo/floimg-studio-shared";
import { validatePipelineFull } from "@teamflojo/floimg";
import type { GeneratedWorkflowData } from "@teamflojo/floimg-studio-shared";
import type { ClientCapabilities } from "@teamflojo/floimg";

// Minimal capabilities for testing validation
const testCapabilities: ClientCapabilities = {
  generators: ["gemini-generate", "dalle-3"],
  transforms: { sharp: ["resize", "blur", "rotate"] },
  textProviders: ["gemini-text"],
  visionProviders: ["gemini-vision"],
};

describe("generatedToStudioFormat conversion", () => {
  it("should correctly map generator nodeTypes", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "gen_1",
          nodeType: "generator:gemini-generate",
          parameters: { prompt: "test" },
        },
      ],
      edges: [],
    };

    const result = generatedToStudioFormat(workflow);

    expect(result.nodes[0].type).toBe("generator");
    expect((result.nodes[0].data as { generatorName: string }).generatorName).toBe(
      "gemini-generate"
    );
  });

  it("should correctly map transform nodeTypes", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "transform_1",
          nodeType: "transform:sharp:resize",
          parameters: { width: 800 },
        },
      ],
      edges: [],
    };

    const result = generatedToStudioFormat(workflow);

    expect(result.nodes[0].type).toBe("transform");
    expect((result.nodes[0].data as { operation: string }).operation).toBe("resize");
    expect((result.nodes[0].data as { providerName: string }).providerName).toBe("sharp");
  });

  it("should correctly map text nodeTypes", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "text_1",
          nodeType: "text:gemini-text",
          parameters: { prompt: "Generate a prompt" },
        },
      ],
      edges: [],
    };

    const result = generatedToStudioFormat(workflow);

    expect(result.nodes[0].type).toBe("text");
    expect((result.nodes[0].data as { providerName: string }).providerName).toBe("gemini-text");
  });

  it("should correctly map flow control nodeTypes", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "fanout_1",
          nodeType: "flow:fanout",
          parameters: { mode: "count", count: 3 },
        },
      ],
      edges: [],
    };

    const result = generatedToStudioFormat(workflow);

    expect(result.nodes[0].type).toBe("fanout");
    expect((result.nodes[0].data as { mode: string }).mode).toBe("count");
  });
});

describe("Pipeline validation integration", () => {
  // These tests verify the End-to-End Consistency principle:
  // The generator validates workflows in Pipeline format (what actually executes)
  // not just Studio format (visual editor representation)

  it("should detect missing prompt source in AI generators", () => {
    // An AI generator with no prompt and no _promptFromVar should fail
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "gen_1",
          nodeType: "generator:gemini-generate",
          parameters: { model: "gemini-2.5-flash" }, // No prompt!
        },
      ],
      edges: [],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.code === "MISSING_PROMPT_SOURCE")).toBe(true);
  });

  it("should pass AI generators with static prompt", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "gen_1",
          nodeType: "generator:gemini-generate",
          parameters: { prompt: "A beautiful sunset over mountains" },
        },
      ],
      edges: [],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    expect(validation.valid).toBe(true);
    expect(validation.errors.filter((e) => e.code === "MISSING_PROMPT_SOURCE")).toHaveLength(0);
  });

  it("should pass AI generators with prompt from text node", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "text_1",
          nodeType: "text:gemini-text",
          parameters: { prompt: "Generate a creative prompt" },
        },
        {
          id: "gen_1",
          nodeType: "generator:gemini-generate",
          parameters: { prompt: "" }, // Empty is OK when text edge exists
        },
      ],
      edges: [
        {
          source: "text_1",
          target: "gen_1",
          targetHandle: "text", // Text input connection
        },
      ],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    // Should pass because prompt comes from text node via _promptFromVar
    expect(validation.errors.filter((e) => e.code === "MISSING_PROMPT_SOURCE")).toHaveLength(0);
  });

  it("should detect missing arrayProperty in fan-out array mode", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "text_1",
          nodeType: "text:gemini-text",
          parameters: { prompt: "generate prompts" },
        },
        {
          id: "fanout_1",
          nodeType: "flow:fanout",
          parameters: {
            mode: "array",
            // Missing arrayProperty!
          },
        },
      ],
      edges: [{ source: "text_1", target: "fanout_1" }],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.code === "MISSING_ARRAY_PROPERTY")).toBe(true);
  });

  it("should pass fan-out in array mode with arrayProperty", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "text_1",
          nodeType: "text:gemini-text",
          parameters: { prompt: "generate prompts" },
        },
        {
          id: "fanout_1",
          nodeType: "flow:fanout",
          parameters: { mode: "array", arrayProperty: "prompts" },
        },
      ],
      edges: [{ source: "text_1", target: "fanout_1" }],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    expect(validation.errors.filter((e) => e.code === "MISSING_ARRAY_PROPERTY")).toHaveLength(0);
  });

  it("should pass fan-out in count mode without arrayProperty", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "gen_1",
          nodeType: "generator:gemini-generate",
          parameters: { prompt: "A cat" },
        },
        {
          id: "fanout_1",
          nodeType: "flow:fanout",
          parameters: { mode: "count", count: 3 },
        },
      ],
      edges: [{ source: "gen_1", target: "fanout_1" }],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    expect(validation.errors.filter((e) => e.code === "MISSING_ARRAY_PROPERTY")).toHaveLength(0);
  });
});

describe("suggestedFix in validation errors", () => {
  it("should include suggestedFix for MISSING_PROMPT_SOURCE errors", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "gen_1",
          nodeType: "generator:gemini-generate",
          parameters: {},
        },
      ],
      edges: [],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    const promptError = validation.errors.find((e) => e.code === "MISSING_PROMPT_SOURCE");
    expect(promptError).toBeDefined();
    expect(promptError?.suggestedFix).toBeDefined();
    expect(promptError?.suggestedFix).toContain("prompt");
  });

  it("should include suggestedFix for MISSING_ARRAY_PROPERTY errors", () => {
    const workflow: GeneratedWorkflowData = {
      nodes: [
        {
          id: "text_1",
          nodeType: "text:gemini-text",
          parameters: { prompt: "test" },
        },
        {
          id: "fanout_1",
          nodeType: "flow:fanout",
          parameters: { mode: "array" },
        },
      ],
      edges: [{ source: "text_1", target: "fanout_1" }],
    };

    const { nodes, edges } = generatedToStudioFormat(workflow);
    const { pipeline } = nodesToPipeline(nodes, edges);
    const validation = validatePipelineFull(pipeline, testCapabilities);

    const arrayError = validation.errors.find((e) => e.code === "MISSING_ARRAY_PROPERTY");
    expect(arrayError).toBeDefined();
    expect(arrayError?.suggestedFix).toBeDefined();
    expect(arrayError?.suggestedFix).toContain("arrayProperty");
  });
});
