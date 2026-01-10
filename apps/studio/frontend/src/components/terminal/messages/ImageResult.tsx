import { getImageUrl } from "../../../api/client";

interface ImageResultProps {
  imageIds?: string[];
  imageUrls?: string[];
  previews?: Record<string, string>;
}

export function ImageResult({ imageIds = [], imageUrls = [], previews = {} }: ImageResultProps) {
  // Use imageUrls if available (cloud), otherwise use imageIds with getImageUrl
  const urls = imageUrls.length > 0 ? imageUrls : imageIds.map((id) => getImageUrl(id));

  // Get preview data URLs if available
  const previewUrls = Object.values(previews);

  if (urls.length === 0 && previewUrls.length === 0) {
    return (
      <div className="flex justify-start">
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg px-4 py-3 text-zinc-400 text-sm">
          No images generated.
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="max-w-[90%]">
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-lg p-3">
          {/* Success header */}
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-zinc-300 text-sm font-medium">
              Generated {urls.length} image{urls.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Image grid */}
          <div
            className={`grid gap-2 ${
              urls.length === 1
                ? "grid-cols-1"
                : urls.length === 2
                  ? "grid-cols-2"
                  : "grid-cols-2 sm:grid-cols-3"
            }`}
          >
            {urls.map((url, idx) => (
              <a
                key={idx}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="group relative aspect-square bg-zinc-900 rounded-lg overflow-hidden border border-zinc-700 hover:border-teal-500 transition-colors"
              >
                <img
                  src={previewUrls[idx] || url}
                  alt={`Generated image ${idx + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </div>
              </a>
            ))}
          </div>

          {/* View in Gallery hint */}
          <p className="mt-2 text-xs text-zinc-500">
            Click to open full size. Images saved to Gallery.
          </p>
        </div>
      </div>
    </div>
  );
}
