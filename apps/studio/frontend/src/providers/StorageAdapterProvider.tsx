/**
 * Storage Adapter Provider
 *
 * Provides storage adapter for Input node uploads via React Context.
 * Different deployments provide their own implementations:
 * - OSS: OssStorageAdapter (local filesystem)
 * - FSC: CloudStorageAdapter (S3 via presigned URLs)
 */

import { createContext, useContext, type ReactNode } from "react";
import type { StorageAdapter } from "@teamflojo/floimg-studio-shared";

const StorageAdapterContext = createContext<StorageAdapter | null>(null);

interface StorageAdapterProviderProps {
  adapter: StorageAdapter;
  children: ReactNode;
}

export function StorageAdapterProvider({ adapter, children }: StorageAdapterProviderProps) {
  return (
    <StorageAdapterContext.Provider value={adapter}>{children}</StorageAdapterContext.Provider>
  );
}

/**
 * Get the storage adapter from context.
 * Returns null if no provider - allows graceful fallback.
 */
export function useStorageAdapter(): StorageAdapter | null {
  return useContext(StorageAdapterContext);
}

/**
 * Get the storage adapter, throwing if not available.
 * Use when storage is required.
 */
export function useRequiredStorageAdapter(): StorageAdapter {
  const adapter = useContext(StorageAdapterContext);
  if (!adapter) {
    throw new Error("useRequiredStorageAdapter must be used within StorageAdapterProvider");
  }
  return adapter;
}
