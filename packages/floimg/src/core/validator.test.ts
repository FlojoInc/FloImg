/**
 * Tests for parameter validation
 *
 * Validates that the validator correctly:
 * - Detects missing required parameters
 * - Warns about unknown parameters
 * - Validates parameter types
 * - Skips validation for missing schemas when configured
 */

import { describe, it, expect } from "vitest";
import type {
  Pipeline,
  ClientCapabilities,
  GeneratorSchema,
  TransformOperationSchema,
} from "./types.js";
import {
  validatePipeline,
  validateStep,
  validateGeneratorParams,
  validateTransformParams,
} from "./validator.js";

// Mock generator schemas for testing
const mockGeneratorSchemas: GeneratorSchema[] = [
  {
    name: "openai",
    description: "OpenAI DALL-E image generation",
    parameters: {
      prompt: { type: "string", description: "Image prompt" },
      size: { type: "string", enum: ["256x256", "512x512", "1024x1024"] },
      quality: { type: "string", enum: ["standard", "hd"] },
    },
    requiredParameters: ["prompt"],
    isAI: true,
  },
  {
    name: "qr",
    description: "QR code generator",
    parameters: {
      text: { type: "string", description: "QR code content" },
      width: { type: "number", minimum: 50, maximum: 1000 },
      color: {
        type: "object",
        properties: {
          dark: { type: "string" },
          light: { type: "string" },
        },
      },
    },
    requiredParameters: ["text"],
  },
];

// Mock transform schemas for testing
const mockTransformSchemas: TransformOperationSchema[] = [
  {
    name: "resize",
    description: "Resize image",
    parameters: {
      width: { type: "number", minimum: 1, maximum: 4096 },
      height: { type: "number", minimum: 1, maximum: 4096 },
      fit: { type: "string", enum: ["cover", "contain", "fill"] },
    },
    requiredParameters: [],
  },
  {
    name: "convert",
    description: "Convert format",
    parameters: {
      to: { type: "string", enum: ["image/png", "image/jpeg", "image/webp"] },
    },
    requiredParameters: ["to"],
  },
];

// Mock capabilities for testing
const mockCapabilities: ClientCapabilities = {
  generators: mockGeneratorSchemas,
  transforms: mockTransformSchemas,
  saveProviders: [],
  visionProviders: [],
  textProviders: [],
};

describe("validateGeneratorParams", () => {
  it("should pass validation with all required params", () => {
    const result = validateGeneratorParams(
      "openai",
      { prompt: "A beautiful sunset" },
      mockCapabilities
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail validation when required param is missing", () => {
    const result = validateGeneratorParams("openai", { size: "1024x1024" }, mockCapabilities);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("MISSING_REQUIRED_PARAM");
    expect(result.errors[0].parameterName).toBe("prompt");
    expect(result.errors[0].message).toContain("prompt");
  });

  it("should warn about unknown parameters", () => {
    const result = validateGeneratorParams(
      "openai",
      { prompt: "test", unknownParam: "value" },
      mockCapabilities
    );

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("UNKNOWN_PARAM");
    expect(result.warnings[0].parameterName).toBe("unknownParam");
  });

  it("should error on unknown params when strictUnknownParams is true", () => {
    const result = validateGeneratorParams(
      "openai",
      { prompt: "test", unknownParam: "value" },
      mockCapabilities,
      { strictUnknownParams: true }
    );

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].code).toBe("UNKNOWN_PARAM");
  });

  it("should skip internal params starting with underscore", () => {
    const result = validateGeneratorParams(
      "openai",
      { prompt: "test", _referenceImageVars: ["img1"] },
      mockCapabilities
    );

    expect(result.valid).toBe(true);
    expect(result.warnings).toHaveLength(0);
  });

  it("should skip validation for unknown generators by default", () => {
    const result = validateGeneratorParams(
      "unknown-generator",
      { anything: "goes" },
      mockCapabilities
    );

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should error for unknown generators when skipMissingSchemas is false", () => {
    const result = validateGeneratorParams(
      "unknown-generator",
      { anything: "goes" },
      mockCapabilities,
      { skipMissingSchemas: false }
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("UNKNOWN_GENERATOR");
  });
});

describe("validateTransformParams", () => {
  it("should pass with valid params", () => {
    const result = validateTransformParams("resize", { width: 800, height: 600 }, mockCapabilities);

    expect(result.valid).toBe(true);
  });

  it("should fail when required param is missing", () => {
    const result = validateTransformParams("convert", {}, mockCapabilities);

    expect(result.valid).toBe(false);
    expect(result.errors[0].parameterName).toBe("to");
  });
});

describe("type validation", () => {
  it("should validate string type", () => {
    const result = validateGeneratorParams(
      "openai",
      { prompt: 123 }, // Should be string
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_PARAM_TYPE");
    expect(result.errors[0].message).toContain("Expected string");
  });

  it("should validate number type", () => {
    const result = validateGeneratorParams(
      "qr",
      { text: "test", width: "not a number" },
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_PARAM_TYPE");
    expect(result.errors[0].message).toContain("Expected finite number");
  });

  it("should reject NaN and Infinity", () => {
    const resultNaN = validateGeneratorParams("qr", { text: "test", width: NaN }, mockCapabilities);
    expect(resultNaN.valid).toBe(false);
    expect(resultNaN.errors[0].message).toContain("NaN");

    const resultInfinity = validateGeneratorParams(
      "qr",
      { text: "test", width: Infinity },
      mockCapabilities
    );
    expect(resultInfinity.valid).toBe(false);
    expect(resultInfinity.errors[0].message).toContain("Infinity");
  });

  it("should validate enum values", () => {
    const result = validateGeneratorParams(
      "openai",
      { prompt: "test", size: "invalid-size" },
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].code).toBe("INVALID_PARAM_TYPE");
    expect(result.errors[0].message).toContain("Invalid value");
    expect(result.errors[0].message).toContain("Allowed:");
  });

  it("should validate number minimum", () => {
    const result = validateGeneratorParams(
      "qr",
      { text: "test", width: 10 }, // Below minimum of 50
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("below minimum");
  });

  it("should validate number maximum", () => {
    const result = validateGeneratorParams(
      "qr",
      { text: "test", width: 2000 }, // Above maximum of 1000
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].message).toContain("above maximum");
  });
});

describe("validateStep", () => {
  it("should validate generate step", () => {
    const result = validateStep(
      { kind: "generate", generator: "openai", params: {}, out: "img" },
      0,
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].stepKind).toBe("generate");
    expect(result.errors[0].providerName).toBe("openai");
  });

  it("should validate transform step", () => {
    const result = validateStep(
      { kind: "transform", op: "convert", in: "img", params: {}, out: "out" },
      1,
      mockCapabilities
    );

    expect(result.valid).toBe(false);
    expect(result.errors[0].stepKind).toBe("transform");
    expect(result.errors[0].providerName).toBe("convert");
  });

  it("should skip validation for save steps", () => {
    const result = validateStep(
      { kind: "save", in: "img", destination: "s3://bucket/key" },
      0,
      mockCapabilities
    );

    expect(result.valid).toBe(true);
  });
});

describe("validatePipeline", () => {
  it("should validate all steps in a pipeline", () => {
    const pipeline: Pipeline = {
      steps: [
        { kind: "generate", generator: "openai", params: { prompt: "test" }, out: "img" },
        { kind: "transform", op: "resize", in: "img", params: { width: 800 }, out: "resized" },
        { kind: "transform", op: "convert", in: "resized", params: {}, out: "final" },
      ],
    };

    const result = validatePipeline(pipeline, mockCapabilities);

    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1); // Missing 'to' param in convert
    expect(result.errors[0].stepIndex).toBe(2);
  });

  it("should pass for valid pipeline", () => {
    const pipeline: Pipeline = {
      steps: [
        { kind: "generate", generator: "openai", params: { prompt: "test" }, out: "img" },
        { kind: "transform", op: "resize", in: "img", params: { width: 800 }, out: "resized" },
        {
          kind: "transform",
          op: "convert",
          in: "resized",
          params: { to: "image/webp" },
          out: "final",
        },
      ],
    };

    const result = validatePipeline(pipeline, mockCapabilities);

    expect(result.valid).toBe(true);
  });
});

describe("formatErrors", () => {
  it("should format errors in human-readable format", () => {
    const result = validateGeneratorParams("openai", {}, mockCapabilities);

    const formatted = result.formatErrors();
    expect(formatted).toContain("MISSING_REQUIRED_PARAM");
    expect(formatted).toContain("openai");
    expect(formatted).toContain("prompt");
  });

  it("should return empty string when no errors", () => {
    const result = validateGeneratorParams("openai", { prompt: "test" }, mockCapabilities);

    expect(result.formatErrors()).toBe("");
  });
});
