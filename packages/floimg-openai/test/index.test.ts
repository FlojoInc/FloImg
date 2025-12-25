import { describe, it, expect, vi, beforeEach } from "vitest";
import openai, {
  openaiVision,
  openaiText,
  openaiSchema,
  openaiVisionSchema,
  openaiTextSchema,
} from "../src/index.js";

// Mock OpenAI client - Vitest 4 requires function syntax for constructor mocks
vi.mock("openai", () => {
  const MockOpenAI = vi.fn(function () {
    return {
      images: {
        generate: vi.fn().mockResolvedValue({
          data: [
            {
              url: "https://example.com/image.png",
              revised_prompt: "A test image",
            },
          ],
        }),
      },
      chat: {
        completions: {
          create: vi.fn().mockResolvedValue({
            choices: [{ message: { content: "Test response" } }],
            usage: { prompt_tokens: 10, completion_tokens: 20 },
          }),
        },
      },
    };
  });
  return { default: MockOpenAI };
});

// Mock fetch for image download
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  arrayBuffer: () => Promise.resolve(new ArrayBuffer(100)),
});

describe("floimg-openai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("openai generator", () => {
    it("should export schema with correct structure", () => {
      expect(openaiSchema.name).toBe("openai");
      expect(openaiSchema.description).toContain("DALL-E");
      expect(openaiSchema.isAI).toBe(true);
      expect(openaiSchema.requiresApiKey).toBe(true);
      expect(openaiSchema.parameters.prompt).toBeDefined();
      expect(openaiSchema.parameters.model).toBeDefined();
      expect(openaiSchema.parameters.size).toBeDefined();
    });

    it("should throw error without API key", () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => openai()).toThrow("OpenAI API key is required");

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it("should create generator with API key", () => {
      const generator = openai({ apiKey: "test-key" });

      expect(generator.name).toBe("openai");
      expect(generator.schema).toBe(openaiSchema);
      expect(typeof generator.generate).toBe("function");
    });

    it("should require prompt for generation", async () => {
      const generator = openai({ apiKey: "test-key" });

      await expect(generator.generate({})).rejects.toThrow("prompt is required");
    });

    it("should generate image with valid params", async () => {
      const generator = openai({ apiKey: "test-key" });

      const result = await generator.generate({
        prompt: "A test image",
        size: "1024x1024",
      });

      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.mime).toBe("image/png");
      expect(result.width).toBe(1024);
      expect(result.height).toBe(1024);
      expect(result.source).toContain("ai:openai");
    });

    it("should reject invalid size for DALL-E 3", async () => {
      const generator = openai({ apiKey: "test-key" });

      await expect(
        generator.generate({
          prompt: "Test",
          model: "dall-e-3",
          size: "512x512",
        })
      ).rejects.toThrow("DALL-E 3 only supports sizes");
    });

    it("should reject n > 1 for DALL-E 3", async () => {
      const generator = openai({ apiKey: "test-key" });

      await expect(
        generator.generate({
          prompt: "Test",
          model: "dall-e-3",
          n: 2,
        })
      ).rejects.toThrow("DALL-E 3 only supports generating 1 image");
    });
  });

  describe("openaiVision provider", () => {
    it("should export schema with correct structure", () => {
      expect(openaiVisionSchema.name).toBe("openai-vision");
      expect(openaiVisionSchema.description).toContain("GPT-4 Vision");
      expect(openaiVisionSchema.parameters.prompt).toBeDefined();
      expect(openaiVisionSchema.parameters.outputFormat).toBeDefined();
    });

    it("should throw error without API key", () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => openaiVision()).toThrow("OpenAI API key is required");

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it("should create vision provider with API key", () => {
      const provider = openaiVision({ apiKey: "test-key" });

      expect(provider.name).toBe("openai-vision");
      expect(provider.schema).toBe(openaiVisionSchema);
      expect(typeof provider.analyze).toBe("function");
    });

    it("should analyze image", async () => {
      const provider = openaiVision({ apiKey: "test-key" });
      const testBlob = {
        bytes: Buffer.from("test"),
        mime: "image/png" as const,
        width: 100,
        height: 100,
        source: "test",
      };

      const result = await provider.analyze(testBlob, { prompt: "Describe this" });

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response");
      expect(result.source).toContain("ai:openai-vision");
    });
  });

  describe("openaiText provider", () => {
    it("should export schema with correct structure", () => {
      expect(openaiTextSchema.name).toBe("openai-text");
      expect(openaiTextSchema.description).toContain("GPT");
      expect(openaiTextSchema.parameters.prompt).toBeDefined();
      expect(openaiTextSchema.requiredParameters).toContain("prompt");
    });

    it("should throw error without API key", () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => openaiText()).toThrow("OpenAI API key is required");

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it("should create text provider with API key", () => {
      const provider = openaiText({ apiKey: "test-key" });

      expect(provider.name).toBe("openai-text");
      expect(provider.schema).toBe(openaiTextSchema);
      expect(typeof provider.generate).toBe("function");
    });

    it("should require prompt for generation", async () => {
      const provider = openaiText({ apiKey: "test-key" });

      await expect(provider.generate({})).rejects.toThrow("prompt is required");
    });

    it("should generate text", async () => {
      const provider = openaiText({ apiKey: "test-key" });

      const result = await provider.generate({ prompt: "Hello" });

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response");
      expect(result.source).toContain("ai:openai-text");
    });
  });
});
