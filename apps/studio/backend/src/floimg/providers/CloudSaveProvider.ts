/**
 * CloudSaveProvider - Saves images to FloImg Cloud storage
 *
 * This provider is dynamically registered when running in cloud context.
 * It implements the standard SaveProvider interface and works by:
 * 1. Getting a presigned upload URL from the cloud API
 * 2. Uploading directly to object storage
 * 3. Confirming the upload to record in the database
 */

import type { SaveProvider, ImageBlob, SaveResult, MimeType } from "@teamflojo/floimg";

export interface CloudConfig {
  enabled: boolean;
  userId: string;
  apiBaseUrl: string;
  authToken: string;
}

interface UploadUrlResponse {
  uploadUrl: string;
  imageId: string;
  storageKey: string;
  expiresIn: number;
}

interface ConfirmUploadResponse {
  success: boolean;
  imageId: string;
  quota: {
    used: number;
    limit: number;
    remaining: number;
  };
}

interface ErrorResponse {
  error: string;
  quota?: {
    used: number;
    limit: number;
    remaining: number;
    required?: number;
  };
}

export class CloudSaveProvider implements SaveProvider {
  name = "floimg-cloud";

  constructor(
    private userId: string,
    private apiBaseUrl: string,
    private authToken: string
  ) {}

  async save(input: { blob: ImageBlob; path: string }): Promise<SaveResult> {
    const { blob, path } = input;

    // Extract filename from path or generate one
    const filename = path.split("/").pop() || `image_${Date.now()}.${this.getExtension(blob.mime)}`;

    // Step 1: Get presigned upload URL
    const uploadUrlResponse = await this.getUploadUrl(filename, blob.mime, blob.bytes.length);

    // Step 2: Upload directly to object storage
    await this.uploadToStorage(uploadUrlResponse.uploadUrl, blob);

    // Step 3: Confirm upload
    const confirmResponse = await this.confirmUpload(
      uploadUrlResponse.imageId,
      uploadUrlResponse.storageKey,
      filename,
      blob.mime,
      blob.bytes.length,
      blob.width,
      blob.height
    );

    // Return SaveResult
    return {
      provider: this.name,
      location: `${this.apiBaseUrl}/storage/download-url/${confirmResponse.imageId}`,
      size: blob.bytes.length,
      mime: blob.mime,
      metadata: {
        imageId: confirmResponse.imageId,
        quota: confirmResponse.quota,
      },
    };
  }

  private async getUploadUrl(
    filename: string,
    mimeType: MimeType,
    sizeBytes: number
  ): Promise<UploadUrlResponse> {
    const response = await fetch(`${this.apiBaseUrl}/api/storage/upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({ filename, mimeType, sizeBytes }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      if (response.status === 403 && error.quota) {
        throw new Error(
          `Storage quota exceeded. Used: ${this.formatBytes(error.quota.used)}, ` +
            `Limit: ${this.formatBytes(error.quota.limit)}. ` +
            `Upgrade your plan for more storage.`
        );
      }
      throw new Error(`Failed to get upload URL: ${error.error}`);
    }

    return response.json() as Promise<UploadUrlResponse>;
  }

  private async uploadToStorage(uploadUrl: string, blob: ImageBlob): Promise<void> {
    // Convert Buffer to Uint8Array for fetch compatibility
    const body = new Uint8Array(blob.bytes);

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": blob.mime,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload to storage: ${response.status} ${response.statusText}`);
    }
  }

  private async confirmUpload(
    imageId: string,
    storageKey: string,
    filename: string,
    mimeType: MimeType,
    sizeBytes: number,
    width?: number,
    height?: number
  ): Promise<ConfirmUploadResponse> {
    const response = await fetch(`${this.apiBaseUrl}/api/storage/confirm-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.authToken}`,
      },
      body: JSON.stringify({
        imageId,
        storageKey,
        filename,
        mimeType,
        sizeBytes,
        width,
        height,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as ErrorResponse;
      throw new Error(`Failed to confirm upload: ${error.error}`);
    }

    return response.json() as Promise<ConfirmUploadResponse>;
  }

  private getExtension(mime: MimeType): string {
    const extensions: Record<MimeType, string> = {
      "image/png": "png",
      "image/jpeg": "jpg",
      "image/webp": "webp",
      "image/avif": "avif",
      "image/svg+xml": "svg",
    };
    return extensions[mime] || "png";
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
