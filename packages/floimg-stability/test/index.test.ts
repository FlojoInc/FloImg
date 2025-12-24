import { describe, it, expect, vi, beforeEach } from "vitest";
import stability, { stabilitySchema } from "../src/index.js";

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
});
