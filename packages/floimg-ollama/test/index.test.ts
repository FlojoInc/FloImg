import { describe, it, expect, vi, beforeEach } from "vitest";
import ollama, {
  ollamaVision,
  ollamaText,
  ollamaVisionSchema,
  ollamaTextSchema,
} from "../src/index.js";

// Mock Ollama client - Vitest 4 requires function syntax for constructor mocks
vi.mock("ollama", () => {
  const MockOllama = vi.fn(function () {
    return {
      chat: vi.fn().mockResolvedValue({
        message: { content: "Test response from Ollama" },
      }),
    };
  });
  return { Ollama: MockOllama };
});

describe("floimg-ollama", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("ollamaVisionSchema", () => {
    it("should have correct name and description", () => {
      expect(ollamaVisionSchema.name).toBe("ollama-vision");
      expect(ollamaVisionSchema.description).toContain("Ollama");
      expect(ollamaVisionSchema.description).toContain("LLaVA");
    });

    it("should define parameters", () => {
      expect(ollamaVisionSchema.parameters.prompt).toBeDefined();
      expect(ollamaVisionSchema.parameters.outputFormat).toBeDefined();
    });

    it("should have default prompt value", () => {
      expect(ollamaVisionSchema.parameters.prompt.default).toBe("Describe this image in detail.");
    });
  });

  describe("ollamaTextSchema", () => {
    it("should have correct name and description", () => {
      expect(ollamaTextSchema.name).toBe("ollama-text");
      expect(ollamaTextSchema.description).toContain("Ollama");
      expect(ollamaTextSchema.description).toContain("Llama");
    });

    it("should define required parameters", () => {
      expect(ollamaTextSchema.parameters.prompt).toBeDefined();
      expect(ollamaTextSchema.requiredParameters).toContain("prompt");
    });

    it("should define optional parameters", () => {
      expect(ollamaTextSchema.parameters.systemPrompt).toBeDefined();
      expect(ollamaTextSchema.parameters.context).toBeDefined();
      expect(ollamaTextSchema.parameters.outputFormat).toBeDefined();
      expect(ollamaTextSchema.parameters.temperature).toBeDefined();
    });
  });

  describe("ollamaVision provider", () => {
    it("should create provider with default config", () => {
      const provider = ollamaVision();

      expect(provider.name).toBe("ollama-vision");
      expect(provider.schema).toBe(ollamaVisionSchema);
      expect(typeof provider.analyze).toBe("function");
    });

    it("should create provider with custom config", () => {
      const provider = ollamaVision({
        baseUrl: "http://custom:11434",
        model: "llava:13b",
      });

      expect(provider.name).toBe("ollama-vision");
    });

    it("should analyze image", async () => {
      const provider = ollamaVision();
      const testBlob = {
        bytes: Buffer.from("test-image"),
        mime: "image/png" as const,
        width: 100,
        height: 100,
        source: "test",
      };

      const result = await provider.analyze(testBlob, {
        prompt: "What is in this image?",
      });

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response from Ollama");
      expect(result.source).toContain("ai:ollama-vision");
      expect(result.metadata?.localExecution).toBe(true);
    });

    it("should use default prompt when not provided", async () => {
      const provider = ollamaVision();
      const testBlob = {
        bytes: Buffer.from("test"),
        mime: "image/png" as const,
        width: 100,
        height: 100,
        source: "test",
      };

      const result = await provider.analyze(testBlob, {});

      expect(result.metadata?.prompt).toBe("Describe this image in detail.");
    });
  });

  describe("ollamaText provider", () => {
    it("should create provider with default config", () => {
      const provider = ollamaText();

      expect(provider.name).toBe("ollama-text");
      expect(provider.schema).toBe(ollamaTextSchema);
      expect(typeof provider.generate).toBe("function");
    });

    it("should create provider with custom config", () => {
      const provider = ollamaText({
        baseUrl: "http://custom:11434",
        model: "mistral",
      });

      expect(provider.name).toBe("ollama-text");
    });

    it("should require prompt for generation", async () => {
      const provider = ollamaText();

      await expect(provider.generate({})).rejects.toThrow("prompt is required");
    });

    it("should generate text", async () => {
      const provider = ollamaText();

      const result = await provider.generate({
        prompt: "Write a short poem",
      });

      expect(result.type).toBe("text");
      expect(result.content).toBe("Test response from Ollama");
      expect(result.source).toContain("ai:ollama-text");
      expect(result.metadata?.localExecution).toBe(true);
    });

    it("should include context when provided", async () => {
      const provider = ollamaText();

      const result = await provider.generate({
        prompt: "Summarize this",
        context: "Previous analysis data",
      });

      expect(result.type).toBe("text");
    });
  });

  describe("ollama default export", () => {
    it("should return both vision and text providers", () => {
      const providers = ollama();

      expect(providers).toHaveLength(2);
      expect(providers[0].name).toBe("ollama-vision");
      expect(providers[1].name).toBe("ollama-text");
    });

    it("should accept shared config", () => {
      const providers = ollama({
        baseUrl: "http://custom:11434",
        visionModel: "llava:34b",
        textModel: "mistral",
      });

      expect(providers).toHaveLength(2);
    });
  });
});
