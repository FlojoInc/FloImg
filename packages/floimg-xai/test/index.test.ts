import { describe, it, expect, vi, beforeEach } from "vitest";
import { grokText, grokVision, grokTextSchema, grokVisionSchema } from "../src/index.js";

// Mock OpenAI client (xAI uses OpenAI-compatible API)
vi.mock("openai", () => {
  const MockOpenAI = vi.fn(function () {
    return {
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

describe("floimg-xai", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("grokText provider", () => {
    it("should export schema with correct structure", () => {
      expect(grokTextSchema.name).toBe("grok-text");
      expect(grokTextSchema.description).toContain("Grok");
      expect(grokTextSchema.requiresApiKey).toBe(true);
      expect(grokTextSchema.parameters.prompt).toBeDefined();
      expect(grokTextSchema.parameters.outputFormat).toBeDefined();
      expect(grokTextSchema.parameters.temperature).toBeDefined();
    });

    it("should create provider with API key", () => {
      const provider = grokText({ apiKey: "test-key" });

      expect(provider.name).toBe("grok-text");
      expect(provider.schema).toBe(grokTextSchema);
      expect(typeof provider.generate).toBe("function");
    });

    it("should require prompt for generation", async () => {
      const provider = grokText({ apiKey: "test-key" });

      await expect(provider.generate({})).rejects.toThrow("prompt is required");
    });

    it("should throw error without API key", async () => {
      const originalEnv = process.env.XAI_API_KEY;
      delete process.env.XAI_API_KEY;

      const provider = grokText();
      await expect(provider.generate({ prompt: "test" })).rejects.toThrow(
        "xAI API key is required"
      );

      process.env.XAI_API_KEY = originalEnv;
    });

    it("should generate text response", async () => {
      const provider = grokText({ apiKey: "test-key" });
      const result = await provider.generate({ prompt: "Hello" });

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response");
      expect(result.source).toContain("grok-text");
    });

    it("should handle context parameter", async () => {
      const provider = grokText({ apiKey: "test-key" });
      const result = await provider.generate({
        prompt: "Analyze this",
        context: "Previous analysis results",
      });

      expect(result.type).toBe("text");
    });

    it("should support JSON output format", async () => {
      const provider = grokText({ apiKey: "test-key" });
      const result = await provider.generate({
        prompt: "Generate JSON",
        outputFormat: "json",
      });

      // Content is not valid JSON in mock, so type should be text
      expect(result.type).toBe("text");
    });
  });

  describe("grokVision provider", () => {
    it("should export schema with correct structure", () => {
      expect(grokVisionSchema.name).toBe("grok-vision");
      expect(grokVisionSchema.description).toContain("Grok");
      expect(grokVisionSchema.requiresApiKey).toBe(true);
      expect(grokVisionSchema.inputType).toBe("image");
      expect(grokVisionSchema.outputType).toBe("data");
      expect(grokVisionSchema.parameters.prompt).toBeDefined();
      expect(grokVisionSchema.parameters.outputFormat).toBeDefined();
    });

    it("should create provider with API key", () => {
      const provider = grokVision({ apiKey: "test-key" });

      expect(provider.name).toBe("grok-vision");
      expect(provider.schema).toBe(grokVisionSchema);
      expect(typeof provider.analyze).toBe("function");
    });

    it("should throw error without API key", async () => {
      const originalEnv = process.env.XAI_API_KEY;
      delete process.env.XAI_API_KEY;

      const provider = grokVision();
      const mockImage = {
        bytes: Buffer.from("fake-image"),
        mime: "image/png" as const,
      };

      await expect(provider.analyze(mockImage, {})).rejects.toThrow("xAI API key is required");

      process.env.XAI_API_KEY = originalEnv;
    });

    it("should analyze image with default prompt", async () => {
      const provider = grokVision({ apiKey: "test-key" });
      const mockImage = {
        bytes: Buffer.from("fake-image"),
        mime: "image/png" as const,
      };

      const result = await provider.analyze(mockImage, {});

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response");
      expect(result.source).toContain("grok-vision");
    });

    it("should analyze image with custom prompt", async () => {
      const provider = grokVision({ apiKey: "test-key" });
      const mockImage = {
        bytes: Buffer.from("fake-image"),
        mime: "image/jpeg" as const,
      };

      const result = await provider.analyze(mockImage, {
        prompt: "What objects are in this image?",
      });

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response");
    });
  });

  describe("config options", () => {
    it("grokText should accept model config", () => {
      const provider = grokText({
        apiKey: "test-key",
        model: "grok-3-beta",
        maxTokens: 500,
        temperature: 0.5,
      });

      expect(provider.name).toBe("grok-text");
    });

    it("grokVision should accept model config", () => {
      const provider = grokVision({
        apiKey: "test-key",
        model: "grok-2-vision-1212",
        maxTokens: 2000,
      });

      expect(provider.name).toBe("grok-vision");
    });
  });
});
