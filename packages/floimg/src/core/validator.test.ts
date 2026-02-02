/**
 * Tests for parameter validation
 *
 * Validates that the validator correctly:
 * - Detects missing required parameters
 * - Warns about unknown parameters
 * - Validates parameter types
 * - Skips validation for missing schemas when configured
 * - Catches semantic issues (missing prompt sources, undefined variables, etc.)
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
  validatePipelineSemantics,
  validatePipelineFull,
  SemanticValidationCodes,
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

// =============================================================================
// Semantic Validation Tests
// =============================================================================

describe("validatePipelineSemantics", () => {
  describe("MISSING_PROMPT_SOURCE", () => {
    it("should error when AI generator has no prompt and no _promptFromVar", () => {
      const pipeline: Pipeline = {
        steps: [{ kind: "generate", generator: "openai", params: {}, out: "img" }],
      };

      const result = validatePipelineSemantics(pipeline, mockCapabilities);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.MISSING_PROMPT_SOURCE);
      expect(result.errors[0].message).toContain("openai");
      expect(result.errors[0].message).toContain("prompt");
    });

    it("should pass when AI generator has static prompt", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "openai", params: { prompt: "A sunset" }, out: "img" },
        ],
      };

      const result = validatePipelineSemantics(pipeline, mockCapabilities);

      expect(result.valid).toBe(true);
    });

    it("should pass when AI generator has _promptFromVar referencing defined variable", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "text",
            provider: "gemini-text",
            params: { prompt: "Generate a prompt" },
            out: "prompt_text",
          },
          {
            kind: "generate",
            generator: "openai",
            params: { _promptFromVar: "prompt_text" },
            out: "img",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline, mockCapabilities);

      expect(result.valid).toBe(true);
    });

    it("should error when AI generator has empty string prompt", () => {
      const pipeline: Pipeline = {
        steps: [{ kind: "generate", generator: "openai", params: { prompt: "" }, out: "img" }],
      };

      const result = validatePipelineSemantics(pipeline, mockCapabilities);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.MISSING_PROMPT_SOURCE);
    });

    it("should error when AI generator has whitespace-only prompt", () => {
      const pipeline: Pipeline = {
        steps: [{ kind: "generate", generator: "openai", params: { prompt: "   " }, out: "img" }],
      };

      const result = validatePipelineSemantics(pipeline, mockCapabilities);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.MISSING_PROMPT_SOURCE);
    });

    it("should detect AI generators by name patterns (stability, gemini, imagen, replicate)", () => {
      const generators = ["stability", "gemini-generate", "imagen", "replicate-flux"];

      for (const generator of generators) {
        const pipeline: Pipeline = {
          steps: [{ kind: "generate", generator, params: {}, out: "img" }],
        };

        const result = validatePipelineSemantics(pipeline);
        expect(result.valid).toBe(false);
        expect(result.errors[0].code).toBe(SemanticValidationCodes.MISSING_PROMPT_SOURCE);
      }
    });

    it("should not require prompt for non-AI generators (qr, screenshot, etc.)", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "generate",
            generator: "qr",
            params: { text: "https://example.com" },
            out: "qr_code",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });
  });

  describe("UNDEFINED_VARIABLE", () => {
    it("should error when transform references undefined variable", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "transform",
            op: "resize",
            in: "nonexistent",
            params: { width: 800 },
            out: "resized",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.UNDEFINED_VARIABLE);
      expect(result.errors[0].message).toContain("nonexistent");
    });

    it("should pass when transform references variable from previous step", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "qr", params: { text: "test" }, out: "img" },
          { kind: "transform", op: "resize", in: "img", params: { width: 800 }, out: "resized" },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });

    it("should error when vision step references undefined variable", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "vision",
            provider: "claude-vision",
            in: "nonexistent",
            params: { prompt: "describe" },
            out: "desc",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.UNDEFINED_VARIABLE);
    });

    it("should error when save step references undefined variable", () => {
      const pipeline: Pipeline = {
        steps: [{ kind: "save", in: "nonexistent", destination: "/tmp/test.png" }],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.UNDEFINED_VARIABLE);
    });

    it("should error when _promptFromVar references undefined variable", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "generate",
            generator: "openai",
            params: { _promptFromVar: "nonexistent" },
            out: "img",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline, mockCapabilities);

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.code === SemanticValidationCodes.UNDEFINED_VARIABLE)).toBe(
        true
      );
      expect(result.errors.some((e) => e.message.includes("nonexistent"))).toBe(true);
    });

    it("should recognize variables from initialVariables", () => {
      const pipeline: Pipeline = {
        initialVariables: {
          uploaded_image: { bytes: Buffer.from(""), mime: "image/png" },
        },
        steps: [
          {
            kind: "transform",
            op: "resize",
            in: "uploaded_image",
            params: { width: 800 },
            out: "resized",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });

    it("should allow optional 'in' for text steps", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "text",
            provider: "gemini-text",
            params: { prompt: "Generate something" },
            out: "text_output",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });
  });

  describe("MISSING_ARRAY_PROPERTY", () => {
    it("should error when fan-out in array mode has no arrayProperty", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "text",
            provider: "gemini-text",
            params: { prompt: "Generate prompts" },
            out: "prompts",
          },
          { kind: "fan-out", in: "prompts", mode: "array", out: ["a", "b", "c"] },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.MISSING_ARRAY_PROPERTY);
    });

    it("should pass when fan-out in array mode has arrayProperty", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "text",
            provider: "gemini-text",
            params: { prompt: "Generate prompts" },
            out: "prompts",
          },
          {
            kind: "fan-out",
            in: "prompts",
            mode: "array",
            arrayProperty: "concepts",
            out: ["a", "b", "c"],
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });

    it("should not require arrayProperty for count mode", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "qr", params: { text: "test" }, out: "img" },
          { kind: "fan-out", in: "img", mode: "count", count: 3, out: ["a", "b", "c"] },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });
  });

  describe("UNDEFINED_COLLECT_INPUT", () => {
    it("should error when collect references undefined variables", () => {
      const pipeline: Pipeline = {
        steps: [
          {
            kind: "collect",
            in: ["nonexistent1", "nonexistent2"],
            waitMode: "all",
            out: "collected",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0].code).toBe(SemanticValidationCodes.UNDEFINED_COLLECT_INPUT);
      expect(result.errors[1].code).toBe(SemanticValidationCodes.UNDEFINED_COLLECT_INPUT);
    });

    it("should pass when collect references defined variables", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "qr", params: { text: "1" }, out: "img1" },
          { kind: "generate", generator: "qr", params: { text: "2" }, out: "img2" },
          { kind: "collect", in: ["img1", "img2"], waitMode: "all", out: "collected" },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });
  });

  describe("UNDEFINED_ROUTER_INPUT", () => {
    it("should error when router references undefined candidates", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "text", provider: "gemini-text", params: { prompt: "select" }, out: "selection" },
          {
            kind: "router",
            in: "nonexistent",
            selectionIn: "selection",
            selectionType: "index",
            selectionProperty: "winner",
            out: "winner",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === SemanticValidationCodes.UNDEFINED_ROUTER_INPUT)
      ).toBe(true);
      expect(result.errors.some((e) => e.message.includes("candidates"))).toBe(true);
    });

    it("should error when router references undefined selection", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "qr", params: { text: "1" }, out: "img1" },
          { kind: "generate", generator: "qr", params: { text: "2" }, out: "img2" },
          { kind: "collect", in: ["img1", "img2"], waitMode: "all", out: "collected" },
          {
            kind: "router",
            in: "collected",
            selectionIn: "nonexistent",
            selectionType: "index",
            selectionProperty: "winner",
            out: "winner",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(false);
      expect(
        result.errors.some((e) => e.code === SemanticValidationCodes.UNDEFINED_ROUTER_INPUT)
      ).toBe(true);
      expect(result.errors.some((e) => e.message.includes("selection"))).toBe(true);
    });

    it("should pass when router references defined variables", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "qr", params: { text: "1" }, out: "img1" },
          { kind: "generate", generator: "qr", params: { text: "2" }, out: "img2" },
          { kind: "collect", in: ["img1", "img2"], waitMode: "all", out: "collected" },
          {
            kind: "vision",
            provider: "claude-vision",
            in: "img1",
            params: { prompt: "pick best" },
            out: "selection",
          },
          {
            kind: "router",
            in: "collected",
            selectionIn: "selection",
            selectionType: "index",
            selectionProperty: "winner",
            out: "winner",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });
  });

  describe("fan-out output variables", () => {
    it("should define all fan-out output variables for subsequent steps", () => {
      const pipeline: Pipeline = {
        steps: [
          { kind: "generate", generator: "qr", params: { text: "test" }, out: "source" },
          {
            kind: "fan-out",
            in: "source",
            mode: "count",
            count: 3,
            out: ["branch_0", "branch_1", "branch_2"],
          },
          {
            kind: "transform",
            op: "resize",
            in: "branch_0",
            params: { width: 100 },
            out: "resized_0",
          },
          {
            kind: "transform",
            op: "resize",
            in: "branch_1",
            params: { width: 100 },
            out: "resized_1",
          },
          {
            kind: "transform",
            op: "resize",
            in: "branch_2",
            params: { width: 100 },
            out: "resized_2",
          },
        ],
      };

      const result = validatePipelineSemantics(pipeline);

      expect(result.valid).toBe(true);
    });
  });
});

describe("validatePipelineFull", () => {
  it("should combine parameter and semantic validation", () => {
    const pipeline: Pipeline = {
      steps: [
        // Parameter error: missing required 'prompt' for openai
        { kind: "generate", generator: "openai", params: {}, out: "img" },
        // Semantic error: references undefined variable
        {
          kind: "transform",
          op: "resize",
          in: "nonexistent",
          params: { width: 800 },
          out: "resized",
        },
      ],
    };

    const result = validatePipelineFull(pipeline, mockCapabilities);

    expect(result.valid).toBe(false);
    // Should have both parameter and semantic errors
    expect(result.errors.some((e) => e.code === "MISSING_REQUIRED_PARAM")).toBe(true);
    expect(result.errors.some((e) => e.code === SemanticValidationCodes.UNDEFINED_VARIABLE)).toBe(
      true
    );
  });

  it("should pass when both parameter and semantic validation pass", () => {
    const pipeline: Pipeline = {
      steps: [
        { kind: "generate", generator: "openai", params: { prompt: "A sunset" }, out: "img" },
        { kind: "transform", op: "resize", in: "img", params: { width: 800 }, out: "resized" },
      ],
    };

    const result = validatePipelineFull(pipeline, mockCapabilities);

    expect(result.valid).toBe(true);
  });
});

describe("complex workflow validation", () => {
  it("should validate a complete iterative workflow", () => {
    const pipeline: Pipeline = {
      steps: [
        // Generate prompts
        {
          kind: "text",
          provider: "gemini-text",
          params: { prompt: "Generate 3 prompts", outputFormat: "json" },
          out: "prompts_data",
        },
        // Fan out to 3 branches
        {
          kind: "fan-out",
          in: "prompts_data",
          mode: "array",
          arrayProperty: "prompts",
          out: ["prompt_0", "prompt_1", "prompt_2"],
        },
        // Generate images
        {
          kind: "generate",
          generator: "openai",
          params: { _promptFromVar: "prompt_0" },
          out: "img_0",
        },
        {
          kind: "generate",
          generator: "openai",
          params: { _promptFromVar: "prompt_1" },
          out: "img_1",
        },
        {
          kind: "generate",
          generator: "openai",
          params: { _promptFromVar: "prompt_2" },
          out: "img_2",
        },
        // Collect results
        { kind: "collect", in: ["img_0", "img_1", "img_2"], waitMode: "all", out: "all_images" },
        // Vision evaluation
        {
          kind: "vision",
          provider: "claude-vision",
          in: "img_0",
          params: { prompt: "Pick best" },
          out: "evaluation",
        },
        // Route to winner
        {
          kind: "router",
          in: "all_images",
          selectionIn: "evaluation",
          selectionType: "index",
          selectionProperty: "best_index",
          out: "winner",
        },
        // Save winner
        { kind: "save", in: "winner", destination: "/tmp/winner.png" },
      ],
    };

    const result = validatePipelineSemantics(pipeline, mockCapabilities);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should catch multiple errors in a broken workflow", () => {
    const pipeline: Pipeline = {
      steps: [
        // Missing prompt - semantic error
        { kind: "generate", generator: "openai", params: {}, out: "img" },
        // References undefined variable
        {
          kind: "transform",
          op: "resize",
          in: "wrong_var",
          params: { width: 800 },
          out: "resized",
        },
        // Fan-out missing arrayProperty
        { kind: "fan-out", in: "resized", mode: "array", out: ["a", "b"] },
        // Collect references undefined
        { kind: "collect", in: ["x", "y"], waitMode: "all", out: "collected" },
      ],
    };

    const result = validatePipelineSemantics(pipeline, mockCapabilities);

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(4);

    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain(SemanticValidationCodes.MISSING_PROMPT_SOURCE);
    expect(codes).toContain(SemanticValidationCodes.UNDEFINED_VARIABLE);
    expect(codes).toContain(SemanticValidationCodes.MISSING_ARRAY_PROPERTY);
    expect(codes).toContain(SemanticValidationCodes.UNDEFINED_COLLECT_INPUT);
  });
});
