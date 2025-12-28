import { describe, it, expect, vi, beforeEach } from "vitest";
import S3SaveProvider from "../src/providers/save/S3SaveProvider.js";
import type { ImageBlob } from "../src/core/types.js";

// Mock the AWS SDK
vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn().mockImplementation(() => ({
    send: vi.fn().mockResolvedValue({ ETag: '"mock-etag"' }),
  })),
  PutObjectCommand: vi.fn().mockImplementation((params) => params),
  GetObjectCommand: vi.fn().mockImplementation((params) => params),
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: vi
    .fn()
    .mockResolvedValue(
      "https://test-bucket.s3.us-east-1.amazonaws.com/test-key?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=..."
    ),
}));

describe("S3SaveProvider", () => {
  let provider: S3SaveProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new S3SaveProvider({
      bucket: "test-bucket",
      region: "us-east-1",
      credentials: {
        accessKeyId: "test-key",
        secretAccessKey: "test-secret",
      },
    });
  });

  describe("constructor", () => {
    it("creates provider with AWS S3 config", () => {
      expect(provider.name).toBe("s3");
      expect(provider.getBucket()).toBe("test-bucket");
    });

    it("creates provider with S3-compatible endpoint", () => {
      const hetznerProvider = new S3SaveProvider({
        bucket: "my-bucket",
        region: "eu-central",
        endpoint: "https://fsn1.your-objectstorage.com",
        credentials: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
        },
      });
      expect(hetznerProvider.name).toBe("s3");
      expect(hetznerProvider.getBucket()).toBe("my-bucket");
    });
  });

  describe("getPublicUrl", () => {
    it("generates AWS S3 URL format", () => {
      const url = provider.getPublicUrl("images/photo.png");
      expect(url).toBe("https://test-bucket.s3.us-east-1.amazonaws.com/images/photo.png");
    });

    it("generates S3-compatible URL format with custom endpoint", () => {
      const hetznerProvider = new S3SaveProvider({
        bucket: "my-bucket",
        region: "eu-central",
        endpoint: "https://fsn1.your-objectstorage.com",
      });
      const url = hetznerProvider.getPublicUrl("images/photo.png");
      expect(url).toBe("https://fsn1.your-objectstorage.com/my-bucket/images/photo.png");
    });

    it("handles keys with special characters", () => {
      const url = provider.getPublicUrl("users/123/images/my photo.png");
      expect(url).toBe(
        "https://test-bucket.s3.us-east-1.amazonaws.com/users/123/images/my photo.png"
      );
    });
  });

  describe("getPresignedUrl", () => {
    it("generates presigned URL with default expiry", async () => {
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      const url = await provider.getPresignedUrl("images/photo.png");

      expect(url).toContain("X-Amz-Algorithm");
      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "images/photo.png",
        }),
        { expiresIn: 3600 }
      );
    });

    it("generates presigned URL with custom expiry", async () => {
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      await provider.getPresignedUrl("images/photo.png", { expiresIn: 7200 });

      expect(getSignedUrl).toHaveBeenCalledWith(expect.anything(), expect.anything(), {
        expiresIn: 7200,
      });
    });

    it("generates presigned URL for nested paths", async () => {
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");

      await provider.getPresignedUrl("users/123/images/photo.png");

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "users/123/images/photo.png",
        }),
        expect.anything()
      );
    });
  });

  describe("save", () => {
    it("saves image and returns result with public URL", async () => {
      const blob: ImageBlob = {
        bytes: Buffer.from("test-image-data"),
        mime: "image/png",
        width: 100,
        height: 100,
      };

      const result = await provider.save({
        blob,
        path: "images/photo.png",
      });

      expect(result).toEqual({
        provider: "s3",
        location: "https://test-bucket.s3.us-east-1.amazonaws.com/images/photo.png",
        size: blob.bytes.length,
        mime: "image/png",
        metadata: {
          etag: '"mock-etag"',
          bucket: "test-bucket",
          key: "images/photo.png",
        },
      });
    });

    it("includes metadata in upload when provided", async () => {
      const { PutObjectCommand } = await import("@aws-sdk/client-s3");

      const blob: ImageBlob = {
        bytes: Buffer.from("test-image-data"),
        mime: "image/jpeg",
      };

      await provider.save({
        blob,
        path: "images/photo.jpg",
        headers: {
          "x-custom-header": "value",
        },
      });

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: "test-bucket",
          Key: "images/photo.jpg",
          ContentType: "image/jpeg",
          Metadata: {
            "x-custom-header": "value",
          },
        })
      );
    });
  });

  describe("S3-compatible services", () => {
    it("works with Hetzner Object Storage", async () => {
      const hetznerProvider = new S3SaveProvider({
        bucket: "floimg-storage",
        region: "eu-central",
        endpoint: "https://fsn1.your-objectstorage.com",
        credentials: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
        },
      });

      const url = hetznerProvider.getPublicUrl("users/123/image.png");
      expect(url).toBe("https://fsn1.your-objectstorage.com/floimg-storage/users/123/image.png");
    });

    it("works with Cloudflare R2", async () => {
      const r2Provider = new S3SaveProvider({
        bucket: "my-r2-bucket",
        region: "auto",
        endpoint: "https://account-id.r2.cloudflarestorage.com",
        credentials: {
          accessKeyId: "test-key",
          secretAccessKey: "test-secret",
        },
      });

      const url = r2Provider.getPublicUrl("assets/logo.png");
      expect(url).toBe("https://account-id.r2.cloudflarestorage.com/my-r2-bucket/assets/logo.png");
    });
  });
});
