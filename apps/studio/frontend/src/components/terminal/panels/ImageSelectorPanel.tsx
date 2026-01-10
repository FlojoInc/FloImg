import { useQuery } from "@tanstack/react-query";
import { listImages, getImageUrl } from "../../../api/client";

interface ImageInfo {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
}

interface ImageSelectorPanelProps {
  onSelect: (image: { id: string; filename: string }) => void;
  onClose: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImageSelectorPanel({ onSelect, onClose }: ImageSelectorPanelProps) {
  const {
    data: images,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["images"],
    queryFn: listImages,
  });

  return (
    <div className="w-80 bg-zinc-900 border-l border-zinc-800 flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
        <h3 className="text-zinc-200 font-medium text-sm">Select Image</h3>
        <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition-colors">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Image list */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="text-center py-8">
            <svg
              className="w-6 h-6 text-zinc-600 animate-spin mx-auto"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <p className="text-zinc-500 text-sm mt-2">Loading images...</p>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-400 text-sm">Failed to load images</div>
        ) : !images || images.length === 0 ? (
          <div className="text-center py-8 text-zinc-500 text-sm">No images generated yet</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {images.map((image: ImageInfo) => (
              <button
                key={image.id}
                onClick={() => onSelect({ id: image.id, filename: image.filename })}
                className="group relative aspect-square bg-zinc-800 rounded-lg overflow-hidden border border-zinc-700 hover:border-teal-500 transition-colors"
              >
                <img
                  src={getImageUrl(image.id)}
                  alt={image.filename}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2">
                  <svg
                    className="w-5 h-5 text-white mb-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-white text-xs">Select</span>
                </div>
                {/* Image info overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                  <p className="text-white text-xs truncate">{image.filename}</p>
                  <p className="text-zinc-400 text-[10px]">{formatFileSize(image.size)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-zinc-800">
        <p className="text-zinc-600 text-xs">Click an image to select it</p>
      </div>
    </div>
  );
}
