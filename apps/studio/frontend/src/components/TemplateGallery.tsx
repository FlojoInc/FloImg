import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Template } from "@teamflojo/floimg-studio-shared";
import seedTemplates from "../data/seed-templates.json";

// Default API URL - can be overridden via props or environment variable
const DEFAULT_API_URL = import.meta.env.VITE_FLOIMG_API_URL || "https://api.floimg.com";

interface TemplateGalleryProps {
  onSelect: (templateId: string) => void;
  apiUrl?: string;
}

/**
 * Fetch templates from API with fallback chain:
 * 1. Try API fetch first
 * 2. Fall back to localStorage cache (persisted from previous fetch)
 * 3. Fall back to seed data bundled in the app (cold start, air-gapped)
 */
async function fetchTemplates(apiUrl: string): Promise<Template[]> {
  const cacheKey = "floimg-templates-cache";

  try {
    const res = await fetch(`${apiUrl}/api/templates`);
    if (res.ok) {
      const data = await res.json();
      const templates = data.templates as Template[];
      // Cache successful response for offline fallback
      try {
        localStorage.setItem(cacheKey, JSON.stringify(templates));
      } catch {
        // localStorage might be full or unavailable
      }
      return templates;
    }
    throw new Error(`API returned ${res.status}`);
  } catch {
    // Try localStorage cache
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        return JSON.parse(cached) as Template[];
      }
    } catch {
      // localStorage not available
    }
    // Fall back to seed data
    return seedTemplates as Template[];
  }
}

export function TemplateGallery({ onSelect, apiUrl = DEFAULT_API_URL }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: templates = seedTemplates as Template[], isLoading } = useQuery({
    queryKey: ["templates", apiUrl],
    queryFn: () => fetchTemplates(apiUrl),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
    placeholderData: seedTemplates as Template[],
    retry: 1,
  });

  // Extract unique categories from templates
  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats).sort();
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templates;

    // Filter by category
    if (selectedCategory) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.generator.toLowerCase().includes(q) ||
          t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    }

    return result;
  }, [templates, selectedCategory, searchQuery]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Templates</h2>
        <p className="text-gray-600 dark:text-zinc-400">
          Start with a pre-built workflow. Click any template to load it into the editor.
        </p>
      </div>

      {/* Search and filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-zinc-600 rounded-lg bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent w-64"
        />

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === null
                ? "bg-teal-600 text-white"
                : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? "bg-teal-600 text-white"
                  : "bg-gray-200 dark:bg-zinc-700 text-gray-700 dark:text-zinc-300 hover:bg-gray-300 dark:hover:bg-zinc-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && templates.length === 0 && (
        <div className="text-center py-12 text-gray-500 dark:text-zinc-400">
          Loading templates...
        </div>
      )}

      {/* Template grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 text-gray-500 dark:text-zinc-400">
          No templates found matching your criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={() => onSelect(template.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
}

function TemplateCard({ template, onSelect }: TemplateCardProps) {
  const nodeCount = template.nodeCount || template.workflow.nodes.length;
  const edgeCount = template.workflow.edges.length;

  // Generator badge colors
  const generatorColors: Record<string, string> = {
    quickchart: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    mermaid: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
    qr: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    d3: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    openai: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  };

  return (
    <div className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg transition-shadow">
      {/* Preview area */}
      <div className="aspect-video bg-gray-100 dark:bg-zinc-900 flex items-center justify-center p-4">
        {template.preview ? (
          <img
            src={template.preview.imageUrl}
            alt={template.name}
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <div className="text-center text-gray-400 dark:text-zinc-500">
            <svg
              className="w-12 h-12 mx-auto mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-sm">No preview</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{template.name}</h3>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium ${
              generatorColors[template.generator] ||
              "bg-gray-100 text-gray-800 dark:bg-zinc-700 dark:text-zinc-300"
            }`}
          >
            {template.generator}
          </span>
        </div>

        <p className="text-sm text-gray-600 dark:text-zinc-400 mb-3">{template.description}</p>

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-zinc-500 mb-4">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h7"
              />
            </svg>
            {nodeCount} node{nodeCount !== 1 ? "s" : ""}
          </span>
          {edgeCount > 0 && (
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              {edgeCount} edge{edgeCount !== 1 ? "s" : ""}
            </span>
          )}
          {template.requiresCloud && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
              Cloud
            </span>
          )}
        </div>

        {/* Tags */}
        {template.tags && template.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {template.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 dark:bg-zinc-700 text-gray-600 dark:text-zinc-400 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Action button */}
        <button
          onClick={onSelect}
          className="w-full py-2 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium transition-colors"
        >
          Use Template
        </button>
      </div>
    </div>
  );
}
