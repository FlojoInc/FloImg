import type { ExecutionRun } from "../stores/workflowStore";

/**
 * Export execution runs to a ZIP file
 * Uses JSZip for ZIP creation (client-side, no server needed)
 */
export async function exportRuns(runs: ExecutionRun[]): Promise<void> {
  // Dynamically import JSZip to avoid bundling if not used
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  // Create summary metadata
  const summary = {
    exportedAt: new Date().toISOString(),
    runCount: runs.length,
    runs: runs.map((run) => ({
      id: run.id,
      timestamp: run.timestamp,
      status: run.status,
      duration: run.duration,
      nodeCount: run.nodeCount,
      outputCount: run.outputs.length,
      error: run.error,
    })),
  };
  zip.file("summary.json", JSON.stringify(summary, null, 2));

  // Add each run's data
  for (const run of runs) {
    const runFolder = zip.folder(`run-${run.id}`);
    if (!runFolder) continue;

    // Run metadata
    const metadata = {
      id: run.id,
      timestamp: run.timestamp,
      timestampFormatted: new Date(run.timestamp).toISOString(),
      status: run.status,
      duration: run.duration,
      durationFormatted: formatDuration(run.duration),
      nodeCount: run.nodeCount,
      error: run.error,
      errorNodeId: run.errorNodeId,
      outputs: run.outputs.map((o) => ({
        nodeId: o.nodeId,
        nodeName: o.nodeName,
        imageId: o.imageId,
      })),
    };
    runFolder.file("metadata.json", JSON.stringify(metadata, null, 2));

    // Export output images
    for (let i = 0; i < run.outputs.length; i++) {
      const output = run.outputs[i];
      const imageData = await dataUrlToBlob(output.preview);
      if (imageData) {
        const ext = getExtensionFromMime(imageData.type);
        runFolder.file(`output-${i + 1}-${output.nodeName}.${ext}`, imageData);
      }
    }
  }

  // Generate and download ZIP
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, `floimg-history-${formatDate(new Date())}.zip`);
}

/**
 * Export a single run
 */
export async function exportSingleRun(run: ExecutionRun): Promise<void> {
  return exportRuns([run]);
}

/**
 * Convert data URL to Blob
 */
async function dataUrlToBlob(dataUrl: string): Promise<Blob | null> {
  try {
    const response = await fetch(dataUrl);
    return response.blob();
  } catch {
    return null;
  }
}

/**
 * Get file extension from MIME type
 */
function getExtensionFromMime(mime: string): string {
  const mimeToExt: Record<string, string> = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/gif": "gif",
  };
  return mimeToExt[mime] || "png";
}

/**
 * Format duration in human readable form
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
}

/**
 * Format date for filename
 */
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Download blob as file
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
