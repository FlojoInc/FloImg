import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Pipeline, ImageBlob } from "@teamflojo/floimg";

// Create a mock run function that we can configure per test
const mockRun = vi.fn();

// Mock the floimg client
vi.mock("../src/floimg/setup.js", () => ({
  getClient: () => ({
    run: mockRun,
    registerSaveProvider: vi.fn(),
  }),
  clearCollectedUsageEvents: vi.fn(),
  getCollectedUsageEvents: vi.fn().mockReturnValue([]),
}));

// Mock fs operations
vi.mock("fs/promises", () => ({
  mkdir: vi.fn().mockResolvedValue(undefined),
  writeFile: vi.fn().mockResolvedValue(undefined),
}));

// Import after mocks are set up
import { executePipeline } from "../src/floimg/executor.js";

describe("executePipeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRun.mockReset();
  });

  describe("overlay injection for composite transforms", () => {
    it("should inject overlay blobs from previously executed steps", async () => {
      // Create mock image blobs
      const baseImageBlob: ImageBlob = {
        bytes: new Uint8Array([1, 2, 3]),
        mime: "image/png",
      };
      const overlayImageBlob: ImageBlob = {
        bytes: new Uint8Array([4, 5, 6]),
        mime: "image/png",
      };
      const compositeResultBlob: ImageBlob = {
        bytes: new Uint8Array([7, 8, 9]),
        mime: "image/png",
      };

      let callCount = 0;
      mockRun.mockImplementation(async (pipeline: Pipeline) => {
        callCount++;
        const step = pipeline.steps[0];

        // First call: base generator
        if (callCount === 1) {
          expect(step.kind).toBe("generate");
          return [{ out: "base", value: baseImageBlob }];
        }
        // Second call: overlay generator
        if (callCount === 2) {
          expect(step.kind).toBe("generate");
          return [{ out: "overlay_1", value: overlayImageBlob }];
        }
        // Third call: composite transform
        if (callCount === 3) {
          // Verify that overlays were injected with blobs
          expect(step.kind).toBe("transform");
          if (step.kind === "transform") {
            expect(step.params?.overlays).toBeDefined();
            expect(step.params?.overlays).toHaveLength(1);
            expect(step.params?.overlays[0].blob).toEqual(overlayImageBlob);
            // _overlayImageVars should have been deleted
            expect(step.params?._overlayImageVars).toBeUndefined();
          }
          return [{ out: "composite_1", value: compositeResultBlob }];
        }
        return [];
      });

      // Create a pipeline that mimics what nodesToPipeline produces for composite
      const pipeline: Pipeline = {
        name: "Composite Test",
        steps: [
          {
            kind: "generate",
            generator: "shapes",
            params: { shapeType: "rectangle" },
            out: "base",
          },
          {
            kind: "generate",
            generator: "dalle-3",
            params: { prompt: "Logo" },
            out: "overlay_1",
          },
          {
            kind: "transform",
            in: "base",
            provider: "sharp",
            operation: "composite",
            params: {
              overlays: [{ left: 100, top: 100 }],
              // This is what nodesToPipeline adds to tell executor which vars to inject
              _overlayImageVars: [{ varName: "overlay_1", index: 0 }],
            },
            out: "composite_1",
          },
        ],
      };

      await executePipeline(pipeline);

      // Verify all three steps were executed
      expect(mockRun).toHaveBeenCalledTimes(3);
    });

    it("should throw if overlay image is missing", async () => {
      const baseImageBlob: ImageBlob = {
        bytes: new Uint8Array([1, 2, 3]),
        mime: "image/png",
      };

      let callCount = 0;
      mockRun.mockImplementation(async () => {
        callCount++;
        // Only return base image, overlay step "fails" (returns nothing)
        if (callCount === 1) {
          return [{ out: "base", value: baseImageBlob }];
        }
        return []; // Overlay generator returns nothing
      });

      const pipeline: Pipeline = {
        name: "Missing Overlay Test",
        steps: [
          {
            kind: "generate",
            generator: "shapes",
            params: { shapeType: "rectangle" },
            out: "base",
          },
          {
            kind: "generate",
            generator: "dalle-3",
            params: { prompt: "Logo" },
            out: "overlay_1",
          },
          {
            kind: "transform",
            in: "base",
            provider: "sharp",
            operation: "composite",
            params: {
              overlays: [{ left: 100, top: 100 }],
              _overlayImageVars: [{ varName: "overlay_1", index: 0 }],
            },
            out: "composite_1",
          },
        ],
      };

      await expect(executePipeline(pipeline)).rejects.toThrow(
        "Composite transform missing overlay images: overlay_1 (index 0)"
      );
    });

    it("should handle multiple overlays at different indices", async () => {
      const baseBlob: ImageBlob = { bytes: new Uint8Array([1]), mime: "image/png" };
      const overlay0Blob: ImageBlob = { bytes: new Uint8Array([2]), mime: "image/png" };
      const overlay1Blob: ImageBlob = { bytes: new Uint8Array([3]), mime: "image/png" };
      const resultBlob: ImageBlob = { bytes: new Uint8Array([4]), mime: "image/png" };

      let callCount = 0;
      mockRun.mockImplementation(async (pipeline: Pipeline) => {
        callCount++;
        const step = pipeline.steps[0];

        if (callCount === 1) return [{ out: "base", value: baseBlob }];
        if (callCount === 2) return [{ out: "overlay_0", value: overlay0Blob }];
        if (callCount === 3) return [{ out: "overlay_1", value: overlay1Blob }];
        if (callCount === 4) {
          // Verify both overlays were injected
          if (step.kind === "transform") {
            expect(step.params?.overlays).toHaveLength(2);
            expect(step.params?.overlays[0].blob).toEqual(overlay0Blob);
            expect(step.params?.overlays[1].blob).toEqual(overlay1Blob);
          }
          return [{ out: "composite_1", value: resultBlob }];
        }
        return [];
      });

      const pipeline: Pipeline = {
        name: "Multi-Overlay Test",
        steps: [
          { kind: "generate", generator: "shapes", params: {}, out: "base" },
          { kind: "generate", generator: "dalle-3", params: { prompt: "A" }, out: "overlay_0" },
          { kind: "generate", generator: "dalle-3", params: { prompt: "B" }, out: "overlay_1" },
          {
            kind: "transform",
            in: "base",
            provider: "sharp",
            operation: "composite",
            params: {
              overlays: [
                { left: 0, top: 0 },
                { left: 100, top: 100 },
              ],
              _overlayImageVars: [
                { varName: "overlay_0", index: 0 },
                { varName: "overlay_1", index: 1 },
              ],
            },
            out: "composite_1",
          },
        ],
      };

      await executePipeline(pipeline);
      expect(mockRun).toHaveBeenCalledTimes(4);
    });
  });

  describe("MIME type preservation", () => {
    it("should preserve MIME type in result images map", async () => {
      const pngBlob: ImageBlob = { bytes: new Uint8Array([137, 80, 78, 71]), mime: "image/png" };

      mockRun.mockResolvedValue([{ out: "gen_1", value: pngBlob }]);

      const pipeline: Pipeline = {
        name: "MIME Test",
        steps: [{ kind: "generate", generator: "shapes", params: {}, out: "gen_1" }],
      };

      const result = await executePipeline(pipeline);

      // Result should include MIME type
      expect(result.images.size).toBe(1);
      const [imageId] = result.imageIds;
      const imageData = result.images.get(imageId);
      expect(imageData).toBeDefined();
      expect(imageData!.mime).toBe("image/png");
      expect(imageData!.buffer).toBeInstanceOf(Buffer);
    });

    it("should preserve different MIME types correctly", async () => {
      // Test SVG, JPEG, WebP in sequence
      const svgBlob: ImageBlob = {
        bytes: new Uint8Array([60, 115, 118, 103]),
        mime: "image/svg+xml",
      };
      const jpegBlob: ImageBlob = { bytes: new Uint8Array([255, 216, 255]), mime: "image/jpeg" };
      const webpBlob: ImageBlob = { bytes: new Uint8Array([82, 73, 70, 70]), mime: "image/webp" };

      let callCount = 0;
      mockRun.mockImplementation(async () => {
        callCount++;
        if (callCount === 1) return [{ out: "svg_1", value: svgBlob }];
        if (callCount === 2) return [{ out: "jpeg_1", value: jpegBlob }];
        if (callCount === 3) return [{ out: "webp_1", value: webpBlob }];
        return [];
      });

      const pipeline: Pipeline = {
        name: "Multi-MIME Test",
        steps: [
          { kind: "generate", generator: "mermaid", params: {}, out: "svg_1" },
          { kind: "generate", generator: "dalle-3", params: { prompt: "test" }, out: "jpeg_1" },
          { kind: "generate", generator: "shapes", params: {}, out: "webp_1" },
        ],
      };

      const result = await executePipeline(pipeline);

      expect(result.images.size).toBe(3);

      // Check each image has correct MIME
      const svgData = result.images.get(result.imageIds[0]);
      const jpegData = result.images.get(result.imageIds[1]);
      const webpData = result.images.get(result.imageIds[2]);

      expect(svgData?.mime).toBe("image/svg+xml");
      expect(jpegData?.mime).toBe("image/jpeg");
      expect(webpData?.mime).toBe("image/webp");
    });

    it("should default to image/png when MIME is undefined", async () => {
      // Blob with undefined mime (edge case - should fall back to PNG)
      const undefinedMimeBlob: ImageBlob = {
        bytes: new Uint8Array([1, 2, 3]),
        mime: undefined as unknown as string, // Force undefined for runtime test
      };

      mockRun.mockResolvedValue([{ out: "gen_1", value: undefinedMimeBlob }]);

      const pipeline: Pipeline = {
        name: "Undefined MIME Test",
        steps: [{ kind: "generate", generator: "shapes", params: {}, out: "gen_1" }],
      };

      const result = await executePipeline(pipeline);

      const [imageId] = result.imageIds;
      const imageData = result.images.get(imageId);
      expect(imageData?.mime).toBe("image/png");
    });
  });

  describe("reference image injection for transforms", () => {
    it("should inject reference images from previously executed steps", async () => {
      const sourceBlob: ImageBlob = { bytes: new Uint8Array([1]), mime: "image/png" };
      const refBlob: ImageBlob = { bytes: new Uint8Array([2]), mime: "image/png" };
      const resultBlob: ImageBlob = { bytes: new Uint8Array([3]), mime: "image/png" };

      let callCount = 0;
      mockRun.mockImplementation(async (pipeline: Pipeline) => {
        callCount++;
        const step = pipeline.steps[0];

        if (callCount === 1) return [{ out: "source", value: sourceBlob }];
        if (callCount === 2) return [{ out: "ref", value: refBlob }];
        if (callCount === 3) {
          // Verify reference image was injected
          if (step.kind === "transform") {
            expect(step.params?.referenceImages).toBeDefined();
            expect(step.params?.referenceImages).toHaveLength(1);
            expect(step.params?.referenceImages[0]).toEqual(refBlob);
            expect(step.params?._referenceImageVars).toBeUndefined();
          }
          return [{ out: "edited", value: resultBlob }];
        }
        return [];
      });

      const pipeline: Pipeline = {
        name: "Reference Image Test",
        steps: [
          { kind: "generate", generator: "shapes", params: {}, out: "source" },
          { kind: "generate", generator: "dalle-3", params: { prompt: "Mask" }, out: "ref" },
          {
            kind: "transform",
            in: "source",
            provider: "openai-transform",
            operation: "edit",
            params: {
              prompt: "Edit the image",
              _referenceImageVars: ["ref"],
            },
            out: "edited",
          },
        ],
      };

      await executePipeline(pipeline);
      expect(mockRun).toHaveBeenCalledTimes(3);
    });
  });
});
