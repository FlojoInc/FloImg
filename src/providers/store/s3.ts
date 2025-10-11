import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { StoreProvider, ImageBlob, UploadResult } from "../../core/types.js";
import { UploadError } from "../../core/errors.js";

export interface S3ProviderConfig {
  /** Provider name (defaults to 's3'). Use different names to register multiple S3-compatible providers. */
  name?: string;
  region: string;
  bucket: string;
  /** AWS credentials */
  credentials?: {
    accessKeyId: string;
    secretAccessKey: string;
    sessionToken?: string;
  };
  /** S3-compatible endpoint (for Cloudflare R2, Tigris, etc.) */
  endpoint?: string;
  /** Custom public URL template. Use {bucket} and {region} placeholders if needed. */
  publicUrl?: string;
}

/**
 * S3 storage provider for uploading images to AWS S3 or S3-compatible services
 *
 * Supports multiple S3-compatible providers (AWS S3, Cloudflare R2, Tigris, Backblaze B2, etc.)
 * by using custom names and endpoints.
 *
 * @example
 * ```typescript
 * // AWS S3
 * const aws = new S3Provider({
 *   name: 'aws',
 *   bucket: 'my-bucket',
 *   region: 'us-east-1'
 * });
 *
 * // Cloudflare R2
 * const r2 = new S3Provider({
 *   name: 'r2',
 *   bucket: 'my-r2-bucket',
 *   region: 'auto',
 *   endpoint: 'https://accountid.r2.cloudflarestorage.com',
 *   credentials: { accessKeyId: '...', secretAccessKey: '...' }
 * });
 * ```
 */
export class S3Provider implements StoreProvider {
  name: string;
  private client: S3Client;
  private bucket: string;
  private region: string;
  private publicUrl?: string;

  constructor(config: S3ProviderConfig) {
    const { name = "s3", region, bucket, credentials, endpoint, publicUrl } = config;

    this.name = name;
    this.bucket = bucket;
    this.region = region;
    this.publicUrl = publicUrl;

    this.client = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      ...(credentials && { credentials }),
    });
  }

  async put(input: {
    key: string;
    blob: ImageBlob;
    headers?: Record<string, string>;
  }): Promise<UploadResult> {
    const { key, blob, headers = {} } = input;

    try {
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: blob.bytes,
        ContentType: blob.mime,
        ...headers,
      });

      const response = await this.client.send(command);

      // Generate public URL
      const url = this.generatePublicUrl(key);

      return {
        key,
        url,
        etag: response.ETag,
        metadata: {
          versionId: response.VersionId,
        },
      };
    } catch (error) {
      throw new UploadError(
        `Failed to upload to S3: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getUrl(key: string): Promise<string> {
    return this.generatePublicUrl(key);
  }

  /**
   * Generate public URL for an uploaded file
   * Supports template variables: {bucket}, {region}, {key}
   */
  private generatePublicUrl(key: string): string {
    if (this.publicUrl) {
      // Support template variables
      return this.publicUrl
        .replace('{bucket}', this.bucket)
        .replace('{region}', this.region)
        .replace('{key}', key)
        + (this.publicUrl.includes('{key}') ? '' : `/${key}`);
    }

    // Default AWS S3 URL format
    return `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
  }
}
