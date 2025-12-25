import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  replicateTransform,
  faceRestoreSchema,
  colorizeSchema,
  realEsrganSchema,
  fluxEditSchema,
} from "../src/index.js";
import type { ImageBlob } from "@teamflojo/floimg";

// Mock the replicate module
vi.mock("replicate", () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      run: vi.fn(),
    })),
  };
});

// Mock fetch for downloading results
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("floimg-replicate", () => {
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
    describe("faceRestore schema", () => {
      it("should have correct name and metadata", () => {
        expect(faceRestoreSchema.name).toBe("faceRestore");
        expect(faceRestoreSchema.description).toContain("GFPGAN");
        expect(faceRestoreSchema.isAI).toBe(true);
        expect(faceRestoreSchema.inputType).toBe("image");
        expect(faceRestoreSchema.outputType).toBe("image");
      });

      it("should have version and scale parameters", () => {
        expect(faceRestoreSchema.parameters.version).toBeDefined();
        expect(faceRestoreSchema.parameters.scale).toBeDefined();
      });
    });

    describe("colorize schema", () => {
      it("should have correct name and metadata", () => {
        expect(colorizeSchema.name).toBe("colorize");
        expect(colorizeSchema.description).toContain("DeOldify");
        expect(colorizeSchema.isAI).toBe(true);
      });

      it("should have renderFactor and artistic parameters", () => {
        expect(colorizeSchema.parameters.renderFactor).toBeDefined();
        expect(colorizeSchema.parameters.artistic).toBeDefined();
      });
    });

    describe("realEsrgan schema", () => {
      it("should have correct name and metadata", () => {
        expect(realEsrganSchema.name).toBe("realEsrgan");
        expect(realEsrganSchema.description).toContain("Real-ESRGAN");
        expect(realEsrganSchema.isAI).toBe(true);
      });

      it("should have scale and faceEnhance parameters", () => {
        expect(realEsrganSchema.parameters.scale).toBeDefined();
        expect(realEsrganSchema.parameters.faceEnhance).toBeDefined();
      });
    });

    describe("fluxEdit schema", () => {
      it("should have correct name and metadata", () => {
        expect(fluxEditSchema.name).toBe("fluxEdit");
        expect(fluxEditSchema.description).toContain("FLUX");
        expect(fluxEditSchema.isAI).toBe(true);
      });

      it("should require prompt", () => {
        expect(fluxEditSchema.requiredParameters).toContain("prompt");
      });

      it("should have generation parameters", () => {
        expect(fluxEditSchema.parameters.prompt).toBeDefined();
        expect(fluxEditSchema.parameters.aspectRatio).toBeDefined();
        expect(fluxEditSchema.parameters.guidanceScale).toBeDefined();
        expect(fluxEditSchema.parameters.numInferenceSteps).toBeDefined();
      });
    });
  });

  describe("provider creation", () => {
    it("should throw error without API token", () => {
      const originalEnv = process.env.REPLICATE_API_TOKEN;
      delete process.env.REPLICATE_API_TOKEN;

      expect(() => replicateTransform()).toThrow("Replicate API token is required");

      process.env.REPLICATE_API_TOKEN = originalEnv;
    });

    it("should create transform provider with API token", () => {
      const provider = replicateTransform({ apiToken: "test-token" });

      expect(provider.name).toBe("replicate-transform");
      expect(typeof provider.transform).toBe("function");
      expect(provider.operationSchemas).toHaveProperty("faceRestore");
      expect(provider.operationSchemas).toHaveProperty("colorize");
      expect(provider.operationSchemas).toHaveProperty("realEsrgan");
      expect(provider.operationSchemas).toHaveProperty("fluxEdit");
    });
  });

  describe("faceRestore operation", () => {
    it("should restore faces using GFPGAN", async () => {
      const mockRun = vi.fn().mockResolvedValue("https://example.com/restored.png");

      const Replicate = await import("replicate");
      (Replicate.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        run: mockRun,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = replicateTransform({ apiToken: "test-token" });
      const result = await provider.transform(testBlob, "faceRestore", {
        scale: 2,
      });

      expect(result.source).toBe("ai:replicate:faceRestore");
      expect(result.metadata?.operation).toBe("faceRestore");
      expect(result.metadata?.model).toBe("tencentarc/gfpgan");
    });
  });

  describe("colorize operation", () => {
    it("should colorize B&W images", async () => {
      const mockRun = vi.fn().mockResolvedValue("https://example.com/colorized.png");

      const Replicate = await import("replicate");
      (Replicate.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        run: mockRun,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = replicateTransform({ apiToken: "test-token" });
      const result = await provider.transform(testBlob, "colorize", {
        renderFactor: 35,
      });

      expect(result.source).toBe("ai:replicate:colorize");
      expect(result.metadata?.operation).toBe("colorize");
    });

    it("should support artistic mode", async () => {
      const mockRun = vi.fn().mockResolvedValue("https://example.com/artistic.png");

      const Replicate = await import("replicate");
      (Replicate.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        run: mockRun,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = replicateTransform({ apiToken: "test-token" });
      const result = await provider.transform(testBlob, "colorize", {
        artistic: true,
      });

      expect(result.metadata?.artistic).toBe(true);
    });
  });

  describe("realEsrgan operation", () => {
    it("should upscale images", async () => {
      const mockRun = vi.fn().mockResolvedValue("https://example.com/upscaled.png");

      const Replicate = await import("replicate");
      (Replicate.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        run: mockRun,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = replicateTransform({ apiToken: "test-token" });
      const result = await provider.transform(testBlob, "realEsrgan", {
        scale: 4,
      });

      expect(result.source).toBe("ai:replicate:realEsrgan");
      expect(result.width).toBe(2048); // 512 * 4
      expect(result.height).toBe(2048);
    });
  });

  describe("fluxEdit operation", () => {
    it("should require prompt", async () => {
      const provider = replicateTransform({ apiToken: "test-token" });

      await expect(provider.transform(testBlob, "fluxEdit", {})).rejects.toThrow(
        "prompt is required"
      );
    });

    it("should edit images with text prompt", async () => {
      const mockRun = vi.fn().mockResolvedValue("https://example.com/edited.webp");

      const Replicate = await import("replicate");
      (Replicate.default as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => ({
        run: mockRun,
      }));

      mockFetch.mockResolvedValueOnce({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      });

      const provider = replicateTransform({ apiToken: "test-token" });
      const result = await provider.transform(testBlob, "fluxEdit", {
        prompt: "Make the sky more dramatic",
      });

      expect(result.source).toBe("ai:replicate:fluxEdit");
      expect(result.metadata?.prompt).toBe("Make the sky more dramatic");
    });
  });

  describe("error handling", () => {
    it("should throw for unknown operation", async () => {
      const provider = replicateTransform({ apiToken: "test-token" });

      await expect(provider.transform(testBlob, "unknownOp", {})).rejects.toThrow(
        "Unknown operation: unknownOp"
      );
    });

    it("should throw for unsupported convert operation", async () => {
      const provider = replicateTransform({ apiToken: "test-token" });

      await expect(provider.convert(testBlob, "image/jpeg")).rejects.toThrow(
        "does not support format conversion"
      );
    });
  });
});
