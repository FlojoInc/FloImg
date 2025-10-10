import { writeFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import type { StoreProvider, ImageBlob, UploadResult } from "../../core/types.js";
import { UploadError } from "../../core/errors.js";

export interface FsProviderConfig {
  basePath: string;
  baseUrl?: string;
}

/**
 * Filesystem storage provider for saving images locally
 */
export class FsProvider implements StoreProvider {
  name = "fs";
  private basePath: string;
  private baseUrl?: string;

  constructor(config: FsProviderConfig) {
    this.basePath = config.basePath;
    this.baseUrl = config.baseUrl;
  }

  async put(input: {
    key: string;
    blob: ImageBlob;
  }): Promise<UploadResult> {
    const { key, blob } = input;

    try {
      const fullPath = join(this.basePath, key);
      const dir = dirname(fullPath);

      // Ensure directory exists
      await mkdir(dir, { recursive: true });

      // Write file
      await writeFile(fullPath, blob.bytes);

      const url = this.baseUrl ? `${this.baseUrl}/${key}` : `file://${fullPath}`;

      return {
        key,
        url,
      };
    } catch (error) {
      throw new UploadError(
        `Failed to write to filesystem: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async getUrl(key: string): Promise<string> {
    if (this.baseUrl) {
      return `${this.baseUrl}/${key}`;
    }
    const fullPath = join(this.basePath, key);
    return `file://${fullPath}`;
  }
}
