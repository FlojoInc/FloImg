import type {
  NodeDefinition,
  StudioNode,
  StudioEdge,
  ImageMetadata,
  GenerateWorkflowRequest,
  GenerateWorkflowResponse,
  GenerateStatusResponse,
} from "@teamflojo/floimg-studio-shared";

const API_BASE = "/api";

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Node registry
export async function getGenerators(): Promise<NodeDefinition[]> {
  return fetchJson(`${API_BASE}/nodes/generators`);
}

export async function getTransforms(): Promise<NodeDefinition[]> {
  return fetchJson(`${API_BASE}/nodes/transforms`);
}

export async function getTextProviders(): Promise<NodeDefinition[]> {
  return fetchJson(`${API_BASE}/nodes/text`);
}

export async function getVisionProviders(): Promise<NodeDefinition[]> {
  return fetchJson(`${API_BASE}/nodes/vision`);
}

// AI provider configuration passed to backend
export interface AIProviderConfig {
  openai?: { apiKey: string };
  anthropic?: { apiKey: string };
  gemini?: { apiKey: string };
  grok?: { apiKey: string };
  openrouter?: { apiKey: string };
  ollama?: { baseUrl: string };
  lmstudio?: { baseUrl: string };
}

// Execution
export async function executeWorkflow(
  nodes: StudioNode[],
  edges: StudioEdge[],
  aiProviders?: AIProviderConfig
): Promise<{
  status: string;
  imageIds: string[];
  imageUrls?: string[]; // Presigned cloud URLs (FSC only)
  previews?: Record<string, string>;
  dataOutputs?: Record<
    string,
    { dataType: "text" | "json"; content: string; parsed?: Record<string, unknown> }
  >;
  error?: string;
}> {
  return fetchJson(`${API_BASE}/execute/sync`, {
    method: "POST",
    body: JSON.stringify({ nodes, edges, aiProviders }),
  });
}

// Export
export async function exportYaml(
  nodes: StudioNode[],
  edges: StudioEdge[]
): Promise<{ yaml: string }> {
  return fetchJson(`${API_BASE}/export/yaml`, {
    method: "POST",
    body: JSON.stringify({ nodes, edges }),
  });
}

// Images
export interface ImageInfo {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
}

export async function listImages(): Promise<ImageInfo[]> {
  return fetchJson(`${API_BASE}/images`);
}

export function getImageUrl(id: string): string {
  return `${API_BASE}/images/${id}/blob`;
}

export async function getImageWorkflow(id: string): Promise<ImageMetadata | null> {
  try {
    return await fetchJson(`${API_BASE}/images/${id}/workflow`);
  } catch {
    return null; // Workflow metadata not available for this image
  }
}

// Uploads
export interface UploadInfo {
  id: string;
  filename: string;
  mime: string;
  size: number;
  createdAt: number;
}

export async function uploadImage(file: File): Promise<UploadInfo> {
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

  return response.json();
}

export async function listUploads(): Promise<UploadInfo[]> {
  return fetchJson(`${API_BASE}/uploads`);
}

export async function getUploadThumbnail(id: string): Promise<{ dataUrl: string }> {
  return fetchJson(`${API_BASE}/uploads/${id}/thumbnail`);
}

export async function deleteUpload(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/uploads/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error(`Failed to delete upload: ${response.status}`);
  }
}

export function getUploadBlobUrl(id: string): string {
  return `${API_BASE}/uploads/${id}/blob`;
}

// Input nodes
export async function getInputNodes(): Promise<NodeDefinition[]> {
  return fetchJson(`${API_BASE}/nodes/inputs`);
}

// Import
export interface ImportResult {
  success: boolean;
  nodes: StudioNode[];
  edges: StudioEdge[];
  name: string;
  error?: string;
  line?: number;
  column?: number;
}

export interface ImportValidationResult {
  valid: boolean;
  errors: Array<{ message: string; line?: number; column?: number }>;
}

export async function importYaml(yaml: string): Promise<ImportResult> {
  return fetchJson(`${API_BASE}/import`, {
    method: "POST",
    body: JSON.stringify({ yaml }),
  });
}

export async function validateYaml(yaml: string): Promise<ImportValidationResult> {
  return fetchJson(`${API_BASE}/import/validate`, {
    method: "POST",
    body: JSON.stringify({ yaml }),
  });
}

// Workflow Generation
export async function generateWorkflow(
  request: GenerateWorkflowRequest
): Promise<GenerateWorkflowResponse> {
  return fetchJson(`${API_BASE}/generate/workflow`, {
    method: "POST",
    body: JSON.stringify(request),
  });
}

export async function getGenerateStatus(): Promise<GenerateStatusResponse> {
  return fetchJson(`${API_BASE}/generate/status`);
}
