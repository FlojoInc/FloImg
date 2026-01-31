import { describe, it, expect } from "vitest";
import { vectorizeTransform, vectorizeSchema } from "../src/index.js";

describe("vectorizeTransform", () => {
  it("should return a transform provider with correct name", () => {
    const provider = vectorizeTransform();
    expect(provider.name).toBe("vectorize");
  });

  it("should have vectorize operation schema", () => {
    const provider = vectorizeTransform();
    expect(provider.operationSchemas).toHaveProperty("vectorize");
  });

  it("should reject unknown operations", async () => {
    const provider = vectorizeTransform();
    const fakeImage = {
      bytes: Buffer.from([]),
      mime: "image/png" as const,
      width: 100,
      height: 100,
      source: "test",
    };

    await expect(provider.transform(fakeImage, "unknown", {})).rejects.toThrow(
      "Unknown operation: unknown"
    );
  });

  it("should reject convert calls", async () => {
    const provider = vectorizeTransform();
    const fakeImage = {
      bytes: Buffer.from([]),
      mime: "image/png" as const,
      width: 100,
      height: 100,
      source: "test",
    };

    await expect(provider.convert(fakeImage, "svg")).rejects.toThrow(
      "does not support format conversion"
    );
  });
});

describe("vectorizeSchema", () => {
  it("should have correct name and category", () => {
    expect(vectorizeSchema.name).toBe("vectorize");
    expect(vectorizeSchema.category).toBe("Format");
  });

  it("should have all expected parameters", () => {
    expect(vectorizeSchema.parameters).toHaveProperty("colorPrecision");
    expect(vectorizeSchema.parameters).toHaveProperty("filterSpeckle");
    expect(vectorizeSchema.parameters).toHaveProperty("simplify");
  });

  it("should not require API key", () => {
    expect(vectorizeSchema.isAI).toBe(false);
    expect(vectorizeSchema.requiresApiKey).toBe(false);
  });
});
