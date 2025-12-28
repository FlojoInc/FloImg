import { describe, it, expect, beforeEach } from "vitest";
import { FloImg } from "../src/core/client.js";
import { FluentBuilder, createFluent } from "../src/core/fluent.js";
import type {
  ImageGenerator,
  TransformProvider,
  SaveProvider,
  VisionProvider,
  TextProvider,
  ImageBlob,
  DataBlob,
  GeneratorSchema,
  TransformOperationSchema,
  VisionProviderSchema,
  TextProviderSchema,
} from "../src/core/types.js";

// Mock generator
const mockGeneratorSchema: GeneratorSchema = {
  name: "mock",
  description: "Mock generator",
  parameters: {
    text: { type: "string", default: "test" },
  },
};

const mockGenerator: ImageGenerator = {
  name: "mock",
  schema: mockGeneratorSchema,
  async generate(params): Promise<ImageBlob> {
    const text = (params.text as string) || "test";
    return {
      bytes: Buffer.from(text),
      mime: "image/png",
      width: 100,
      height: 100,
      source: "mock",
    };
  },
};

// Mock transform provider
const mockTransformSchemas: Record<string, TransformOperationSchema> = {
  resize: {
    name: "resize",
    description: "Resize image",
    parameters: {
      width: { type: "number" },
      height: { type: "number" },
    },
  },
  blur: {
    name: "blur",
    description: "Blur image",
    parameters: {
      sigma: { type: "number", default: 1 },
    },
  },
  convert: {
    name: "convert",
    description: "Convert format",
    parameters: {
      to: { type: "string" },
    },
  },
};

const mockTransformProvider: TransformProvider = {
  name: "mock-transform",
  operationSchemas: mockTransformSchemas,
  async transform(blob, op, params): Promise<ImageBlob> {
    return {
      ...blob,
      metadata: { ...blob.metadata, lastOp: op, params },
      width: (params.width as number) || blob.width,
      height: (params.height as number) || blob.height,
    };
  },
  async convert(blob, to): Promise<ImageBlob> {
    return { ...blob, mime: ("image/" + to) as any };
  },
};

// Mock save provider - named "fs" to match local path detection
const mockSaveProvider: SaveProvider = {
  name: "fs",
  async save(input) {
    return {
      provider: "fs",
      location: input.path,
      size: input.blob.bytes.length,
      mime: input.blob.mime,
    };
  },
};

// Mock vision provider
const mockVisionSchema: VisionProviderSchema = {
  name: "mock-vision",
  description: "Mock vision provider",
  parameters: {
    prompt: { type: "string" },
  },
};

const mockVisionProvider: VisionProvider = {
  name: "mock-vision",
  schema: mockVisionSchema,
  async analyze(blob, params): Promise<DataBlob> {
    return {
      type: "text",
      content: "Analyzed image: " + (params.prompt || "no prompt"),
      source: "mock-vision",
    };
  },
};

// Mock text provider
const mockTextSchema: TextProviderSchema = {
  name: "mock-text",
  description: "Mock text provider",
  parameters: {
    prompt: { type: "string" },
  },
};

const mockTextProvider: TextProvider = {
  name: "mock-text",
  schema: mockTextSchema,
  async generate(params): Promise<DataBlob> {
    return {
      type: "text",
      content: "Generated: " + (params.prompt || "no prompt"),
      source: "mock-text",
    };
  },
};

describe("Fluent API", () => {
  let client: FloImg;
  let fluent: ReturnType<typeof createFluent>;

  beforeEach(() => {
    client = new FloImg({
      transform: { default: "mock-transform" },
      save: { default: "fs" },
    });
    client.registerGenerator(mockGenerator);
    client.registerTransformProvider(mockTransformProvider);
    client.registerSaveProvider(mockSaveProvider);
    client.registerVisionProvider(mockVisionProvider);
    client.registerTextProvider(mockTextProvider);
    fluent = createFluent(client);
  });

  describe("createFluent", () => {
    it("should create a fluent facade with from and generate methods", () => {
      expect(fluent.from).toBeTypeOf("function");
      expect(fluent.generate).toBeTypeOf("function");
    });
  });

  describe("FluentBuilder.from", () => {
    it("should create a builder from ImageBlob", async () => {
      const blob: ImageBlob = {
        bytes: Buffer.from("test"),
        mime: "image/png",
        width: 100,
        height: 100,
      };

      const builder = fluent.from(blob);
      expect(builder).toBeInstanceOf(FluentBuilder);
    });
  });

  describe("FluentBuilder.generate", () => {
    it("should create a builder that generates an image", async () => {
      const results = await fluent.generate("mock", { text: "hello" }).run();

      expect(results).toHaveLength(1);
      expect((results[0].value as ImageBlob).bytes.toString()).toBe("hello");
    });
  });

  describe(".transform()", () => {
    it("should chain transform operations", async () => {
      const results = await fluent
        .generate("mock", { text: "test" })
        .transform("resize", { width: 200, height: 150 })
        .run();

      expect(results).toHaveLength(2);
      const transformed = results[1].value as ImageBlob;
      expect(transformed.width).toBe(200);
      expect(transformed.height).toBe(150);
    });

    it("should chain multiple transforms", async () => {
      const results = await fluent
        .generate("mock", { text: "test" })
        .transform("resize", { width: 200 })
        .transform("blur", { sigma: 2 })
        .run();

      expect(results).toHaveLength(3);
    });
  });

  describe(".analyze()", () => {
    it("should chain vision analysis", async () => {
      const results = await fluent
        .generate("mock", { text: "test" })
        .analyze("mock-vision", { prompt: "Describe this" })
        .run();

      expect(results).toHaveLength(2);
      const analysis = results[1].value as DataBlob;
      expect(analysis.content).toContain("Analyzed image");
      expect(analysis.content).toContain("Describe this");
    });
  });

  describe(".text()", () => {
    it("should chain text generation", async () => {
      const results = await fluent
        .generate("mock", { text: "test" })
        .analyze("mock-vision", { prompt: "Describe" })
        .text("mock-text", { prompt: "Write a poem" })
        .run();

      expect(results).toHaveLength(3);
      const text = results[2].value as DataBlob;
      expect(text.content).toContain("Generated");
      expect(text.content).toContain("Write a poem");
    });
  });

  describe(".to()", () => {
    it("should execute pipeline and save result", async () => {
      const result = await fluent
        .generate("mock", { text: "save-test" })
        .transform("resize", { width: 100 })
        .to("./output.png");

      expect(result.provider).toBe("fs");
      expect(result.location).toBe("./output.png");
    });
  });

  describe(".toBlob()", () => {
    it("should execute pipeline and return final blob", async () => {
      const blob = await fluent
        .generate("mock", { text: "blob-test" })
        .transform("resize", { width: 300, height: 200 })
        .toBlob();

      expect(blob.bytes).toBeInstanceOf(Buffer);
      expect(blob.width).toBe(300);
      expect(blob.height).toBe(200);
    });

    it("should throw if final result is not an image", async () => {
      await expect(
        fluent
          .generate("mock", { text: "test" })
          .analyze("mock-vision", { prompt: "test" })
          .toBlob()
      ).rejects.toThrow("Expected ImageBlob");
    });
  });

  describe(".run()", () => {
    it("should return all step results", async () => {
      const results = await fluent
        .generate("mock", { text: "run-test" })
        .transform("resize", { width: 100 })
        .transform("blur", { sigma: 1 })
        .run();

      expect(results).toHaveLength(3);
      expect(results[0].step.kind).toBe("generate");
      expect(results[1].step.kind).toBe("transform");
      expect(results[2].step.kind).toBe("transform");
    });
  });

  describe("from() with ImageBlob", () => {
    it("should use provided ImageBlob as initial variable", async () => {
      const inputBlob: ImageBlob = {
        bytes: Buffer.from("initial"),
        mime: "image/png",
        width: 50,
        height: 50,
      };

      const results = await fluent.from(inputBlob).transform("resize", { width: 100 }).run();

      expect(results).toHaveLength(1);
      const transformed = results[0].value as ImageBlob;
      expect(transformed.width).toBe(100);
      expect(transformed.bytes.toString()).toBe("initial");
    });
  });

  describe("Complex pipelines", () => {
    it("should handle generate -> multiple transforms -> save", async () => {
      const result = await fluent
        .generate("mock", { text: "complex" })
        .transform("resize", { width: 800, height: 600 })
        .transform("blur", { sigma: 0.5 })
        .to("./complex-output.webp");

      expect(result.location).toBe("./complex-output.webp");
    });

    it("should handle from -> analyze -> text chain", async () => {
      const inputBlob: ImageBlob = {
        bytes: Buffer.from("photo"),
        mime: "image/jpeg",
        width: 1920,
        height: 1080,
      };

      const results = await fluent
        .from(inputBlob)
        .analyze("mock-vision", { prompt: "What is in this image?" })
        .text("mock-text", { prompt: "Write a caption" })
        .run();

      expect(results).toHaveLength(2);
      expect((results[0].value as DataBlob).type).toBe("text");
      expect((results[1].value as DataBlob).type).toBe("text");
    });
  });
});
