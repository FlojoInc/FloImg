import { describe, it, expect, vi, beforeEach } from "vitest";
import { openaiTransform, editSchema, variationsSchema } from "../src/index.js";
import type { ImageBlob } from "@teamflojo/floimg";

// Mock functions that we can reconfigure per test
const mockEdit = vi.fn();
const mockCreateVariation = vi.fn();

// Mock the openai module with a class (Vitest 4 requirement for constructors)
vi.mock("openai", () => {
  return {
    default: class MockOpenAI {
      images = {
        edit: mockEdit,
        createVariation: mockCreateVariation,
      };
    },
    toFile: vi.fn().mockImplementation(async (data: Buffer, name: string) => ({
      name,
      data,
    })),
  };
});

// Mock fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("floimg-openai transforms", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const testBlob: ImageBlob = {
    bytes: Buffer.from("test-image"),
    mime: "image/png",
    width: 512,
    height: 512,
    source: "test",
  };

  describe("schemas", () => {
    it("should export edit schema", () => {
      expect(editSchema.name).toBe("edit");
      expect(editSchema.isAI).toBe(true);
      expect(editSchema.inputType).toBe("image");
      expect(editSchema.outputType).toBe("image");
      expect(editSchema.requiredParameters).toContain("prompt");
    });

    it("should export variations schema", () => {
      expect(variationsSchema.name).toBe("variations");
      expect(variationsSchema.isAI).toBe(true);
      expect(variationsSchema.inputType).toBe("image");
      expect(variationsSchema.outputType).toBe("image");
      expect(variationsSchema.requiredParameters).toEqual([]);
    });

    it("should have proper parameter definitions for edit", () => {
      expect(editSchema.parameters.prompt).toBeDefined();
      expect(editSchema.parameters.mask).toBeDefined();
      expect(editSchema.parameters.size).toBeDefined();
      expect(editSchema.parameters.n).toBeDefined();
    });

    it("should have proper parameter definitions for variations", () => {
      expect(variationsSchema.parameters.size).toBeDefined();
      expect(variationsSchema.parameters.n).toBeDefined();
    });
  });

  describe("provider creation", () => {
    it("should throw error without API key", () => {
      const originalEnv = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;

      expect(() => openaiTransform()).toThrow("OpenAI API key is required");

      process.env.OPENAI_API_KEY = originalEnv;
    });

    it("should create transform provider with API key", () => {
      const provider = openaiTransform({ apiKey: "test-key" });

      expect(provider.name).toBe("openai-transform");
      expect(typeof provider.transform).toBe("function");
      expect(provider.operationSchemas).toHaveProperty("edit");
      expect(provider.operationSchemas).toHaveProperty("variations");
    });
  });

  describe("edit operation", () => {
    it("should require prompt for edit", async () => {
      const provider = openaiTransform({ apiKey: "test-key" });

      await expect(provider.transform(testBlob, "edit", {})).rejects.toThrow("prompt is required");
    });

    it("should call OpenAI edit API with correct parameters", async () => {
      // Setup mock to return a URL
      mockEdit.mockResolvedValue({
        data: [{ url: "https://example.com/edited-image.png" }],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = openaiTransform({ apiKey: "test-key" });
      const result = await provider.transform(testBlob, "edit", {
        prompt: "Add a sunset background",
        size: "512x512",
      });

      expect(result.source).toBe("ai:openai:edit");
      expect(result.metadata?.operation).toBe("edit");
      expect(result.metadata?.prompt).toBe("Add a sunset background");
    });
  });

  describe("variations operation", () => {
    it("should call OpenAI variations API", async () => {
      mockCreateVariation.mockResolvedValue({
        data: [{ url: "https://example.com/variation.png" }],
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = openaiTransform({ apiKey: "test-key" });
      const result = await provider.transform(testBlob, "variations", {
        size: "1024x1024",
      });

      expect(result.source).toBe("ai:openai:variations");
      expect(result.metadata?.operation).toBe("variations");
    });
  });

  describe("error handling", () => {
    it("should throw for unknown operation", async () => {
      const provider = openaiTransform({ apiKey: "test-key" });

      await expect(provider.transform(testBlob, "unknownOp", {})).rejects.toThrow(
        "Unknown operation: unknownOp"
      );
    });

    it("should throw for unsupported convert operation", async () => {
      const provider = openaiTransform({ apiKey: "test-key" });

      await expect(provider.convert(testBlob, "image/jpeg")).rejects.toThrow(
        "does not support format conversion"
      );
    });
  });
});
