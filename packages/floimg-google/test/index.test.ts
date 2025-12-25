import { describe, it, expect, vi, beforeEach } from "vitest";
import googleImagen, { googleImagenSchema } from "../src/index.js";

// Mock GoogleGenAI - Vitest 4 requires function syntax for constructor mocks
vi.mock("@google/genai", () => {
  const MockGoogleGenAI = vi.fn(function () {
    return {
      models: {
        generateImages: vi.fn().mockResolvedValue({
          generatedImages: [
            {
              image: {
                imageBytes: Buffer.from("test-image").toString("base64"),
              },
            },
          ],
        }),
      },
    };
  });
  return { GoogleGenAI: MockGoogleGenAI };
});

describe("floimg-google", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("googleImagenSchema", () => {
    it("should have correct name and description", () => {
      expect(googleImagenSchema.name).toBe("google-imagen");
      expect(googleImagenSchema.description).toContain("Google");
      expect(googleImagenSchema.description).toContain("Imagen");
    });

    it("should have AI metadata", () => {
      expect(googleImagenSchema.isAI).toBe(true);
      expect(googleImagenSchema.requiresApiKey).toBe(true);
      expect(googleImagenSchema.apiKeyEnvVar).toBe("GOOGLE_AI_API_KEY");
    });

    it("should define required parameters", () => {
      expect(googleImagenSchema.parameters.prompt).toBeDefined();
      expect(googleImagenSchema.requiredParameters).toContain("prompt");
    });

    it("should define optional parameters", () => {
      expect(googleImagenSchema.parameters.model).toBeDefined();
      expect(googleImagenSchema.parameters.aspectRatio).toBeDefined();
      expect(googleImagenSchema.parameters.numberOfImages).toBeDefined();
    });

    it("should have valid model options", () => {
      const modelParam = googleImagenSchema.parameters.model;
      expect(modelParam.enum).toContain("imagen-4.0-generate-001");
      expect(modelParam.enum).toContain("imagen-4.0-fast-generate-001");
    });

    it("should have valid aspect ratio options", () => {
      const aspectParam = googleImagenSchema.parameters.aspectRatio;
      expect(aspectParam.enum).toContain("1:1");
      expect(aspectParam.enum).toContain("16:9");
      expect(aspectParam.enum).toContain("9:16");
    });
  });

  describe("googleImagen generator", () => {
    it("should throw error without API key", () => {
      const originalEnv = process.env.GOOGLE_AI_API_KEY;
      delete process.env.GOOGLE_AI_API_KEY;

      expect(() => googleImagen()).toThrow("Google AI API key is required");

      process.env.GOOGLE_AI_API_KEY = originalEnv;
    });

    it("should create generator with API key", () => {
      const generator = googleImagen({ apiKey: "test-key" });

      expect(generator.name).toBe("google-imagen");
      expect(generator.schema).toBe(googleImagenSchema);
      expect(typeof generator.generate).toBe("function");
    });

    it("should require prompt for generation", async () => {
      const generator = googleImagen({ apiKey: "test-key" });

      await expect(generator.generate({})).rejects.toThrow("prompt is required");
    });

    it("should validate numberOfImages range", async () => {
      const generator = googleImagen({ apiKey: "test-key" });

      await expect(generator.generate({ prompt: "test", numberOfImages: 5 })).rejects.toThrow(
        "numberOfImages must be between 1 and 4"
      );

      await expect(generator.generate({ prompt: "test", numberOfImages: 0 })).rejects.toThrow(
        "numberOfImages must be between 1 and 4"
      );
    });

    it("should generate image with valid params", async () => {
      const generator = googleImagen({ apiKey: "test-key" });

      const result = await generator.generate({
        prompt: "A beautiful sunset",
        aspectRatio: "16:9",
      });

      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.mime).toBe("image/png");
      expect(result.width).toBe(1024);
      expect(result.height).toBe(576);
      expect(result.source).toContain("ai:google-imagen");
      expect(result.metadata?.aspectRatio).toBe("16:9");
    });

    it("should use default aspect ratio 1:1", async () => {
      const generator = googleImagen({ apiKey: "test-key" });

      const result = await generator.generate({
        prompt: "A test image",
      });

      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
    });

    it("should handle different aspect ratios", async () => {
      const generator = googleImagen({ apiKey: "test-key" });

      // 3:4 portrait
      let result = await generator.generate({
        prompt: "test",
        aspectRatio: "3:4",
      });
      expect(result.width).toBe(768);
      expect(result.height).toBe(1024);

      // 4:3 landscape
      result = await generator.generate({
        prompt: "test",
        aspectRatio: "4:3",
      });
      expect(result.width).toBe(1024);
      expect(result.height).toBe(768);

      // 9:16 tall
      result = await generator.generate({
        prompt: "test",
        aspectRatio: "9:16",
      });
      expect(result.width).toBe(576);
      expect(result.height).toBe(1024);
    });
  });
});
