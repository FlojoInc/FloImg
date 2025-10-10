import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import type { StoreProvider, ImageBlob, UploadResult } from "../../core/types.js";
import { UploadError } from "../../core/errors.js";

export interface S3ProviderConfig {
  region: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  publicUrl?: string;
}

/**
 * S3 storage provider for uploading images to AWS S3 or S3-compatible services
 */
export class S3Provider implements StoreProvider {
  name = "s3";
  private client: S3Client;
  private bucket: string;
  private publicUrl?: string;

  constructor(config: S3ProviderConfig) {
    const { region, bucket, accessKeyId, secretAccessKey, endpoint, publicUrl } = config;

    this.bucket = bucket;
    this.publicUrl = publicUrl;

    this.client = new S3Client({
      region,
      ...(endpoint && { endpoint }),
      ...(accessKeyId &&
        secretAccessKey && {
          credentials: {
            accessKeyId,
            secretAccessKey,
          },
        }),
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

      // Generate URL
      const url = this.publicUrl
        ? `${this.publicUrl}/${key}`
        : `https://${this.bucket}.s3.amazonaws.com/${key}`;

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
    if (this.publicUrl) {
      return `${this.publicUrl}/${key}`;
    }
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
}
