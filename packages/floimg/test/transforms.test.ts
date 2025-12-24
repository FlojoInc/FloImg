import { describe, it, expect, beforeEach } from "vitest";
import { FloImg } from "../src/core/client.js";
import { SharpTransformProvider } from "../src/providers/transform/sharp.js";
import type { ImageBlob } from "../src/core/types.js";

describe("Transform Operations - v0.3.0", () => {
  let client: FloImg;
  let testBlob: ImageBlob;

  beforeEach(() => {
    client = new FloImg({
      transform: { default: "sharp" },
    });
    client.registerTransformProvider(new SharpTransformProvider());

    // Create a simple test image (1x1 white pixel PNG)
    testBlob = {
      bytes: Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44,
        0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
        0x77, 0x53, 0xde, 0x00, 0x00, 0x00, 0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8,
        0xff, 0xff, 0x3f, 0x00, 0x05, 0xfe, 0x02, 0xfe, 0xdc, 0xcc, 0x59, 0xe7, 0x00, 0x00, 0x00,
        0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
      ]),
      mime: "image/png",
      width: 1,
      height: 1,
    };
  });

  describe("Filter Operations", () => {
    it("should apply blur filter", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "blur",
        params: { sigma: 5 },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.mime).toBe("image/png");
    });

    it("should apply sharpen filter", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "sharpen",
        params: { sigma: 1 },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should convert to grayscale", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "grayscale",
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should negate colors", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "negate",
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should normalize contrast", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "normalize",
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should apply threshold", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "threshold",
        params: { value: 128 },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should modulate colors", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "modulate",
        params: {
          brightness: 1.2,
          saturation: 1.3,
          hue: 180,
        },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should apply tint", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "tint",
        params: {
          color: { r: 255, g: 240, b: 200 },
        },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });
  });

  describe("Border & Frame Operations", () => {
    it("should add borders with extend", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "extend",
        params: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10,
          background: "#ffffff",
        },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.width).toBeGreaterThan(testBlob.width!);
    });

    it("should extract a region", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "extract",
        params: {
          left: 0,
          top: 0,
          width: 1,
          height: 1,
        },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should round corners", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "roundCorners",
        params: { radius: 10 },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });
  });

  describe("Text Operations", () => {
    it("should add text to image", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "addText",
        params: {
          text: "Hello World",
          x: 10,
          y: 10,
          size: 24,
          color: "#000000",
        },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.mime).toBe("image/png");
    });

    it("should add caption to image", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "addCaption",
        params: {
          text: "Test Caption",
          position: "bottom",
        },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
      expect(result.height).toBeGreaterThan(testBlob.height!);
    });
  });

  describe("Preset Filters", () => {
    it("should apply vintage preset", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "preset",
        params: { name: "vintage" },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should apply vibrant preset", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "preset",
        params: { name: "vibrant" },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should apply blackAndWhite preset", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "preset",
        params: { name: "blackAndWhite" },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should apply dramatic preset", async () => {
      const result = await client.transform({
        blob: testBlob,
        op: "preset",
        params: { name: "dramatic" },
      });

      expect(result).toBeDefined();
      expect(result.bytes).toBeInstanceOf(Buffer);
    });

    it("should throw error for unknown preset", async () => {
      await expect(
        client.transform({
          blob: testBlob,
          op: "preset",
          params: { name: "nonexistent" },
        })
      ).rejects.toThrow("Unknown preset");
    });
  });

  describe("Operation Chaining", () => {
    it("should chain multiple operations", async () => {
      // Apply blur
      const blurred = await client.transform({
        blob: testBlob,
        op: "blur",
        params: { sigma: 2 },
      });

      // Then add text
      const withText = await client.transform({
        blob: blurred,
        op: "addText",
        params: {
          text: "Test",
          x: 10,
          y: 10,
        },
      });

      expect(withText).toBeDefined();
      expect(withText.bytes).toBeInstanceOf(Buffer);
    });

    it("should apply preset then add caption", async () => {
      // Apply vintage filter
      const vintage = await client.transform({
        blob: testBlob,
        op: "preset",
        params: { name: "vintage" },
      });

      // Add caption
      const final = await client.transform({
        blob: vintage,
        op: "addCaption",
        params: {
          text: "Vintage Photo",
          position: "bottom",
        },
      });

      expect(final).toBeDefined();
      expect(final.bytes).toBeInstanceOf(Buffer);
    });
  });
});
