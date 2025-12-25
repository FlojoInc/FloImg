import { describe, it, expect, vi, beforeEach } from "vitest";
import stability, {
  stabilitySchema,
  stabilityTransform,
  removeBackgroundSchema,
  upscaleSchema,
  searchAndReplaceSchema,
  outpaintSchema,
} from "../src/index.js";
import type { ImageBlob } from "@teamflojo/floimg";

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("floimg-stability", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("stability generator schema", () => {
    it("should have correct name and description", () => {
      expect(stabilitySchema.name).toBe("stability");
      expect(stabilitySchema.description).toContain("Stability AI");
      expect(stabilitySchema.description).toContain("SDXL");
    });

    it("should have AI metadata", () => {
      expect(stabilitySchema.isAI).toBe(true);
      expect(stabilitySchema.requiresApiKey).toBe(true);
      expect(stabilitySchema.apiKeyEnvVar).toBe("STABILITY_API_KEY");
    });

    it("should define required parameters", () => {
      expect(stabilitySchema.parameters.prompt).toBeDefined();
      expect(stabilitySchema.requiredParameters).toContain("prompt");
    });

    it("should define optional parameters", () => {
      expect(stabilitySchema.parameters.negativePrompt).toBeDefined();
      expect(stabilitySchema.parameters.model).toBeDefined();
      expect(stabilitySchema.parameters.size).toBeDefined();
      expect(stabilitySchema.parameters.stylePreset).toBeDefined();
      expect(stabilitySchema.parameters.cfgScale).toBeDefined();
      expect(stabilitySchema.parameters.steps).toBeDefined();
      expect(stabilitySchema.parameters.seed).toBeDefined();
    });
  });

  describe("stability generator", () => {
    it("should throw error without API key", () => {
      const originalEnv = process.env.STABILITY_API_KEY;
      delete process.env.STABILITY_API_KEY;

      expect(() => stability()).toThrow("Stability API key is required");

      process.env.STABILITY_API_KEY = originalEnv;
    });

    it("should create generator with API key", () => {
      const generator = stability({ apiKey: "test-key" });

      expect(generator.name).toBe("stability");
      expect(generator.schema).toBe(stabilitySchema);
      expect(typeof generator.generate).toBe("function");
    });

    it("should require prompt for generation", async () => {
      const generator = stability({ apiKey: "test-key" });

      await expect(generator.generate({})).rejects.toThrow("prompt is required");
    });

    it("should generate image with valid params", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            artifacts: [
              {
                base64: Buffer.from("test-image").toString("base64"),
                finishReason: "SUCCESS",
                seed: 12345,
              },
            ],
          }),
      });

      const generator = stability({ apiKey: "test-key" });

      const result = await generator.generate({
        prompt: "A mountain landscape",
        size: "1024x1024",
      });

      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.mime).toBe("image/png");
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
      expect(result.source).toContain("ai:stability");
      expect(result.metadata?.seed).toBe(12345);
    });

    it("should throw error on content filter", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            artifacts: [
              {
                base64: "",
                finishReason: "CONTENT_FILTERED",
                seed: 0,
              },
            ],
          }),
      });

      const generator = stability({ apiKey: "test-key" });

      await expect(generator.generate({ prompt: "test" })).rejects.toThrow(
        "content policy violation"
      );
    });

    it("should throw error on API error", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () =>
          Promise.resolve({
            message: "Invalid API key",
          }),
      });

      const generator = stability({ apiKey: "bad-key" });

      await expect(generator.generate({ prompt: "test" })).rejects.toThrow("Stability AI error");
    });

    it("should pass style preset when provided", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            artifacts: [
              {
                base64: Buffer.from("test").toString("base64"),
                finishReason: "SUCCESS",
                seed: 1,
              },
            ],
          }),
      });

      const generator = stability({ apiKey: "test-key" });

      await generator.generate({
        prompt: "test",
        stylePreset: "photographic",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining("photographic"),
        })
      );
    });
  });

  describe("stability transform provider", () => {
    const testBlob: ImageBlob = {
      bytes: Buffer.from("test-image"),
      mime: "image/png",
      width: 512,
      height: 512,
      source: "test",
    };

    describe("schemas", () => {
      it("should export removeBackground schema", () => {
        expect(removeBackgroundSchema.name).toBe("removeBackground");
        expect(removeBackgroundSchema.isAI).toBe(true);
        expect(removeBackgroundSchema.inputType).toBe("image");
        expect(removeBackgroundSchema.outputType).toBe("image");
      });

      it("should export upscale schema", () => {
        expect(upscaleSchema.name).toBe("upscale");
        expect(upscaleSchema.isAI).toBe(true);
        expect(upscaleSchema.parameters.creativity).toBeDefined();
      });

      it("should export searchAndReplace schema", () => {
        expect(searchAndReplaceSchema.name).toBe("searchAndReplace");
        expect(searchAndReplaceSchema.requiredParameters).toContain("prompt");
        expect(searchAndReplaceSchema.requiredParameters).toContain("searchPrompt");
      });

      it("should export outpaint schema", () => {
        expect(outpaintSchema.name).toBe("outpaint");
        expect(outpaintSchema.parameters.left).toBeDefined();
        expect(outpaintSchema.parameters.right).toBeDefined();
        expect(outpaintSchema.parameters.up).toBeDefined();
        expect(outpaintSchema.parameters.down).toBeDefined();
      });
    });

    describe("provider creation", () => {
      it("should throw error without API key", () => {
        const originalEnv = process.env.STABILITY_API_KEY;
        delete process.env.STABILITY_API_KEY;

        expect(() => stabilityTransform()).toThrow("Stability API key is required");

        process.env.STABILITY_API_KEY = originalEnv;
      });

      it("should create transform provider with API key", () => {
        const provider = stabilityTransform({ apiKey: "test-key" });

        expect(provider.name).toBe("stability-transform");
        expect(typeof provider.transform).toBe("function");
        expect(provider.operationSchemas).toHaveProperty("removeBackground");
        expect(provider.operationSchemas).toHaveProperty("upscale");
        expect(provider.operationSchemas).toHaveProperty("searchAndReplace");
        expect(provider.operationSchemas).toHaveProperty("outpaint");
      });
    });

    describe("removeBackground", () => {
      it("should remove background from image", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: Buffer.from("result-image").toString("base64"),
              finish_reason: "SUCCESS",
              seed: 12345,
            }),
        });

        const provider = stabilityTransform({ apiKey: "test-key" });
        const result = await provider.transform(testBlob, "removeBackground", {});

        expect(result.bytes).toBeInstanceOf(Buffer);
        expect(result.mime).toBe("image/png");
        expect(result.source).toContain("removeBackground");
        expect(result.metadata?.operation).toBe("removeBackground");
      });

      it("should throw on content filter", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: "",
              finish_reason: "CONTENT_FILTERED",
              seed: 0,
            }),
        });

        const provider = stabilityTransform({ apiKey: "test-key" });

        await expect(provider.transform(testBlob, "removeBackground", {})).rejects.toThrow(
          "content policy violation"
        );
      });
    });

    describe("upscale", () => {
      it("should upscale image", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: Buffer.from("upscaled-image").toString("base64"),
              finish_reason: "SUCCESS",
              seed: 12345,
            }),
        });

        const provider = stabilityTransform({ apiKey: "test-key" });
        const result = await provider.transform(testBlob, "upscale", {
          prompt: "high quality",
          creativity: 0.2,
        });

        expect(result.bytes).toBeInstanceOf(Buffer);
        expect(result.source).toContain("upscale");
        expect(result.width).toBe(2048); // 4x upscale
        expect(result.height).toBe(2048);
      });
    });

    describe("searchAndReplace", () => {
      it("should search and replace objects", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: Buffer.from("replaced-image").toString("base64"),
              finish_reason: "SUCCESS",
              seed: 12345,
            }),
        });

        const provider = stabilityTransform({ apiKey: "test-key" });
        const result = await provider.transform(testBlob, "searchAndReplace", {
          prompt: "a golden retriever",
          searchPrompt: "the dog",
        });

        expect(result.bytes).toBeInstanceOf(Buffer);
        expect(result.source).toContain("searchAndReplace");
        expect(result.metadata?.prompt).toBe("a golden retriever");
        expect(result.metadata?.searchPrompt).toBe("the dog");
      });

      it("should require both prompt and searchPrompt", async () => {
        const provider = stabilityTransform({ apiKey: "test-key" });

        await expect(
          provider.transform(testBlob, "searchAndReplace", { prompt: "test" })
        ).rejects.toThrow("searchPrompt are required");

        await expect(
          provider.transform(testBlob, "searchAndReplace", { searchPrompt: "test" })
        ).rejects.toThrow("searchPrompt are required");
      });
    });

    describe("outpaint", () => {
      it("should outpaint image", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({
              image: Buffer.from("outpainted-image").toString("base64"),
              finish_reason: "SUCCESS",
              seed: 12345,
            }),
        });

        const provider = stabilityTransform({ apiKey: "test-key" });
        const result = await provider.transform(testBlob, "outpaint", {
          prompt: "continue the landscape",
          left: 100,
          right: 100,
        });

        expect(result.bytes).toBeInstanceOf(Buffer);
        expect(result.source).toContain("outpaint");
        expect(result.width).toBe(712); // 512 + 100 + 100
        expect(result.height).toBe(512);
      });

      it("should require prompt for outpaint", async () => {
        const provider = stabilityTransform({ apiKey: "test-key" });

        await expect(provider.transform(testBlob, "outpaint", {})).rejects.toThrow(
          "prompt is required"
        );
      });
    });

    describe("error handling", () => {
      it("should throw for unknown operation", async () => {
        const provider = stabilityTransform({ apiKey: "test-key" });

        await expect(provider.transform(testBlob, "unknownOp", {})).rejects.toThrow(
          "Unknown operation: unknownOp"
        );
      });

      it("should throw for unsupported convert operation", async () => {
        const provider = stabilityTransform({ apiKey: "test-key" });

        await expect(provider.convert(testBlob, "image/jpeg")).rejects.toThrow(
          "does not support format conversion"
        );
      });

      it("should throw on API error", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          json: () =>
            Promise.resolve({
              message: "Rate limit exceeded",
            }),
        });

        const provider = stabilityTransform({ apiKey: "test-key" });

        await expect(provider.transform(testBlob, "removeBackground", {})).rejects.toThrow(
          "Stability AI error: Rate limit exceeded"
        );
      });
    });
  });
});
