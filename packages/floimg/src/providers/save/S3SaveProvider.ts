import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import type { SaveProvider, ImageBlob, SaveResult } from "../../core/types.js";

export interface PresignOptions {
  /** Expiry time in seconds (default: 3600 = 1 hour) */
  expiresIn?: number;
}

export interface S3SaveProviderConfig {
  bucket: string;
  region: string;
  endpoint?: string;
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

/**
 * S3 save provider - saves images to AWS S3 or S3-compatible storage
 *
 * Supports:
 * - AWS S3
 * - Hetzner Object Storage
 * - Cloudflare R2
 * - Any S3-compatible service
 */
export default class S3SaveProvider implements SaveProvider {
  name = "s3";
  private s3Client: S3Client;
  private bucket: string;
  private region: string;
  private endpoint?: string;

  constructor(config: S3SaveProviderConfig) {
    this.bucket = config.bucket;
    this.region = config.region;
    this.endpoint = config.endpoint;
    this.s3Client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      credentials: config.credentials,
      forcePathStyle: !!config.endpoint, // Required for S3-compatible services
    });
  }

  async save(input: {
    blob: ImageBlob;
    path: string;
    headers?: Record<string, string>;
    metadata?: Record<string, unknown>;
  }): Promise<SaveResult> {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: input.path,
      Body: input.blob.bytes,
      ContentType: input.blob.mime,
      ...(input.headers && { Metadata: input.headers }),
    });

    const result = await this.s3Client.send(command);

    const url = this.getPublicUrl(input.path);

    return {
      provider: "s3",
      location: url,
      size: input.blob.bytes.length,
      mime: input.blob.mime,
      metadata: {
        etag: result.ETag,
        bucket: this.bucket,
        key: input.path,
      },
    };
  }

  /**
   * Generate a presigned URL for temporary access to a private object
   *
   * @param key - The S3 object key (path)
   * @param options - Presign options (expiry time)
   * @returns Presigned URL string
   *
   * @example
   * ```typescript
   * const provider = new S3SaveProvider({ bucket: 'my-bucket', region: 'us-east-1' });
   * const url = await provider.getPresignedUrl('images/photo.png', { expiresIn: 3600 });
   * // Returns: https://my-bucket.s3.us-east-1.amazonaws.com/images/photo.png?X-Amz-...
   * ```
   */
  async getPresignedUrl(key: string, options?: PresignOptions): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    const expiresIn = options?.expiresIn ?? 3600; // Default 1 hour

    return getSignedUrl(this.s3Client, command, { expiresIn });
  }

  /**
   * Get the public URL for an object (assumes bucket is publicly readable)
   *
   * @param key - The S3 object key (path)
   * @returns Public URL string
   */
  getPublicUrl(key: string): string {
    if (this.endpoint) {
      // S3-compatible service (Hetzner, R2, etc.)
      // Format: https://endpoint/bucket/key
      return `${this.endpoint}/${this.bucket}/${key}`;
    }
    // AWS S3
    // Format: https://bucket.s3.region.amazonaws.com/key
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }

  /**
   * Get the bucket name
   */
  getBucket(): string {
    return this.bucket;
  }
}
