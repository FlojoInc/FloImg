import { useCallback, useEffect } from "react";
import { useWorkflowStore } from "../stores/workflowStore";

/**
 * Full-screen lightbox for viewing workflow preview images.
 * Opens when user clicks a preview thumbnail in a node.
 */
export function ImageLightbox() {
  const lightbox = useWorkflowStore((s) => s.imageLightbox);
  const closeLightbox = useWorkflowStore((s) => s.closeImageLightbox);

  // Handle escape key to close
  useEffect(() => {
    if (!lightbox) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeLightbox();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [lightbox, closeLightbox]);

  // Handle download
  const handleDownload = useCallback(() => {
    if (!lightbox) return;

    const link = document.createElement("a");
    link.href = lightbox.src;
    link.download = `${lightbox.nodeName.replace(/[^a-zA-Z0-9]/g, "-")}-output.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [lightbox]);

  // Handle copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!lightbox) return;

    try {
      // For data URLs, we need to convert to blob first
      const response = await fetch(lightbox.src);
      const blob = await response.blob();
      // eslint-disable-next-line no-undef
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
    } catch {
      // Fallback: copy the data URL as text
      await navigator.clipboard.writeText(lightbox.src);
    }
  }, [lightbox]);

  if (!lightbox) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-8"
      onClick={closeLightbox}
    >
      {/* Node name badge at top */}
      <div className="absolute top-6 left-6 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full">
        <span className="text-sm text-white/90 font-medium">{lightbox.nodeName}</span>
      </div>

      {/* Close button at top right */}
      <button
        onClick={closeLightbox}
        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
        title="Close (Esc)"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      {/* Main image - click doesn't close */}
      <div
        className="max-w-[90vw] max-h-[80vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={lightbox.src}
          alt={`Output from ${lightbox.nodeName}`}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>

      {/* Floating controls at bottom */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 bg-zinc-800/90 backdrop-blur-sm rounded-lg shadow-lg p-2"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-teal-600 text-white text-sm font-medium rounded hover:bg-teal-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download
        </button>
        <button
          onClick={handleCopy}
          className="px-4 py-2 border border-zinc-600 text-zinc-200 text-sm font-medium rounded hover:bg-zinc-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy
        </button>
      </div>
    </div>
  );
}
