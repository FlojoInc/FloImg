import { useState, useCallback, type DragEvent } from "react";
import { importYaml, validateYaml } from "../api/client";
import type { StudioNode, StudioEdge } from "@teamflojo/floimg-studio-shared";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (nodes: StudioNode[], edges: StudioEdge[], name?: string) => void;
}

interface ValidationError {
  message: string;
  line?: number;
  column?: number;
}

export function ImportModal({ isOpen, onClose, onImport }: ImportModalProps) {
  const [yamlContent, setYamlContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ValidationError | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleImport = useCallback(async () => {
    if (!yamlContent.trim()) {
      setError({ message: "Please enter or paste YAML content" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await importYaml(yamlContent);

      if (result.success) {
        onImport(result.nodes, result.edges, result.name);
        setYamlContent("");
        onClose();
      } else {
        setError({
          message: result.error || "Import failed",
          line: result.line,
          column: result.column,
        });
      }
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Import failed" });
    } finally {
      setIsLoading(false);
    }
  }, [yamlContent, onImport, onClose]);

  const handleValidate = useCallback(async () => {
    if (!yamlContent.trim()) {
      setError({ message: "Please enter or paste YAML content" });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await validateYaml(yamlContent);

      if (result.valid) {
        setError(null);
        // Show success briefly
        setError({ message: "Valid YAML!" });
        setTimeout(() => setError(null), 2000);
      } else if (result.errors.length > 0) {
        setError(result.errors[0]);
      }
    } catch (err) {
      setError({ message: err instanceof Error ? err.message : "Validation failed" });
    } finally {
      setIsLoading(false);
    }
  }, [yamlContent]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.name.endsWith(".yaml") && !file.name.endsWith(".yml")) {
      setError({ message: "Please upload a .yaml or .yml file" });
      return;
    }

    try {
      const text = await file.text();
      setYamlContent(text);
      setError(null);
    } catch {
      setError({ message: "Failed to read file" });
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Workflow</h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex-1 overflow-auto">
          <p className="text-sm text-gray-600 dark:text-zinc-400 mb-4">
            Paste YAML content or drag and drop a .yaml file to import a workflow.
          </p>

          {/* File drop zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-4 mb-4 text-center transition-colors ${
              isDragging
                ? "border-teal-500 bg-teal-50 dark:bg-teal-900/20"
                : "border-gray-300 dark:border-zinc-600"
            }`}
          >
            <input
              type="file"
              accept=".yaml,.yml"
              onChange={handleFileInputChange}
              className="hidden"
              id="yaml-file-input"
            />
            <label
              htmlFor="yaml-file-input"
              className="cursor-pointer text-sm text-gray-600 dark:text-zinc-400"
            >
              <svg
                className="h-8 w-8 mx-auto mb-2 text-gray-400 dark:text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span className="text-teal-600 dark:text-teal-400 hover:underline">
                Click to upload
              </span>{" "}
              or drag and drop
              <br />
              <span className="text-xs">.yaml or .yml files</span>
            </label>
          </div>

          {/* YAML textarea */}
          <textarea
            value={yamlContent}
            onChange={(e) => {
              setYamlContent(e.target.value);
              setError(null);
            }}
            placeholder={`name: My Workflow
steps:
  - kind: generate
    generator: quickchart
    params:
      type: bar
      data:
        labels: [Q1, Q2, Q3, Q4]
        datasets:
          - label: Revenue
            data: [12, 19, 8, 15]
    out: v0

  - kind: transform
    op: resize
    in: v0
    params:
      width: 800
    out: v1`}
            className="w-full h-64 p-3 font-mono text-sm bg-gray-100 dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800 dark:text-zinc-200"
          />

          {/* Error/Success message */}
          {error && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                error.message === "Valid YAML!"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
              }`}
            >
              <span className="font-medium">{error.message}</span>
              {error.line && (
                <span className="ml-2 text-xs">
                  (line {error.line}
                  {error.column ? `, column ${error.column}` : ""})
                </span>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            Use with floimg CLI: floimg run workflow.yaml
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleValidate}
              disabled={isLoading || !yamlContent.trim()}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-zinc-200 bg-white dark:bg-zinc-700 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Validate
            </button>
            <button
              onClick={handleImport}
              disabled={isLoading || !yamlContent.trim()}
              className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
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
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              )}
              Import
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
