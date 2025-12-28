import { describe, it, expect } from "vitest";
import { fromYaml, fromPipeline, validateYaml, type ImportError } from "../src/floimg/importer.js";

describe("YAML Importer", () => {
  describe("fromYaml", () => {
    it("should parse a simple generate step", () => {
      const yaml = `
name: Simple Chart
steps:
  - kind: generate
    generator: quickchart
    params:
      type: bar
      data:
        labels: [Q1, Q2, Q3, Q4]
        datasets:
          - label: Revenue
            data: [12, 19, 8, 15]
    out: v0
`;
      const result = fromYaml(yaml);

      expect(result.name).toBe("Simple Chart");
      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe("generator");
      expect(result.nodes[0].data.generatorName).toBe("quickchart");
      expect(result.nodes[0].data.params.type).toBe("bar");
      expect(result.edges).toHaveLength(0);
    });

    it("should parse a generate + transform pipeline", () => {
      const yaml = `
name: Chart with Resize
steps:
  - kind: generate
    generator: quickchart
    params:
      type: bar
    out: v0
  - kind: transform
    op: resize
    in: v0
    params:
      width: 800
    out: v1
`;
      const result = fromYaml(yaml);

      expect(result.name).toBe("Chart with Resize");
      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[0].type).toBe("generator");
      expect(result.nodes[1].type).toBe("transform");
      expect(result.nodes[1].data.operation).toBe("resize");
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].source).toBe(result.nodes[0].id);
      expect(result.edges[0].target).toBe(result.nodes[1].id);
    });

    it("should parse a save step", () => {
      const yaml = `
steps:
  - kind: generate
    generator: quickchart
    params:
      type: pie
    out: v0
  - kind: save
    in: v0
    destination: ./output/chart.png
`;
      const result = fromYaml(yaml);

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1].type).toBe("save");
      expect(result.nodes[1].data.destination).toBe("./output/chart.png");
    });

    it("should parse a vision step", () => {
      const yaml = `
steps:
  - kind: generate
    generator: quickchart
    params:
      type: bar
    out: v0
  - kind: vision
    provider: openai
    in: v0
    params:
      prompt: Describe this chart
    out: v1
`;
      const result = fromYaml(yaml);

      expect(result.nodes).toHaveLength(2);
      expect(result.nodes[1].type).toBe("vision");
      expect(result.nodes[1].data.providerName).toBe("openai");
      expect(result.nodes[1].data.params.prompt).toBe("Describe this chart");
    });

    it("should parse a text step", () => {
      const yaml = `
steps:
  - kind: text
    provider: openai
    params:
      prompt: Generate a creative description
    out: v0
`;
      const result = fromYaml(yaml);

      expect(result.nodes).toHaveLength(1);
      expect(result.nodes[0].type).toBe("text");
      expect(result.nodes[0].data.providerName).toBe("openai");
    });

    it("should throw error for invalid YAML syntax", () => {
      const yaml = `
name: Bad YAML
steps
  - kind: generate
`;
      expect(() => fromYaml(yaml)).toThrow();
      try {
        fromYaml(yaml);
      } catch (e) {
        const error = e as ImportError;
        expect(error.message).toContain("Invalid YAML");
      }
    });

    it("should throw error for missing steps array", () => {
      const yaml = `
name: Missing Steps
`;
      expect(() => fromYaml(yaml)).toThrow("Pipeline must have a 'steps' array");
    });

    it("should throw error for empty steps array", () => {
      const yaml = `
name: Empty Steps
steps: []
`;
      expect(() => fromYaml(yaml)).toThrow("Pipeline must have at least one step");
    });

    it("should throw error for unknown step kind", () => {
      const yaml = `
steps:
  - kind: unknown
    out: v0
`;
      expect(() => fromYaml(yaml)).toThrow("Unknown step kind: unknown");
    });
  });

  describe("fromPipeline", () => {
    it("should position nodes in columns based on dependencies", () => {
      const pipeline = {
        name: "Multi-step",
        steps: [
          { kind: "generate" as const, generator: "quickchart", params: {}, out: "v0" },
          { kind: "transform" as const, op: "resize", in: "v0", params: {}, out: "v1" },
          { kind: "transform" as const, op: "crop", in: "v1", params: {}, out: "v2" },
        ],
      };

      const result = fromPipeline(pipeline);

      // First node at column 0
      expect(result.nodes[0].position.x).toBe(100);
      // Second node at column 1 (depends on first)
      expect(result.nodes[1].position.x).toBe(100 + 280 + 100);
      // Third node at column 2 (depends on second)
      expect(result.nodes[2].position.x).toBe(100 + 2 * (280 + 100));
    });

    it("should handle parallel branches", () => {
      const pipeline = {
        steps: [
          { kind: "generate" as const, generator: "quickchart", params: {}, out: "v0" },
          { kind: "transform" as const, op: "resize", in: "v0", params: {}, out: "v1" },
          { kind: "transform" as const, op: "crop", in: "v0", params: {}, out: "v2" },
        ],
      };

      const result = fromPipeline(pipeline);

      // Both transforms depend on v0, so both should be in column 1
      expect(result.nodes[1].position.x).toBe(result.nodes[2].position.x);
      // But they should be in different rows
      expect(result.nodes[1].position.y).not.toBe(result.nodes[2].position.y);
    });

    it("should generate unique node IDs", () => {
      const pipeline = {
        steps: [
          { kind: "generate" as const, generator: "test1", params: {}, out: "v0" },
          { kind: "generate" as const, generator: "test2", params: {}, out: "v1" },
        ],
      };

      const result = fromPipeline(pipeline);

      expect(result.nodes[0].id).not.toBe(result.nodes[1].id);
    });
  });

  describe("validateYaml", () => {
    it("should return empty array for valid YAML", () => {
      const yaml = `
steps:
  - kind: generate
    generator: quickchart
    params:
      type: bar
    out: v0
`;
      const errors = validateYaml(yaml);
      expect(errors).toHaveLength(0);
    });

    it("should return errors for invalid YAML", () => {
      const yaml = `
steps
  - kind: generate
`;
      const errors = validateYaml(yaml);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Invalid YAML");
    });

    it("should return error for missing steps", () => {
      const yaml = `
name: No Steps
`;
      const errors = validateYaml(yaml);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("steps");
    });

    it("should return error for unknown kind", () => {
      const yaml = `
steps:
  - kind: foobar
    out: v0
`;
      const errors = validateYaml(yaml);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].message).toContain("Unknown step kind");
    });
  });

  describe("complex workflows", () => {
    it("should handle a complete AI image workflow", () => {
      const yaml = `
name: AI Image Workflow
steps:
  - kind: generate
    generator: dalle
    params:
      prompt: A beautiful sunset
      size: 1024x1024
    out: v0
  - kind: transform
    op: resize
    in: v0
    params:
      width: 800
      height: 600
    out: v1
  - kind: vision
    provider: openai
    in: v1
    params:
      prompt: Describe this image
    out: v2
  - kind: save
    in: v1
    destination: ./output/sunset.png
    provider: filesystem
`;
      const result = fromYaml(yaml);

      expect(result.name).toBe("AI Image Workflow");
      expect(result.nodes).toHaveLength(4);
      expect(result.nodes.map((n) => n.type)).toEqual(["generator", "transform", "vision", "save"]);
      expect(result.edges).toHaveLength(3);
    });
  });
});
