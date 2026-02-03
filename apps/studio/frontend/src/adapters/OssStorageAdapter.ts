/**
 * OSS Storage Adapter
 *
 * Implements StorageAdapter for OSS deployments using local filesystem.
 * Uses the /api/uploads endpoints in apps/studio/backend.
 */

import type { StorageAdapter, UploadResult } from "@teamflojo/floimg-studio-shared";

const API_BASE = "/api";

export class OssStorageAdapter implements StorageAdapter {
  async upload(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE}/uploads`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return {
      reference: result.id,
      filename: result.filename,
      mime: result.mime,
      size: result.size,
    };
  }

  getPreviewUrl(reference: string): string {
    return `${API_BASE}/uploads/${reference}/blob`;
  }

  async delete(reference: string): Promise<void> {
    const response = await fetch(`${API_BASE}/uploads/${reference}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`Failed to delete upload: ${response.status}`);
    }
  }
}

/** Singleton instance for OSS deployments */
export const ossStorageAdapter = new OssStorageAdapter();
