import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listImages, getImageUrl, getImageWorkflow, type ImageInfo } from "../api/client";
import { useWorkflowStore } from "../stores/workflowStore";
import type { Template } from "@teamflojo/floimg-studio-shared";

export function Gallery() {
  const loadTemplate = useWorkflowStore((s) => s.loadTemplate);
  const [loadingWorkflow, setLoadingWorkflow] = useState<string | null>(null);

  const {
    data: images,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["images"],
    queryFn: listImages,
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const handleLoadWorkflow = async (imageId: string) => {
    setLoadingWorkflow(imageId);
    try {
      const metadata = await getImageWorkflow(imageId);
      if (metadata?.workflow) {
        // Convert to Template format for loading
        const template: Template = {
          id: `image-${imageId}`,
          name: `Workflow from ${imageId}`,
          description: "Loaded from gallery image",
          category: "Utilities",
          generator: "unknown",
          workflow: {
            nodes: metadata.workflow.nodes,
            edges: metadata.workflow.edges,
          },
        };
        loadTemplate(template);
        // Navigate to editor tab (parent handles this via URL or state)
        window.dispatchEvent(new CustomEvent("workflow-loaded"));
      } else {
        alert("No workflow metadata available for this image");
      }
    } catch (err) {
      console.error("Failed to load workflow:", err);
      alert("Failed to load workflow");
    } finally {
      setLoadingWorkflow(null);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-zinc-400">Loading images...</div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-500 dark:text-red-400">
        Error loading images: {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }

  if (!images || images.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-zinc-400">
        <div className="text-lg mb-2">No images yet</div>
        <div className="text-sm">Create a workflow and click Execute to generate images</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 dark:bg-zinc-900 min-h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            Images ({images.length})
          </h2>
          <p className="text-xs text-gray-500 dark:text-zinc-500">Your generated images</p>
        </div>
        <button
          onClick={() => refetch()}
          className="text-sm text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-violet-300"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((image) => (
          <ImageCard
            key={image.id}
            image={image}
            onLoadWorkflow={() => handleLoadWorkflow(image.id)}
            isLoading={loadingWorkflow === image.id}
          />
        ))}
      </div>
    </div>
  );
}

interface ImageCardProps {
  image: ImageInfo;
  onLoadWorkflow: () => void;
  isLoading: boolean;
}

function ImageCard({ image, onLoadWorkflow, isLoading }: ImageCardProps) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
      <div className="relative">
        <a
          href={getImageUrl(image.id)}
          target="_blank"
          rel="noopener noreferrer"
          className="block aspect-square bg-gray-100 dark:bg-zinc-900"
        >
          <img
            src={getImageUrl(image.id)}
            alt={image.filename}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </a>
        {/* Hover overlay with action buttons */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              onLoadWorkflow();
            }}
            disabled={isLoading}
            className="px-3 py-1.5 bg-teal-600 text-white text-sm rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            {isLoading ? "Loading..." : "Load Workflow"}
          </button>
          <a
            href={getImageUrl(image.id)}
            download={image.filename}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 bg-zinc-700 text-white rounded-lg hover:bg-zinc-600"
            title="Download image"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
          </a>
        </div>
      </div>
      <div className="p-3">
        <div className="text-sm font-medium text-gray-800 dark:text-white truncate">
          {image.filename}
        </div>
        <div className="text-xs text-gray-500 dark:text-zinc-400 mt-1">
          {image.mime} • {formatSize(image.size)}
        </div>
        <div className="text-xs text-gray-400 dark:text-zinc-500 mt-1">
          {formatDate(image.createdAt)}
        </div>
      </div>
    </div>
  );
}
