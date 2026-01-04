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
  /** Whether this generator uses AI/ML models */
  isAI?: boolean;
  /** Whether this generator accepts reference images */
  acceptsReferenceImages?: boolean;
  /** Maximum number of reference images supported */
  maxReferenceImages?: number;
}

// Transform node data
export interface TransformNodeData {
  operation: string;
  /** Transform provider name (e.g., "gemini-transform", "sharp") for routing */
  providerName?: string;
  /** Whether this transform is AI-powered and can accept text input */
  isAI?: boolean;
  params: Record<string, unknown>;
  /** Whether this transform accepts additional reference images */
  acceptsReferenceImages?: boolean;
  /** Maximum number of reference images supported */
  maxReferenceImages?: number;
}

// Save node data
export interface SaveNodeData {
  destination: string;
  /** Save provider. OSS supports "filesystem" and "s3". Extensions may add others. */
  provider?: string;
}

// Input node data (uploaded image)
export interface InputNodeData {
  uploadId?: string; // Reference to uploaded image
  filename?: string; // Original filename for display
  mime?: string; // Content type
}

// Vision node data (AI image analysis)
export interface VisionNodeData {
  providerName: string; // Provider ID for execution (e.g., "gemini-vision", "grok-vision")
  providerLabel?: string; // Human-readable label for display (e.g., "Gemini Vision")
  params: Record<string, unknown>; // prompt, outputFormat, etc.
  /** Output schema for structured JSON - defines what properties are available as outputs */
  outputSchema?: OutputSchema;
}

// Text node data (AI text generation)
export interface TextNodeData {
  providerName: string; // Provider ID for execution (e.g., "gemini-text", "grok-text")
  providerLabel?: string; // Human-readable label for display (e.g., "Gemini Text")
  params: Record<string, unknown>; // prompt, systemPrompt, temperature, etc.
  /** Output schema for structured JSON - defines what properties are available as outputs */
  outputSchema?: OutputSchema;
}

/**
 * Output schema for text/vision nodes that produce structured JSON
 * Defines the shape of the output and enables multi-output handles
 */
export interface OutputSchema {
  type: "object";
  properties: Record<string, OutputProperty>;
  /** Friendly name for the schema (shown in UI) */
  name?: string;
}

export interface OutputProperty {
  type: "string" | "number" | "boolean" | "object" | "array";
  description?: string;
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
  /** For transforms: the provider name (e.g., "gemini-transform", "sharp") */
  providerName?: string;
  /** Whether this node requires an API key */
  requiresApiKey?: boolean;
  /** Environment variable name for the API key */
  apiKeyEnvVar?: string;
  /** Default output schema for structured JSON outputs (text/vision nodes) */
  outputSchema?: OutputSchema;
  /** Whether this node accepts reference images (for AI generators/transforms) */
  acceptsReferenceImages?: boolean;
  /** Maximum number of reference images supported */
  maxReferenceImages?: number;
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

// ============================================
// AI Workflow Generation Types
// ============================================

/**
 * A message in the workflow generation conversation
 */
export interface GenerateWorkflowMessage {
  role: "user" | "assistant";
  content: string;
  /** Workflow generated by this message (assistant only) */
  workflow?: GeneratedWorkflowData;
  /** Timestamp */
  timestamp: number;
}

/**
 * Workflow data generated by AI
 * This is what Gemini returns as structured output
 */
export interface GeneratedWorkflowData {
  /** Generated nodes */
  nodes: GeneratedNode[];
  /** Connections between nodes */
  edges: GeneratedEdge[];
}

/**
 * A node in the generated workflow
 * Simplified format that Gemini outputs
 */
export interface GeneratedNode {
  /** Unique identifier for this node */
  id: string;
  /**
   * Node type - must match registry format:
   * - "generator:{name}" for generators (e.g., "generator:dalle-3")
   * - "transform:{provider}:{op}" for transforms (e.g., "transform:sharp:resize")
   * - "input:upload" for input nodes
   * - "text:{provider}" for text nodes (e.g., "text:gemini-text")
   * - "vision:{provider}" for vision nodes (e.g., "vision:gemini-vision")
   */
  nodeType: string;
  /** Human-readable label for display */
  label?: string;
  /** Node parameters (generator params, transform params, etc.) */
  parameters: Record<string, unknown>;
}

/**
 * An edge in the generated workflow
 */
export interface GeneratedEdge {
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle (for multi-output nodes) */
  sourceHandle?: string;
  /** Target handle (for nodes with multiple inputs) */
  targetHandle?: string;
}

/**
 * Request to generate a workflow from natural language
 */
export interface GenerateWorkflowRequest {
  /** User's description of what they want */
  prompt: string;
  /** Previous messages for context (multi-turn refinement) */
  history?: GenerateWorkflowMessage[];
}

/**
 * Response from workflow generation
 */
export interface GenerateWorkflowResponse {
  /** Whether generation succeeded */
  success: boolean;
  /** Generated workflow data */
  workflow?: GeneratedWorkflowData;
  /** AI's response message */
  message: string;
  /** Error message if failed */
  error?: string;
}

/**
 * Reason why AI workflow generation is unavailable
 */
export type GenerateStatusReason =
  | "not_configured"
  | "tier_limit"
  | "rate_limited"
  | "service_unavailable";

/**
 * Response from the workflow generation status endpoint
 */
export interface GenerateStatusResponse {
  /** Whether generation is available */
  available: boolean;
  /** Model being used */
  model: string;
  /** Human-readable status message */
  message: string;
  /** Reason for unavailability (if not available) */
  reason?: GenerateStatusReason;
  /** Whether this is a cloud deployment (affects UI messaging) */
  isCloudDeployment?: boolean;
  // FSC-only fields (populated by cloud proxy)
  /** User's current tier */
  tier?: string;
  /** Remaining generations this period */
  remaining?: number;
  /** Total limit for this period */
  limit?: number;
  /** When the limit resets (ISO 8601 timestamp) */
  resetsAt?: string;
  /** Support URL (only shown for paid users on service errors) */
  supportUrl?: string;
}
