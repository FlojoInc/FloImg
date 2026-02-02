import { describe, it, expect, beforeEach } from "vitest";
import { FloImg } from "../src/core/client.js";
import type {
  ImageGenerator,
  TransformProvider,
  SaveProvider,
  ImageBlob,
  GeneratorSchema,
  TransformOperationSchema,
} from "../src/core/types.js";

// Mock generator schema
const mockGeneratorSchema: GeneratorSchema = {
  name: "mock",
  description: "Mock generator for testing",
  category: "Test",
  parameters: {
    text: {
      type: "string",
      title: "Text",
      description: "Text to generate",
      default: "test",
    },
  },
  requiredParameters: [],
};

// Mock generator
const mockGenerator: ImageGenerator = {
  name: "mock",
  schema: mockGeneratorSchema,
  async generate(params: Record<string, unknown>): Promise<ImageBlob> {
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

// Mock transform provider operation schemas
const mockTransformSchemas: Record<string, TransformOperationSchema> = {
  convert: {
    name: "convert",
    description: "Convert image format",
    category: "Format",
    parameters: {
      to: { type: "string", title: "Target Format" },
    },
    requiredParameters: ["to"],
  },
  resize: {
    name: "resize",
    description: "Resize image",
    category: "Size",
    parameters: {
      width: { type: "number", title: "Width" },
      height: { type: "number", title: "Height" },
    },
    requiredParameters: [],
  },
};

// Mock transform provider
const mockTransformProvider: TransformProvider = {
  name: "mock-transform",
  operationSchemas: mockTransformSchemas,
  async transform(
    blob: ImageBlob,
    op: string,
    params: Record<string, unknown>
  ): Promise<ImageBlob> {
    switch (op) {
      case "convert":
        if (!params.to) {
          throw new Error("Convert operation requires 'to' parameter");
        }
        return this.convert(blob, params.to as string);
      case "resize":
        return this.resize!(blob, params as { width?: number; height?: number });
      default:
        throw new Error(`Unknown transform operation: ${op}`);
    }
  },
  async convert(blob: ImageBlob, format: string): Promise<ImageBlob> {
    return {
      ...blob,
      mime: `image/${format}` as any,
    };
  },
  async resize(blob: ImageBlob, params: { width?: number; height?: number }): Promise<ImageBlob> {
    return {
      ...blob,
      width: params.width || blob.width,
      height: params.height || blob.height,
    };
  },
};

// Mock save provider
const mockSaveProvider: SaveProvider = {
  name: "mock-save",
  async save(input: { blob: ImageBlob; path: string; [key: string]: unknown }) {
    return {
      provider: "mock-save",
      location: `https://example.com/${input.path}`,
      size: input.blob.bytes.length,
      mime: input.blob.mime,
    };
  },
};

describe("FloImg Core Client", () => {
  let client: FloImg;

  beforeEach(() => {
    client = new FloImg();
  });

  describe("Initialization", () => {
    it("should create a client with default config", () => {
      expect(client).toBeInstanceOf(FloImg);
      expect(client.providers).toBeDefined();
      expect(client.providers.generators).toEqual({});
      expect(client.providers.transform).toEqual({});
      expect(client.providers.save).toEqual({});
    });

    it("should accept custom config", () => {
      const customClient = new FloImg({
        verbose: true,
        cacheDir: "/tmp/custom",
      });
      expect(customClient).toBeInstanceOf(FloImg);
    });
  });

  describe("Generator Registration", () => {
    it("should register a generator", () => {
      client.registerGenerator(mockGenerator);
      expect(client.providers.generators["mock"]).toBe(mockGenerator);
    });

    it("should register multiple generators", () => {
      const gen1: ImageGenerator = {
        name: "gen1",
        schema: { name: "gen1", description: "Gen 1", parameters: {} },
        async generate() {
          return {
            bytes: Buffer.from("test"),
            mime: "image/png",
            width: 100,
            height: 100,
            source: "gen1",
          };
        },
      };

      const gen2: ImageGenerator = {
        name: "gen2",
        schema: { name: "gen2", description: "Gen 2", parameters: {} },
        async generate() {
          return {
            bytes: Buffer.from("test"),
            mime: "image/png",
            width: 100,
            height: 100,
            source: "gen2",
          };
        },
      };

      client.registerGenerator(gen1);
      client.registerGenerator(gen2);

      expect(client.providers.generators["gen1"]).toBe(gen1);
      expect(client.providers.generators["gen2"]).toBe(gen2);
    });
  });

  describe("Image Generation", () => {
    beforeEach(() => {
      client.registerGenerator(mockGenerator);
    });

    it("should generate an image", async () => {
      const result = await client.generate({
        generator: "mock",
        params: { text: "hello" },
      });

      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.bytes.toString()).toBe("hello");
      expect(result.mime).toBe("image/png");
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.source).toBe("mock");
    });

    it("should throw error for unknown generator", async () => {
      await expect(
        client.generate({
          generator: "unknown",
          params: {},
        })
      ).rejects.toThrow('Provider "unknown" not found for type "generator"');
    });

    it("should throw error when no generator specified and no default", async () => {
      await expect(
        client.generate({
          params: {},
        } as any)
      ).rejects.toThrow("No generator specified and no default configured");
    });

    it("should use default generator when configured", async () => {
      const clientWithDefault = new FloImg({
        generators: { default: "mock" },
      });
      clientWithDefault.registerGenerator(mockGenerator);

      const result = await clientWithDefault.generate({
        params: { text: "default" },
      } as any);

      expect(result.bytes.toString()).toBe("default");
    });
  });

  describe("Transform Provider Registration", () => {
    it("should register a transform provider", () => {
      client.registerTransformProvider(mockTransformProvider);
      expect(client.providers.transform["mock-transform"]).toBe(mockTransformProvider);
    });
  });

  describe("Image Transformation", () => {
    let testBlob: ImageBlob;

    beforeEach(() => {
      testBlob = {
        bytes: Buffer.from("test"),
        mime: "image/png",
        width: 100,
        height: 100,
        source: "test",
      };
      client.registerTransformProvider(mockTransformProvider);
    });

    it("should configure default transform provider", () => {
      const clientWithDefault = new FloImg({
        transform: { default: "mock-transform" },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);
      expect(clientWithDefault).toBeDefined();
    });

    it("should convert image format", async () => {
      const clientWithDefault = new FloImg({
        transform: { default: "mock-transform" },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      const result = await clientWithDefault.transform({
        blob: testBlob,
        op: "convert",
        to: "jpeg",
      });

      expect(result.mime).toBe("image/jpeg");
    });

    it('should throw error for convert without "to" parameter', async () => {
      const clientWithDefault = new FloImg({
        transform: { default: "mock-transform" },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      await expect(
        clientWithDefault.transform({
          blob: testBlob,
          op: "convert",
        } as any)
      ).rejects.toThrow("Convert operation requires 'to' parameter");
    });

    it("should resize image", async () => {
      const clientWithDefault = new FloImg({
        transform: { default: "mock-transform" },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      const result = await clientWithDefault.transform({
        blob: testBlob,
        op: "resize",
        params: { width: 200, height: 200 },
      });

      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
    });

    it("should throw error for unknown operation", async () => {
      const clientWithDefault = new FloImg({
        transform: { default: "mock-transform" },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      await expect(
        clientWithDefault.transform({
          blob: testBlob,
          op: "unknown" as any,
        })
      ).rejects.toThrow("Unknown transform operation: unknown");
    });

    it("should throw error when provider not found", async () => {
      await expect(
        client.transform({
          blob: testBlob,
          op: "convert",
          to: "jpeg",
        })
      ).rejects.toThrow('Provider "sharp" not found for type "transform"');
    });
  });

  describe("Save Provider Registration", () => {
    it("should register a save provider", () => {
      client.registerSaveProvider(mockSaveProvider);
      expect(client.providers.save["mock-save"]).toBe(mockSaveProvider);
    });

    it("should register a save provider with aliases", () => {
      const providerWithAliases: SaveProvider = {
        name: "primary-name",
        aliases: ["alias-one", "alias-two"],
        async save(input: { blob: ImageBlob; path: string }) {
          return {
            provider: "primary-name",
            location: `https://example.com/${input.path}`,
            size: input.blob.bytes.length,
            mime: input.blob.mime,
          };
        },
      };

      client.registerSaveProvider(providerWithAliases);

      // Should be registered under primary name
      expect(client.providers.save["primary-name"]).toBe(providerWithAliases);
      // Should also be registered under aliases
      expect(client.providers.save["alias-one"]).toBe(providerWithAliases);
      expect(client.providers.save["alias-two"]).toBe(providerWithAliases);
      // All references should point to the same provider instance
      expect(client.providers.save["alias-one"]).toBe(client.providers.save["primary-name"]);
    });

    it("should work with save provider using alias name", async () => {
      const providerWithAlias: SaveProvider = {
        name: "main",
        aliases: ["alternate"],
        async save(input: { blob: ImageBlob; path: string }) {
          return {
            provider: "main",
            location: `saved://${input.path}`,
            size: input.blob.bytes.length,
            mime: input.blob.mime,
          };
        },
      };

      client.registerSaveProvider(providerWithAlias);

      const testBlob: ImageBlob = {
        bytes: Buffer.from("test"),
        mime: "image/png",
        width: 100,
        height: 100,
        source: "test",
      };

      // Save using the alias name
      const result = await client.save(testBlob, {
        path: "test.png",
        provider: "alternate",
      });

      expect(result.location).toBe("saved://test.png");
      expect(result.provider).toBe("main");
    });
  });

  describe("Image Save", () => {
    let testBlob: ImageBlob;

    beforeEach(() => {
      testBlob = {
        bytes: Buffer.from("test"),
        mime: "image/png",
        width: 100,
        height: 100,
        source: "test",
      };
      client.registerSaveProvider(mockSaveProvider);
    });

    it("should save an image", async () => {
      const result = await client.save(testBlob, {
        path: "test/image.png",
        provider: "mock-save",
      });

      expect(result.location).toBe("https://example.com/test/image.png");
      expect(result.provider).toBe("mock-save");
      expect(result.size).toBe(testBlob.bytes.length);
      expect(result.mime).toBe("image/png");
    });

    it("should use default provider when configured", async () => {
      const clientWithDefault = new FloImg({
        save: { default: "mock-save" },
      });
      clientWithDefault.registerSaveProvider(mockSaveProvider);

      const result = await clientWithDefault.save(testBlob, "default-test.png");

      expect(result.location).toBe("https://example.com/default-test.png");
    });

    it("should parse s3:// protocol and fail when provider not registered", async () => {
      // Should fail with provider not found, but parsing should work
      await expect(client.save(testBlob, "s3://bucket/key.png")).rejects.toThrow(
        'Provider "s3" not found for type "save"'
      );
    });

    it("should throw error for unknown provider", async () => {
      await expect(
        client.save(testBlob, {
          path: "test.png",
          provider: "unknown",
        })
      ).rejects.toThrow('Provider "unknown" not found for type "save"');
    });
  });

  describe("Pipeline Execution", () => {
    beforeEach(() => {
      client.registerGenerator(mockGenerator);
      client.registerTransformProvider(mockTransformProvider);
      client.registerSaveProvider(mockSaveProvider);
    });

    it("should run a simple generate pipeline", async () => {
      const results = await client.run({
        name: "test-pipeline",
        steps: [
          {
            kind: "generate",
            generator: "mock",
            params: { text: "pipeline" },
            out: "img1",
          },
        ],
      });

      expect(results).toHaveLength(1);
      expect(results[0].out).toBe("img1");
      expect((results[0].value as ImageBlob).bytes.toString()).toBe("pipeline");
    });

    it("should run a multi-step pipeline", async () => {
      const clientWithDefaults = new FloImg({
        transform: { default: "mock-transform" },
        save: { default: "mock-save" },
      });
      clientWithDefaults.registerGenerator(mockGenerator);
      clientWithDefaults.registerTransformProvider(mockTransformProvider);
      clientWithDefaults.registerSaveProvider(mockSaveProvider);

      const results = await clientWithDefaults.run({
        name: "multi-step",
        steps: [
          {
            kind: "generate",
            generator: "mock",
            params: { text: "test" },
            out: "original",
          },
          {
            kind: "transform",
            in: "original",
            op: "resize",
            params: { width: 200 },
            out: "resized",
          },
          {
            kind: "save",
            in: "resized",
            destination: "output/image.png",
          },
        ],
      });

      expect(results).toHaveLength(3);
      expect(results[0].out).toBe("original");
      expect(results[1].out).toBe("resized");
      expect((results[1].value as ImageBlob).width).toBe(200);
      expect(results[2].out).toBe("output/image.png");
    });

    it("should throw error for invalid transform reference", async () => {
      const clientWithDefaults = new FloImg({
        transform: { default: "mock-transform" },
      });
      clientWithDefaults.registerTransformProvider(mockTransformProvider);

      // Pre-execution validation now catches undefined variable references
      await expect(
        clientWithDefaults.run({
          name: "invalid",
          steps: [
            {
              kind: "transform",
              in: "nonexistent",
              op: "resize",
              params: {},
              out: "result",
            },
          ],
        })
      ).rejects.toThrow(/UNDEFINED_VARIABLE.*nonexistent|validation failed/i);
    });

    it("should throw error for invalid save reference", async () => {
      const clientWithDefaults = new FloImg({
        save: { default: "mock-save" },
      });
      clientWithDefaults.registerSaveProvider(mockSaveProvider);

      // Pre-execution validation now catches undefined variable references
      await expect(
        clientWithDefaults.run({
          name: "invalid",
          steps: [
            {
              kind: "save",
              in: "nonexistent",
              destination: "test.png",
            },
          ],
        })
      ).rejects.toThrow(/UNDEFINED_VARIABLE.*nonexistent|validation failed/i);
    });

    it("should execute independent steps in parallel", async () => {
      // Create generators that track execution timing
      const executionTimes: { name: string; start: number; end: number }[] = [];
      const baseTime = Date.now();

      const slowGen1: ImageGenerator = {
        name: "slow1",
        schema: { name: "slow1", description: "Slow generator 1", parameters: {} },
        async generate() {
          const start = Date.now() - baseTime;
          await new Promise((r) => setTimeout(r, 50));
          const end = Date.now() - baseTime;
          executionTimes.push({ name: "slow1", start, end });
          return {
            bytes: Buffer.from("1"),
            mime: "image/png",
            width: 100,
            height: 100,
            source: "slow1",
          };
        },
      };

      const slowGen2: ImageGenerator = {
        name: "slow2",
        schema: { name: "slow2", description: "Slow generator 2", parameters: {} },
        async generate() {
          const start = Date.now() - baseTime;
          await new Promise((r) => setTimeout(r, 50));
          const end = Date.now() - baseTime;
          executionTimes.push({ name: "slow2", start, end });
          return {
            bytes: Buffer.from("2"),
            mime: "image/png",
            width: 100,
            height: 100,
            source: "slow2",
          };
        },
      };

      client.registerGenerator(slowGen1);
      client.registerGenerator(slowGen2);

      const results = await client.run({
        name: "parallel-test",
        steps: [
          { kind: "generate", generator: "slow1", params: {}, out: "img1" },
          { kind: "generate", generator: "slow2", params: {}, out: "img2" },
        ],
      });

      expect(results).toHaveLength(2);
      // Both should have started before either finished (parallel execution)
      // With sequential execution, total time would be ~100ms
      // With parallel execution, total time should be ~50ms
      const totalTime = Math.max(...executionTimes.map((t) => t.end));
      expect(totalTime).toBeLessThan(90); // Allow some overhead
    });
  });

  describe("Capability Discovery", () => {
    it("should return empty capabilities when no providers registered", () => {
      const caps = client.getCapabilities();

      expect(caps.generators).toEqual([]);
      expect(caps.transforms).toEqual([]);
      expect(caps.saveProviders).toEqual([]);
    });

    it("should return generator schemas", () => {
      client.registerGenerator(mockGenerator);

      const caps = client.getCapabilities();

      expect(caps.generators).toHaveLength(1);
      expect(caps.generators[0].name).toBe("mock");
      expect(caps.generators[0].description).toBe("Mock generator for testing");
      expect(caps.generators[0].category).toBe("Test");
      expect(caps.generators[0].parameters.text).toBeDefined();
    });

    it("should return transform operation schemas", () => {
      client.registerTransformProvider(mockTransformProvider);

      const caps = client.getCapabilities();

      expect(caps.transforms).toHaveLength(2);
      expect(caps.transforms.map((t) => t.name).sort()).toEqual(["convert", "resize"]);
    });

    it("should return save provider info", () => {
      client.registerSaveProvider(mockSaveProvider);

      const caps = client.getCapabilities();

      expect(caps.saveProviders).toHaveLength(1);
      expect(caps.saveProviders[0].name).toBe("mock-save");
    });

    it("should return all capabilities together", () => {
      client.registerGenerator(mockGenerator);
      client.registerTransformProvider(mockTransformProvider);
      client.registerSaveProvider(mockSaveProvider);

      const caps = client.getCapabilities();

      expect(caps.generators).toHaveLength(1);
      expect(caps.transforms).toHaveLength(2);
      expect(caps.saveProviders).toHaveLength(1);
    });
  });
});
