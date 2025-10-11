import { describe, it, expect, beforeEach } from 'vitest';
import { Imgflo } from '../src/core/client.js';
import type { ImageGenerator, TransformProvider, StoreProvider, ImageBlob } from '../src/core/types.js';

// Mock generator
const mockGenerator: ImageGenerator = {
  name: 'mock',
  async generate(params: Record<string, unknown>): Promise<ImageBlob> {
    const text = (params.text as string) || 'test';
    return {
      bytes: Buffer.from(text),
      mime: 'image/png',
      width: 100,
      height: 100,
      source: 'mock',
    };
  },
};

// Mock transform provider
const mockTransformProvider: TransformProvider = {
  name: 'mock-transform',
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

// Mock store provider
const mockStoreProvider: StoreProvider = {
  name: 'mock-store',
  async put(input: { key: string; blob: ImageBlob; headers?: Record<string, string> }) {
    return {
      url: `https://example.com/${input.key}`,
      key: input.key,
      provider: 'mock-store',
    };
  },
};

describe('Imgflo Core Client', () => {
  let client: Imgflo;

  beforeEach(() => {
    client = new Imgflo();
  });

  describe('Initialization', () => {
    it('should create a client with default config', () => {
      expect(client).toBeInstanceOf(Imgflo);
      expect(client.providers).toBeDefined();
      expect(client.providers.generators).toEqual({});
      expect(client.providers.transform).toEqual({});
      expect(client.providers.store).toEqual({});
    });

    it('should accept custom config', () => {
      const customClient = new Imgflo({
        verbose: true,
        cacheDir: '/tmp/custom',
      });
      expect(customClient).toBeInstanceOf(Imgflo);
    });
  });

  describe('Generator Registration', () => {
    it('should register a generator', () => {
      client.registerGenerator(mockGenerator);
      expect(client.providers.generators['mock']).toBe(mockGenerator);
    });

    it('should register multiple generators', () => {
      const gen1: ImageGenerator = {
        name: 'gen1',
        async generate() {
          return {
            bytes: Buffer.from('test'),
            mime: 'image/png',
            width: 100,
            height: 100,
            source: 'gen1',
          };
        },
      };

      const gen2: ImageGenerator = {
        name: 'gen2',
        async generate() {
          return {
            bytes: Buffer.from('test'),
            mime: 'image/png',
            width: 100,
            height: 100,
            source: 'gen2',
          };
        },
      };

      client.registerGenerator(gen1);
      client.registerGenerator(gen2);

      expect(client.providers.generators['gen1']).toBe(gen1);
      expect(client.providers.generators['gen2']).toBe(gen2);
    });
  });

  describe('Image Generation', () => {
    beforeEach(() => {
      client.registerGenerator(mockGenerator);
    });

    it('should generate an image', async () => {
      const result = await client.generate({
        generator: 'mock',
        params: { text: 'hello' },
      });

      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.bytes.toString()).toBe('hello');
      expect(result.mime).toBe('image/png');
      expect(result.width).toBe(100);
      expect(result.height).toBe(100);
      expect(result.source).toBe('mock');
    });

    it('should throw error for unknown generator', async () => {
      await expect(
        client.generate({
          generator: 'unknown',
          params: {},
        })
      ).rejects.toThrow('Provider "unknown" not found for type "generator"');
    });

    it('should throw error when no generator specified and no default', async () => {
      await expect(
        client.generate({
          params: {},
        } as any)
      ).rejects.toThrow('No generator specified and no default configured');
    });

    it('should use default generator when configured', async () => {
      const clientWithDefault = new Imgflo({
        generators: { default: 'mock' },
      });
      clientWithDefault.registerGenerator(mockGenerator);

      const result = await clientWithDefault.generate({
        params: { text: 'default' },
      } as any);

      expect(result.bytes.toString()).toBe('default');
    });
  });

  describe('Transform Provider Registration', () => {
    it('should register a transform provider', () => {
      client.registerTransformProvider(mockTransformProvider);
      expect(client.providers.transform['mock-transform']).toBe(mockTransformProvider);
    });
  });

  describe('Image Transformation', () => {
    let testBlob: ImageBlob;

    beforeEach(() => {
      testBlob = {
        bytes: Buffer.from('test'),
        mime: 'image/png',
        width: 100,
        height: 100,
        source: 'test',
      };
      client.registerTransformProvider(mockTransformProvider);
    });

    it('should configure default transform provider', () => {
      const clientWithDefault = new Imgflo({
        transform: { default: 'mock-transform' },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);
      expect(clientWithDefault).toBeDefined();
    });

    it('should convert image format', async () => {
      const clientWithDefault = new Imgflo({
        transform: { default: 'mock-transform' },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      const result = await clientWithDefault.transform({
        blob: testBlob,
        op: 'convert',
        to: 'jpeg',
      });

      expect(result.mime).toBe('image/jpeg');
    });

    it('should throw error for convert without "to" parameter', async () => {
      const clientWithDefault = new Imgflo({
        transform: { default: 'mock-transform' },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      await expect(
        clientWithDefault.transform({
          blob: testBlob,
          op: 'convert',
        } as any)
      ).rejects.toThrow("Convert operation requires 'to' parameter");
    });

    it('should resize image', async () => {
      const clientWithDefault = new Imgflo({
        transform: { default: 'mock-transform' },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      const result = await clientWithDefault.transform({
        blob: testBlob,
        op: 'resize',
        params: { width: 200, height: 200 },
      });

      expect(result.width).toBe(200);
      expect(result.height).toBe(200);
    });

    it('should throw error for unknown operation', async () => {
      const clientWithDefault = new Imgflo({
        transform: { default: 'mock-transform' },
      });
      clientWithDefault.registerTransformProvider(mockTransformProvider);

      await expect(
        clientWithDefault.transform({
          blob: testBlob,
          op: 'unknown' as any,
        })
      ).rejects.toThrow('Unknown transform operation: unknown');
    });

    it('should throw error when provider not found', async () => {
      await expect(
        client.transform({
          blob: testBlob,
          op: 'convert',
          to: 'jpeg',
        })
      ).rejects.toThrow('Provider "sharp" not found for type "transform"');
    });
  });

  describe('Store Provider Registration', () => {
    it('should register a store provider', () => {
      client.registerStoreProvider(mockStoreProvider);
      expect(client.providers.store['mock-store']).toBe(mockStoreProvider);
    });
  });

  describe('Image Upload', () => {
    let testBlob: ImageBlob;

    beforeEach(() => {
      testBlob = {
        bytes: Buffer.from('test'),
        mime: 'image/png',
        width: 100,
        height: 100,
        source: 'test',
      };
      client.registerStoreProvider(mockStoreProvider);
    });

    it('should upload an image', async () => {
      const result = await client.upload({
        blob: testBlob,
        key: 'test/image.png',
        provider: 'mock-store',
      });

      expect(result.url).toBe('https://example.com/test/image.png');
      expect(result.key).toBe('test/image.png');
      expect(result.provider).toBe('mock-store');
    });

    it('should use default provider when configured', async () => {
      const clientWithDefault = new Imgflo({
        store: { default: 'mock-store' },
      });
      clientWithDefault.registerStoreProvider(mockStoreProvider);

      const result = await clientWithDefault.upload({
        blob: testBlob,
        key: 'default-test.png',
      });

      expect(result.url).toBe('https://example.com/default-test.png');
    });

    it('should throw error when no provider specified and no default', async () => {
      await expect(
        client.upload({
          blob: testBlob,
          key: 'test.png',
        })
      ).rejects.toThrow('No storage provider specified and no default configured');
    });

    it('should throw error for unknown provider', async () => {
      await expect(
        client.upload({
          blob: testBlob,
          key: 'test.png',
          provider: 'unknown',
        })
      ).rejects.toThrow('Provider "unknown" not found for type "store"');
    });
  });

  describe('Pipeline Execution', () => {
    beforeEach(() => {
      client.registerGenerator(mockGenerator);
      client.registerTransformProvider(mockTransformProvider);
      client.registerStoreProvider(mockStoreProvider);
    });

    it('should run a simple generate pipeline', async () => {
      const results = await client.run({
        name: 'test-pipeline',
        steps: [
          {
            kind: 'generate',
            generator: 'mock',
            params: { text: 'pipeline' },
            out: 'img1',
          },
        ],
      });

      expect(results).toHaveLength(1);
      expect(results[0].out).toBe('img1');
      expect((results[0].value as ImageBlob).bytes.toString()).toBe('pipeline');
    });

    it('should run a multi-step pipeline', async () => {
      const clientWithDefaults = new Imgflo({
        transform: { default: 'mock-transform' },
        store: { default: 'mock-store' },
      });
      clientWithDefaults.registerGenerator(mockGenerator);
      clientWithDefaults.registerTransformProvider(mockTransformProvider);
      clientWithDefaults.registerStoreProvider(mockStoreProvider);

      const results = await clientWithDefaults.run({
        name: 'multi-step',
        steps: [
          {
            kind: 'generate',
            generator: 'mock',
            params: { text: 'test' },
            out: 'original',
          },
          {
            kind: 'transform',
            in: 'original',
            op: 'resize',
            params: { width: 200 },
            out: 'resized',
          },
          {
            kind: 'upload',
            in: 'resized',
            key: 'output/image.png',
          },
        ],
      });

      expect(results).toHaveLength(3);
      expect(results[0].out).toBe('original');
      expect(results[1].out).toBe('resized');
      expect((results[1].value as ImageBlob).width).toBe(200);
      expect(results[2].out).toBe('output/image.png');
    });

    it('should throw error for invalid transform reference', async () => {
      const clientWithDefaults = new Imgflo({
        transform: { default: 'mock-transform' },
      });
      clientWithDefaults.registerTransformProvider(mockTransformProvider);

      await expect(
        clientWithDefaults.run({
          name: 'invalid',
          steps: [
            {
              kind: 'transform',
              in: 'nonexistent',
              op: 'resize',
              params: {},
              out: 'result',
            },
          ],
        })
      ).rejects.toThrow('Transform step references undefined or invalid variable: nonexistent');
    });

    it('should throw error for invalid upload reference', async () => {
      const clientWithDefaults = new Imgflo({
        store: { default: 'mock-store' },
      });
      clientWithDefaults.registerStoreProvider(mockStoreProvider);

      await expect(
        clientWithDefaults.run({
          name: 'invalid',
          steps: [
            {
              kind: 'upload',
              in: 'nonexistent',
              key: 'test.png',
            },
          ],
        })
      ).rejects.toThrow('Upload step references undefined or invalid variable: nonexistent');
    });
  });
});
