/**
 * Interface Consistency Tests for nodesToPipeline()
 *
 * These tests verify that the visual editor workflow format (nodes + edges)
 * correctly converts to the canonical Pipeline format used by the SDK.
 *
 * Key invariants:
 * - Generator nodes → { kind: "generate", generator, params, out }
 * - Transform nodes → { kind: "transform", op, in, params, out, provider? }
 * - Save nodes → { kind: "save", in, destination, provider? }
 * - Vision nodes → { kind: "vision", provider, in, params, out }
 * - Text nodes → { kind: "text", provider, in?, params, out }
 * - Node IDs are used as variable names (out field)
 * - Edge connections set the "in" field correctly
 */

import { describe, it, expect } from "vitest";
import {
  nodesToPipeline,
  StudioNode,
  StudioEdge,
  GeneratorNodeData,
  TransformNodeData,
  SaveNodeData,
  VisionNodeData,
  TextNodeData,
  FanOutNodeData,
  CollectNodeData,
  RouterNodeData,
} from "../src/index.js";

describe("nodesToPipeline", () => {
  describe("generator nodes", () => {
    it("converts a generator node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: {
            generatorName: "dalle-3",
            params: { prompt: "A sunset over mountains" },
          } as GeneratorNodeData,
        },
      ];
      const edges: StudioEdge[] = [];

      const { pipeline, nodeToVar } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps).toHaveLength(1);
      expect(pipeline.steps[0]).toEqual({
        kind: "generate",
        generator: "dalle-3",
        params: { prompt: "A sunset over mountains" },
        out: "gen_1",
      });
      expect(nodeToVar.get("gen_1")).toBe("gen_1");
    });

    it("uses node ID as variable name", () => {
      const nodes: StudioNode[] = [
        {
          id: "my-custom-node-id",
          type: "generator",
          position: { x: 0, y: 0 },
          data: {
            generatorName: "quickchart",
            params: { type: "bar" },
          } as GeneratorNodeData,
        },
      ];

      const { pipeline, nodeToVar } = nodesToPipeline(nodes, []);

      expect(pipeline.steps[0].out).toBe("my-custom-node-id");
      expect(nodeToVar.get("my-custom-node-id")).toBe("my-custom-node-id");
    });
  });

  describe("transform nodes", () => {
    it("converts a transform node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "transform_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: {
            operation: "resize",
            params: { width: 800, height: 600 },
          } as TransformNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "gen_1", target: "transform_1" }];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps).toHaveLength(2);
      expect(pipeline.steps[1]).toEqual({
        kind: "transform",
        op: "resize",
        in: "gen_1",
        params: { width: 800, height: 600 },
        out: "transform_1",
      });
    });

    it("includes provider when specified", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "transform_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: {
            operation: "edit",
            providerName: "gemini-transform",
            params: { prompt: "Add a frame" },
          } as TransformNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "gen_1", target: "transform_1" }];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toMatchObject({
        kind: "transform",
        op: "edit",
        provider: "gemini-transform",
      });
    });

    it("throws error when transform has no input connection", () => {
      const nodes: StudioNode[] = [
        {
          id: "transform_1",
          type: "transform",
          position: { x: 0, y: 0 },
          data: { operation: "resize", params: {} } as TransformNodeData,
        },
      ];

      expect(() => nodesToPipeline(nodes, [])).toThrow(
        "Transform node requires an input image connection"
      );
    });
  });

  describe("save nodes", () => {
    it("converts a save node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "save_1",
          type: "save",
          position: { x: 200, y: 0 },
          data: {
            destination: "output/image.png",
            provider: "filesystem",
          } as SaveNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "gen_1", target: "save_1" }];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toEqual({
        kind: "save",
        in: "gen_1",
        destination: "output/image.png",
        provider: "filesystem",
      });
    });

    it("throws error when save has no input connection", () => {
      const nodes: StudioNode[] = [
        {
          id: "save_1",
          type: "save",
          position: { x: 0, y: 0 },
          data: { destination: "output.png" } as SaveNodeData,
        },
      ];

      expect(() => nodesToPipeline(nodes, [])).toThrow("Save node requires an input connection");
    });
  });

  describe("vision nodes", () => {
    it("converts a vision node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "dalle-3", params: {} } as GeneratorNodeData,
        },
        {
          id: "vision_1",
          type: "vision",
          position: { x: 200, y: 0 },
          data: {
            providerName: "gemini-vision",
            params: { prompt: "Describe this image" },
          } as VisionNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "gen_1", target: "vision_1" }];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toEqual({
        kind: "vision",
        provider: "gemini-vision",
        in: "gen_1",
        params: { prompt: "Describe this image" },
        out: "vision_1",
      });
    });

    it("throws error when vision has no input connection", () => {
      const nodes: StudioNode[] = [
        {
          id: "vision_1",
          type: "vision",
          position: { x: 0, y: 0 },
          data: { providerName: "gemini-vision", params: {} } as VisionNodeData,
        },
      ];

      expect(() => nodesToPipeline(nodes, [])).toThrow(
        "Vision node requires an input image connection"
      );
    });
  });

  describe("text nodes", () => {
    it("converts a text node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "text_1",
          type: "text",
          position: { x: 0, y: 0 },
          data: {
            providerName: "gemini-text",
            params: { prompt: "Generate a product description" },
          } as TextNodeData,
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, []);

      expect(pipeline.steps[0]).toEqual({
        kind: "text",
        provider: "gemini-text",
        in: undefined,
        params: { prompt: "Generate a product description" },
        out: "text_1",
      });
    });

    it("includes input when connected", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "text_1",
          type: "text",
          position: { x: 200, y: 0 },
          data: {
            providerName: "gemini-text",
            params: { prompt: "Describe the pattern" },
          } as TextNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "gen_1", target: "text_1" }];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toMatchObject({
        kind: "text",
        in: "gen_1",
      });
    });
  });

  describe("input nodes", () => {
    it("skips input nodes (data injected via initialVariables)", () => {
      const nodes: StudioNode[] = [
        {
          id: "input_1",
          type: "input",
          position: { x: 0, y: 0 },
          data: { uploadId: "upload-123" },
        },
        {
          id: "transform_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: { operation: "resize", params: { width: 100 } } as TransformNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "input_1", target: "transform_1" }];

      const { pipeline, nodeToVar } = nodesToPipeline(nodes, edges);

      // Input node should not create a pipeline step
      expect(pipeline.steps).toHaveLength(1);
      expect(pipeline.steps[0].kind).toBe("transform");
      // But it should still be in the nodeToVar map
      expect(nodeToVar.get("input_1")).toBe("input_1");
      // Transform should reference the input
      expect((pipeline.steps[0] as { in: string }).in).toBe("input_1");
    });
  });

  describe("topological ordering", () => {
    it("orders steps by dependency", () => {
      const nodes: StudioNode[] = [
        {
          id: "save_1",
          type: "save",
          position: { x: 400, y: 0 },
          data: { destination: "out.png" } as SaveNodeData,
        },
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "transform_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: { operation: "resize", params: {} } as TransformNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        { id: "e1", source: "gen_1", target: "transform_1" },
        { id: "e2", source: "transform_1", target: "save_1" },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      // Despite save being first in array, it should be last in output
      expect(pipeline.steps[0].kind).toBe("generate");
      expect(pipeline.steps[1].kind).toBe("transform");
      expect(pipeline.steps[2].kind).toBe("save");
    });
  });

  describe("complex workflows", () => {
    it("handles a complete workflow with multiple branches", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: {
            generatorName: "dalle-3",
            params: { prompt: "A landscape" },
          } as GeneratorNodeData,
        },
        {
          id: "resize_1",
          type: "transform",
          position: { x: 200, y: -50 },
          data: {
            operation: "resize",
            params: { width: 800 },
          } as TransformNodeData,
        },
        {
          id: "format_1",
          type: "transform",
          position: { x: 200, y: 50 },
          data: {
            operation: "format",
            params: { to: "webp" },
          } as TransformNodeData,
        },
        {
          id: "save_web",
          type: "save",
          position: { x: 400, y: -50 },
          data: { destination: "web.jpg" } as SaveNodeData,
        },
        {
          id: "save_mobile",
          type: "save",
          position: { x: 400, y: 50 },
          data: { destination: "mobile.webp" } as SaveNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        { id: "e1", source: "gen_1", target: "resize_1" },
        { id: "e2", source: "gen_1", target: "format_1" },
        { id: "e3", source: "resize_1", target: "save_web" },
        { id: "e4", source: "format_1", target: "save_mobile" },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps).toHaveLength(5);
      // Generator should be first
      expect(pipeline.steps[0]).toMatchObject({
        kind: "generate",
        out: "gen_1",
      });
      // Both transforms depend only on generator
      const transformSteps = pipeline.steps.filter((s) => s.kind === "transform");
      expect(transformSteps).toHaveLength(2);
      transformSteps.forEach((t) => {
        expect((t as { in: string }).in).toBe("gen_1");
      });
    });
  });

  describe("fan-out nodes", () => {
    it("converts a fan-out node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "text_1",
          type: "text",
          position: { x: 0, y: 0 },
          data: {
            providerName: "gemini-text",
            params: { prompt: "Generate 3 prompts" },
          } as TextNodeData,
        },
        {
          id: "fanout_1",
          type: "fanout",
          position: { x: 200, y: 0 },
          data: {
            mode: "array",
            count: 3,
            arrayProperty: "prompts",
          } as FanOutNodeData,
        },
      ];
      const edges: StudioEdge[] = [{ id: "e1", source: "text_1", target: "fanout_1" }];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toEqual({
        kind: "fan-out",
        in: "text_1",
        mode: "array",
        count: 3,
        arrayProperty: "prompts",
        out: ["fanout_1_0", "fanout_1_1", "fanout_1_2"],
      });
    });
  });

  describe("collect nodes", () => {
    it("converts a collect node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: -50 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "gen_2",
          type: "generator",
          position: { x: 0, y: 50 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "collect_1",
          type: "collect",
          position: { x: 200, y: 0 },
          data: {
            expectedInputs: 2,
            waitMode: "all",
          } as CollectNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        { id: "e1", source: "gen_1", target: "collect_1" },
        { id: "e2", source: "gen_2", target: "collect_1" },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[2]).toEqual({
        kind: "collect",
        in: ["gen_1", "gen_2"],
        waitMode: "all",
        out: "collect_1",
      });
    });
  });

  describe("router nodes", () => {
    it("converts a router node to canonical format", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: -200, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
        {
          id: "collect_1",
          type: "collect",
          position: { x: 0, y: 0 },
          data: { expectedInputs: 1, waitMode: "all" } as CollectNodeData,
        },
        {
          id: "vision_1",
          type: "vision",
          position: { x: 0, y: 100 },
          data: { providerName: "gemini-vision", params: {} } as VisionNodeData,
        },
        {
          id: "router_1",
          type: "router",
          position: { x: 200, y: 0 },
          data: {
            selectionProperty: "winner",
            selectionType: "index",
            outputCount: 1,
          } as RouterNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        // Generator feeds into collect
        { id: "e0", source: "gen_1", target: "collect_1" },
        // Collect feeds into vision (for image analysis)
        { id: "e1a", source: "collect_1", target: "vision_1" },
        // Collect feeds into router as candidates
        {
          id: "e1",
          source: "collect_1",
          target: "router_1",
          targetHandle: "candidates",
        },
        // Vision feeds into router for selection
        {
          id: "e2",
          source: "vision_1",
          target: "router_1",
          targetHandle: "selection",
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      // Router should be after collect and vision (it depends on both)
      const routerStep = pipeline.steps.find((s) => s.kind === "router");
      expect(routerStep).toEqual({
        kind: "router",
        in: "collect_1",
        selectionIn: "vision_1",
        selectionType: "index",
        selectionProperty: "winner",
        out: "router_1",
      });
    });
  });

  describe("pipeline metadata", () => {
    it("sets pipeline name to 'Studio Workflow'", () => {
      const nodes: StudioNode[] = [
        {
          id: "gen_1",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "qr", params: {} } as GeneratorNodeData,
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, []);

      expect(pipeline.name).toBe("Studio Workflow");
    });
  });

  describe("text input routing", () => {
    it("routes text input to generator via _promptFromVar", () => {
      const nodes: StudioNode[] = [
        {
          id: "text_1",
          type: "text",
          position: { x: 0, y: 0 },
          data: {
            providerName: "gemini-text",
            params: { prompt: "Generate a prompt" },
          } as TextNodeData,
        },
        {
          id: "gen_1",
          type: "generator",
          position: { x: 200, y: 0 },
          data: { generatorName: "dalle-3", params: {} } as GeneratorNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        { id: "e1", source: "text_1", target: "gen_1", targetHandle: "text" },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toMatchObject({
        kind: "generate",
        params: { _promptFromVar: "text_1" },
      });
    });

    it("routes specific output property via _promptFromProperty", () => {
      const nodes: StudioNode[] = [
        {
          id: "text_1",
          type: "text",
          position: { x: 0, y: 0 },
          data: {
            providerName: "gemini-text",
            params: { prompt: "Generate data" },
          } as TextNodeData,
        },
        {
          id: "gen_1",
          type: "generator",
          position: { x: 200, y: 0 },
          data: { generatorName: "dalle-3", params: {} } as GeneratorNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        {
          id: "e1",
          source: "text_1",
          target: "gen_1",
          sourceHandle: "output.imagePrompt",
          targetHandle: "text",
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[1]).toMatchObject({
        kind: "generate",
        params: {
          _promptFromVar: "text_1",
          _promptFromProperty: "imagePrompt",
        },
      });
    });
  });

  describe("reference images", () => {
    it("routes reference images via _referenceImageVars", () => {
      const nodes: StudioNode[] = [
        {
          id: "input_1",
          type: "input",
          position: { x: 0, y: -50 },
          data: { uploadId: "ref-123" },
        },
        {
          id: "input_2",
          type: "input",
          position: { x: 0, y: 50 },
          data: { uploadId: "ref-456" },
        },
        {
          id: "gen_1",
          type: "generator",
          position: { x: 200, y: 0 },
          data: {
            generatorName: "gpt-image-1",
            params: { prompt: "Combine these images" },
          } as GeneratorNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        {
          id: "e1",
          source: "input_1",
          target: "gen_1",
          targetHandle: "references",
        },
        {
          id: "e2",
          source: "input_2",
          target: "gen_1",
          targetHandle: "references",
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps[0]).toMatchObject({
        kind: "generate",
        params: {
          prompt: "Combine these images",
          _referenceImageVars: ["input_1", "input_2"],
        },
      });
    });
  });

  describe("composite transforms", () => {
    it("accepts 'base' targetHandle for composite base image", () => {
      const nodes: StudioNode[] = [
        {
          id: "base",
          type: "generator",
          position: { x: 0, y: 0 },
          data: {
            generatorName: "shapes",
            params: { shapeType: "rectangle", width: 800 },
          } as GeneratorNodeData,
        },
        {
          id: "composite_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: {
            operation: "composite",
            providerName: "sharp",
            params: { overlays: [{ left: 0, top: 0 }] },
          } as TransformNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        {
          id: "e1",
          source: "base",
          target: "composite_1",
          targetHandle: "base",
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      expect(pipeline.steps).toHaveLength(2);
      expect(pipeline.steps[1]).toMatchObject({
        kind: "transform",
        op: "composite",
        in: "base",
      });
    });

    it("collects overlay images via _overlayImageVars", () => {
      const nodes: StudioNode[] = [
        {
          id: "base",
          type: "generator",
          position: { x: 0, y: 0 },
          data: {
            generatorName: "shapes",
            params: { shapeType: "rectangle" },
          } as GeneratorNodeData,
        },
        {
          id: "overlay_1",
          type: "generator",
          position: { x: 0, y: 100 },
          data: {
            generatorName: "dalle-3",
            params: { prompt: "Logo" },
          } as GeneratorNodeData,
        },
        {
          id: "overlay_2",
          type: "generator",
          position: { x: 0, y: 200 },
          data: {
            generatorName: "dalle-3",
            params: { prompt: "Text" },
          } as GeneratorNodeData,
        },
        {
          id: "composite_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: {
            operation: "composite",
            providerName: "sharp",
            params: {
              overlays: [
                { left: 100, top: 100 },
                { left: 500, top: 100 },
              ],
            },
          } as TransformNodeData,
        },
      ];
      const edges: StudioEdge[] = [
        {
          id: "e1",
          source: "base",
          target: "composite_1",
          targetHandle: "base",
        },
        {
          id: "e2",
          source: "overlay_1",
          target: "composite_1",
          targetHandle: "overlays[0]",
        },
        {
          id: "e3",
          source: "overlay_2",
          target: "composite_1",
          targetHandle: "overlays[1]",
        },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      // Composite step should have base as input and overlay vars with indices
      const compositeStep = pipeline.steps.find(
        (s) => s.kind === "transform" && s.op === "composite"
      );
      expect(compositeStep).toBeDefined();
      expect(compositeStep).toMatchObject({
        kind: "transform",
        op: "composite",
        in: "base",
        params: {
          overlays: [
            { left: 100, top: 100 },
            { left: 500, top: 100 },
          ],
          _overlayImageVars: [
            { varName: "overlay_1", index: 0 },
            { varName: "overlay_2", index: 1 },
          ],
        },
      });
    });

    it("sorts overlay vars by index", () => {
      const nodes: StudioNode[] = [
        {
          id: "base",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "shapes", params: {} } as GeneratorNodeData,
        },
        {
          id: "overlay_a",
          type: "generator",
          position: { x: 0, y: 100 },
          data: { generatorName: "dalle-3", params: { prompt: "A" } } as GeneratorNodeData,
        },
        {
          id: "overlay_b",
          type: "generator",
          position: { x: 0, y: 200 },
          data: { generatorName: "dalle-3", params: { prompt: "B" } } as GeneratorNodeData,
        },
        {
          id: "composite_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: {
            operation: "composite",
            providerName: "sharp",
            params: {
              overlays: [
                { left: 0, top: 0 },
                { left: 100, top: 0 },
              ],
            },
          } as TransformNodeData,
        },
      ];
      // Edges in reverse order to test sorting
      const edges: StudioEdge[] = [
        { id: "e1", source: "base", target: "composite_1", targetHandle: "base" },
        { id: "e3", source: "overlay_b", target: "composite_1", targetHandle: "overlays[1]" },
        { id: "e2", source: "overlay_a", target: "composite_1", targetHandle: "overlays[0]" },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      const compositeStep = pipeline.steps.find(
        (s) => s.kind === "transform" && s.op === "composite"
      );
      // Should be sorted by index, not by edge order, and include original indices
      expect(compositeStep?.params?._overlayImageVars).toEqual([
        { varName: "overlay_a", index: 0 },
        { varName: "overlay_b", index: 1 },
      ]);
    });

    it("preserves sparse overlay indices", () => {
      const nodes: StudioNode[] = [
        {
          id: "base",
          type: "generator",
          position: { x: 0, y: 0 },
          data: { generatorName: "shapes", params: {} } as GeneratorNodeData,
        },
        {
          id: "overlay_at_2",
          type: "generator",
          position: { x: 0, y: 100 },
          data: { generatorName: "dalle-3", params: { prompt: "At index 2" } } as GeneratorNodeData,
        },
        {
          id: "overlay_at_5",
          type: "generator",
          position: { x: 0, y: 200 },
          data: { generatorName: "dalle-3", params: { prompt: "At index 5" } } as GeneratorNodeData,
        },
        {
          id: "composite_1",
          type: "transform",
          position: { x: 200, y: 0 },
          data: {
            operation: "composite",
            providerName: "sharp",
            params: { overlays: [] },
          } as TransformNodeData,
        },
      ];
      // Sparse indices [2, 5] - not contiguous
      const edges: StudioEdge[] = [
        { id: "e1", source: "base", target: "composite_1", targetHandle: "base" },
        { id: "e2", source: "overlay_at_2", target: "composite_1", targetHandle: "overlays[2]" },
        { id: "e3", source: "overlay_at_5", target: "composite_1", targetHandle: "overlays[5]" },
      ];

      const { pipeline } = nodesToPipeline(nodes, edges);

      const compositeStep = pipeline.steps.find(
        (s) => s.kind === "transform" && s.op === "composite"
      );
      // Should preserve original indices [2, 5], not map to [0, 1]
      expect(compositeStep?.params?._overlayImageVars).toEqual([
        { varName: "overlay_at_2", index: 2 },
        { varName: "overlay_at_5", index: 5 },
      ]);
    });
  });
});
