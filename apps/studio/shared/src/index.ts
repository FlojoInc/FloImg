/**
 * Shared types for floimg-studio
 */

// Node types in the visual editor
export type StudioNodeType =
  | "generator"
  | "transform"
  | "save"
  | "input"
  | "vision" // AI image analysis
  | "text"; // AI text generation

// Position on the canvas
export interface Position {
  x: number;
  y: number;
}

// Generator node data
export interface GeneratorNodeData {
  generatorName: string;
  params: Record<string, unknown>;
}

// Transform node data
export interface TransformNodeData {
  operation: string;
  params: Record<string, unknown>;
}

// Save node data
export interface SaveNodeData {
  destination: string;
  provider?: "filesystem" | "s3";
}

// Input node data (uploaded image)
export interface InputNodeData {
  uploadId?: string; // Reference to uploaded image
  filename?: string; // Original filename for display
  mime?: string; // Content type
}

// Vision node data (AI image analysis)
export interface VisionNodeData {
  providerName: string; // e.g., "openai-vision", "ollama-vision"
  params: Record<string, unknown>; // prompt, outputFormat, etc.
}

// Text node data (AI text generation)
export interface TextNodeData {
  providerName: string; // e.g., "openai-text", "ollama-text"
  params: Record<string, unknown>; // prompt, systemPrompt, temperature, etc.
}

// Union type for node data
export type StudioNodeData =
  | GeneratorNodeData
  | TransformNodeData
  | SaveNodeData
  | InputNodeData
  | VisionNodeData
  | TextNodeData;

// A node in the visual editor
export interface StudioNode {
  id: string;
  type: StudioNodeType;
  position: Position;
  data: StudioNodeData;
}

// An edge (connection) between nodes
export interface StudioEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

// A complete workflow
export interface StudioWorkflow {
  id: string;
  name: string;
  description?: string;
  nodes: StudioNode[];
  edges: StudioEdge[];
  createdAt: number;
  updatedAt: number;
}

// Execution status
export type ExecutionStatus = "pending" | "running" | "completed" | "error" | "cancelled";

// Step result during execution
export interface ExecutionStepResult {
  stepIndex: number;
  nodeId: string;
  status: "running" | "completed" | "error";
  // Image output (for generator, transform, input nodes)
  imageId?: string;
  preview?: string; // base64 thumbnail
  // Text/JSON output (for vision, text nodes)
  dataType?: "text" | "json";
  content?: string;
  parsed?: Record<string, unknown>;
  // Error info
  error?: string;
}

// Full execution result
export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: ExecutionStatus;
  steps: ExecutionStepResult[];
  startedAt: number;
  completedAt?: number;
  error?: string;
}

// Generated image metadata
export interface GeneratedImage {
  id: string;
  workflowId?: string;
  executionId: string;
  stepIndex: number;
  nodeId: string;
  mime: string;
  width?: number;
  height?: number;
  params?: Record<string, unknown>;
  createdAt: number;
}

// Node definition for the palette (what nodes are available)
export interface NodeDefinition {
  id: string;
  type: StudioNodeType;
  name: string;
  label: string;
  description?: string;
  category: string;
  params: ParamSchema;
  /** Whether this node uses AI/ML models */
  isAI?: boolean;
}

// Parameter schema for dynamic form generation
export interface ParamSchema {
  type: "object";
  properties: Record<string, ParamField>;
  required?: string[];
}

export interface ParamField {
  type: "string" | "number" | "boolean" | "object" | "array";
  title?: string;
  description?: string;
  default?: unknown;
  enum?: string[];
  minimum?: number;
  maximum?: number;
  properties?: Record<string, ParamField>;
}

// API request/response types
export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  nodes: StudioNode[];
  edges: StudioEdge[];
}

export interface ExecuteRequest {
  nodes: StudioNode[];
  edges: StudioEdge[];
}

export interface ExecuteResponse {
  executionId: string;
}

// WebSocket event types
export type WSEventType =
  | "execution.started"
  | "execution.step"
  | "execution.completed"
  | "execution.error";

export interface WSEvent {
  type: WSEventType;
  executionId: string;
  data?: unknown;
}

export interface WSExecutionStarted extends WSEvent {
  type: "execution.started";
  data: {
    workflowId?: string;
    totalSteps: number;
  };
}

export interface WSExecutionStep extends WSEvent {
  type: "execution.step";
  data: ExecutionStepResult;
}

export interface WSExecutionCompleted extends WSEvent {
  type: "execution.completed";
  data: {
    imageIds: string[];
  };
}

export interface WSExecutionError extends WSEvent {
  type: "execution.error";
  data: {
    error: string;
  };
}

// ============================================
// Template System Types
// ============================================

/**
 * A bundled workflow template that can be loaded into the editor
 */
export interface GalleryTemplate {
  /** Unique identifier for the template (e.g., "sales-dashboard") */
  id: string;
  /** Display name (e.g., "Sales Dashboard") */
  name: string;
  /** Short description (e.g., "Bar chart with quarterly revenue") */
  description: string;
  /** Category for filtering (e.g., "Charts", "Diagrams", "QR Codes") */
  category: string;
  /** Primary generator used (e.g., "quickchart", "mermaid", "qr") */
  generator: string;
  /** Optional tags for search */
  tags?: string[];
  /** The workflow definition */
  workflow: {
    nodes: StudioNode[];
    edges: StudioEdge[];
  };
  /** Optional preview image info */
  preview?: {
    /** URL to preview image (e.g., "/templates/sales-dashboard.png") */
    imageUrl: string;
    width: number;
    height: number;
  };
}

/**
 * Metadata stored alongside generated images (sidecar files)
 * Enables "what workflow created this image?" queries
 */
export interface ImageMetadata {
  /** Image identifier */
  id: string;
  /** Filename on disk */
  filename: string;
  /** MIME type */
  mime: string;
  /** File size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: number;
  /** Workflow that created this image (if available) */
  workflow?: {
    nodes: StudioNode[];
    edges: StudioEdge[];
    /** When the workflow was executed */
    executedAt: number;
    /** Template ID if created from a template */
    templateId?: string;
  };
}

/**
 * Content moderation result (used by moderation service)
 */
export interface ModerationResult {
  /** Whether the content is safe */
  safe: boolean;
  /** Whether the content was flagged */
  flagged: boolean;
  /** Individual category flags */
  categories: {
    sexual: boolean;
    sexualMinors: boolean;
    hate: boolean;
    hateThreatening: boolean;
    harassment: boolean;
    harassmentThreatening: boolean;
    selfHarm: boolean;
    selfHarmIntent: boolean;
    selfHarmInstructions: boolean;
    violence: boolean;
    violenceGraphic: boolean;
  };
  /** Raw category scores (0-1) */
  categoryScores: Record<string, number>;
  /** List of categories that were flagged */
  flaggedCategories: string[];
}
