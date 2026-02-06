/**
 * Shared types for floimg-studio
 */

// Template types
export type { Template, TemplateCategory } from "./types/template.js";

// Validation utilities - import type for local use, then re-export
import type { StudioValidationIssue as _StudioValidationIssue } from "./validation.js";
export {
  mapValidationToNodes,
  formatValidationResponse,
  validateInputFormats,
} from "./validation.js";
export type {
  ValidationIssue,
  StudioValidationIssue,
  QuickFix,
  TransformFormatRequirements,
} from "./validation.js";
// Alias for use within this file
type StudioValidationIssue = _StudioValidationIssue;

// Node types in the visual editor
export type StudioNodeType =
  | "generator"
  | "transform"
  | "save"
  | "input"
  | "vision" // AI image analysis
  | "text" // AI text generation
  // Iterative workflow nodes
  | "fanout" // Distribute execution across parallel branches
  | "collect" // Gather outputs from parallel branches
  | "router"; // Route based on AI selection

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
  imageUrl?: string; // Remote image URL (for remix/fork flows)
}

// ============================================
// Storage Adapter Types
// ============================================

/**
 * StorageAdapter interface for Input node uploads.
 *
 * Allows different deployments to provide their own storage implementations:
 * - OSS: Local filesystem via /api/uploads
 * - FSC: S3 via presigned URLs through /api/storage/*
 *
 * Injected via React Context - see StorageAdapterProvider.
 */
export interface StorageAdapter {
  /** Upload an image file, returns a reference for later retrieval */
  upload(file: File): Promise<UploadResult>;

  /** Get URL for displaying uploaded image preview */
  getPreviewUrl(reference: string): string;

  /** Delete an uploaded image (optional) */
  delete?(reference: string): Promise<void>;
}

/** Result from uploading an image */
export interface UploadResult {
  /** Opaque reference ID for the upload */
  reference: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  mime: string;
  /** File size in bytes */
  size: number;
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

// ============================================
// Iterative Workflow Node Data
// ============================================

/**
 * Fan-out node distributes execution across parallel branches.
 *
 * In "array" mode, it takes an array input and spawns one downstream
 * execution per item. In "count" mode, it spawns N copies of its input.
 *
 * @example
 * // Array mode: text node outputs { prompts: ["A", "B", "C"] }
 * // Fan-out with arrayProperty="prompts" spawns 3 branches
 *
 * @example
 * // Count mode: input image gets duplicated to 3 parallel generators
 */
export interface FanOutNodeData {
  /** How to fan out: "array" (one per item) or "count" (N copies) */
  mode: "array" | "count";
  /** For count mode: number of parallel executions (default: 3) */
  count?: number;
  /** For array mode: which property of the input object to iterate over */
  arrayProperty?: string;
}

/**
 * Collect node gathers outputs from parallel branches into a single array.
 *
 * Waits for all expected inputs before producing output. Handles failures
 * gracefully by including null entries for failed branches.
 *
 * @example
 * // 3 generators feed into collect with expectedInputs=3
 * // Collect outputs [img1, img2, img3] to vision node
 */
export interface CollectNodeData {
  /** How many inputs to expect (helps with canvas layout, default: 3) */
  expectedInputs?: number;
  /** Whether to wait for all inputs or proceed with available (default: "all") */
  waitMode: "all" | "available";
}

/**
 * Router node routes inputs based on selection criteria from AI analysis.
 *
 * Takes an array of candidates and selection data (typically from a vision node),
 * then routes the selected item(s) to downstream nodes. Can also pass through
 * context like refinement suggestions.
 *
 * @example
 * // Vision outputs { winner: 1, refinement: "add more contrast" }
 * // Router selects candidates[1] and passes refinement to edit node
 */
export interface RouterNodeData {
  /** Property name containing the selection (e.g., "winner") */
  selectionProperty: string;
  /** Selection type: "index" (0-based number) or "value" (exact match) */
  selectionType: "index" | "value";
  /** How many outputs to route (1 = single winner, N = top N, default: 1) */
  outputCount: number;
  /** Optional: property containing context to pass through (e.g., "refinement") */
  contextProperty?: string;
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
  | TextNodeData
  // Iterative workflow nodes
  | FanOutNodeData
  | CollectNodeData
  | RouterNodeData;

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
  /**
   * Step identifier - the `out` variable name from the Pipeline step.
   * This is the universal identifier used across the system.
   */
  id: string;
  /** Step status: "skipped" indicates step was not executed due to upstream dependency failure */
  status: "running" | "completed" | "error" | "skipped";
  // Image output (for generator, transform, input nodes)
  imageId?: string;
  preview?: string; // base64 thumbnail
  // Text/JSON output (for vision, text nodes)
  dataType?: "text" | "json";
  content?: string;
  parsed?: Record<string, unknown>;
  // Error/skip info
  error?: string;
  /** Reason for skip (when status is "skipped") */
  skipReason?: string;
  // Branch info for parallel execution (fan-out/collect)
  /** Branch identifier (e.g., "fanout_1_branch_0") */
  branchId?: string;
  /** Branch index within a fan-out (0, 1, 2...) */
  branchIndex?: number;
  /** Total number of branches in this fan-out */
  totalBranches?: number;
  // Timing info
  /** Execution duration in milliseconds (only set on completed/error status) */
  duration?: number;
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
  /** Step identifier - the `out` variable name from the Pipeline step */
  stepId: string;
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
  /** For transforms: accepted input image formats (e.g., ["image/png"]) */
  acceptedInputFormats?: string[];
  /** For transforms: custom error message when input format doesn't match */
  inputFormatError?: string;
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
 * Available model for workflow generation
 */
export interface GenerateModel {
  /** Model identifier (e.g., "gemini-3-pro-preview") */
  id: string;
  /** Human-readable name (e.g., "Gemini 3 Pro") */
  name: string;
  /** Short description of model characteristics */
  description: string;
  /** Whether this is the default model */
  isDefault?: boolean;
}

/**
 * Request to generate a workflow from natural language
 */
export interface GenerateWorkflowRequest {
  /** User's description of what they want */
  prompt: string;
  /** Previous messages for context (multi-turn refinement) */
  history?: GenerateWorkflowMessage[];
  /** Model to use for generation (optional, uses default if not specified) */
  model?: string;
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
  /** Default model ID */
  model: string;
  /** Available models for selection */
  availableModels?: GenerateModel[];
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

// ============================================
// AI Iterative Workflow Operations
// ============================================

/**
 * Snapshot of the current canvas state sent to AI for context
 * Used for iterative editing - AI needs to know what's already on the canvas
 */
export interface CanvasSnapshot {
  /** Summary of nodes currently on canvas */
  nodes: {
    /** Node's unique ID (stable reference for operations) */
    id: string;
    /** Node type (e.g., "generator:openai", "transform:sharp:resize") */
    type: string;
    /** Human-readable label if set */
    label?: string;
    /** Node configuration parameters */
    parameters?: Record<string, unknown>;
  }[];
  /** Connections between nodes */
  edges: {
    source: string;
    target: string;
  }[];
  /** Total node count */
  nodeCount: number;
  /** Whether canvas has any content */
  hasContent: boolean;
}

/**
 * Operation type for iterative workflow editing
 * AI returns these when modifying an existing workflow
 */
export type AIOperationType = "add" | "modify" | "delete" | "connect" | "disconnect";

/**
 * A single operation to apply to the canvas
 * Operations are atomic changes that can be applied incrementally
 */
export interface AIWorkflowOperation {
  /** Type of operation */
  type: AIOperationType;
  /** Target node ID (for modify, delete) */
  nodeId?: string;
  /** Target edge ID (for disconnect) */
  edgeId?: string;
  /** New node type (for add) */
  nodeType?: string;
  /** Node label (for add, modify) */
  label?: string;
  /** Node parameters to set/update (for add, modify) */
  parameters?: Record<string, unknown>;
  /** Source node ID (for connect) */
  source?: string;
  /** Target node ID (for connect) */
  target?: string;
  /** Source handle (for connect, optional) */
  sourceHandle?: string;
  /** Target handle (for connect, optional) */
  targetHandle?: string;
  /** Human-readable explanation of this operation */
  explanation?: string;
}

/**
 * Response from AI for iterative workflow editing
 * AI chooses between full replacement and incremental operations
 */
export interface AIIterativeResponse {
  /** Full workflow replacement (for empty canvas or major changes) */
  workflow?: GeneratedWorkflowData;
  /** Incremental operations (for modifications to existing workflow) */
  operations?: AIWorkflowOperation[];
  /** Overall explanation of what was done */
  explanation: string;
  /** Suggested follow-up actions */
  suggestions?: string[];
}

/**
 * Extended request for workflow generation with canvas context
 */
export interface GenerateWorkflowRequestWithCanvas extends GenerateWorkflowRequest {
  /** Current canvas state for iterative editing */
  currentCanvas?: CanvasSnapshot;
}

// ============================================
// Server-Sent Events (SSE) Types
// ============================================

/**
 * SSE event types for workflow execution streaming
 */
export type ExecutionSSEEventType =
  | "execution.started"
  | "execution.step"
  | "execution.completed"
  | "execution.error";

export interface ExecutionSSEStarted {
  type: "execution.started";
  data: {
    totalSteps: number;
    /**
     * Step identifiers - the `out` variable names from Pipeline steps.
     * These serve as the universal identifier for steps across the system.
     */
    ids: string[];
  };
}

export interface ExecutionSSEStep {
  type: "execution.step";
  data: ExecutionStepResult;
}

/**
 * Usage metrics from AI provider calls during workflow execution.
 * Collected via hooks and returned for cost tracking.
 */
export interface UsageEvent {
  provider: string;
  model: string;
  operation: string;
  inputTokens?: number;
  outputTokens?: number;
  imageWidth?: number;
  imageHeight?: number;
  imageCount?: number;
  quality?: string;
  timestamp?: number;
  rawMetadata?: Record<string, unknown>;
}

export interface ExecutionSSECompleted {
  type: "execution.completed";
  data: {
    imageIds: string[];
    imageUrls: string[];
    /** Usage metrics from AI providers for cost tracking */
    usageEvents?: UsageEvent[];
  };
}

export interface ExecutionSSEError {
  type: "execution.error";
  data: {
    error: string;
    /** Step identifier where the error occurred (the `out` variable name) */
    id?: string;
    /** Machine-readable error code (e.g., "GENERATION_ERROR", "NETWORK_ERROR") */
    errorCode?: string;
    /** Error category for handling strategies */
    errorCategory?: ErrorCategory;
    /** Whether the operation can be retried */
    retryable?: boolean;
    /** Validation issues (for VALIDATION_ERROR code) */
    validationIssues?: StudioValidationIssue[];
  };
}

/**
 * Error categories for classification and handling strategies.
 *
 * - user_input: Invalid user-provided values (bad params, missing fields)
 * - provider_error: External API failures (rate limit, timeout, service down)
 * - provider_config: Missing/invalid credentials or configuration
 * - validation: Pre-execution validation failures (circular deps, missing inputs)
 * - execution: Runtime failures during image processing
 * - network: Connectivity issues reaching providers
 * - internal: Unexpected internal errors (bugs)
 */
export type ErrorCategory =
  | "user_input"
  | "provider_error"
  | "provider_config"
  | "validation"
  | "execution"
  | "network"
  | "internal";

export type ExecutionSSEEvent =
  | ExecutionSSEStarted
  | ExecutionSSEStep
  | ExecutionSSECompleted
  | ExecutionSSEError;

/**
 * SSE event types for AI workflow generation streaming
 */
export type GenerationPhase = "analyzing" | "selecting_nodes" | "generating" | "validating";

export interface GenerationSSEStarted {
  type: "generation.started";
  data: {
    model: string;
  };
}

export interface GenerationSSEProgress {
  type: "generation.progress";
  data: {
    phase: GenerationPhase;
    message: string;
  };
}

export interface GenerationSSECompleted {
  type: "generation.completed";
  data: GeneratedWorkflowData;
}

export interface GenerationSSEError {
  type: "generation.error";
  data: {
    error: string;
  };
}

/** SSE event for iterative workflow modifications (operations instead of full replacement) */
export interface GenerationSSEIterative {
  type: "generation.iterative";
  data: AIIterativeResponse;
}

export type GenerationSSEEvent =
  | GenerationSSEStarted
  | GenerationSSEProgress
  | GenerationSSECompleted
  | GenerationSSEIterative
  | GenerationSSEError;

// ============================================
// AI Operation Conflict Detection
// ============================================

/**
 * Type of conflict between user edits and AI operations
 */
export type ConflictType =
  /** Node was modified by user after last AI apply, and AI wants to modify it again */
  | "modified_by_both"
  /** Node was modified by user, but AI wants to delete it */
  | "deleted_by_ai"
  /** AI wants to modify a node that user deleted */
  | "deleted_by_user"
  /** AI wants to reconnect nodes that user disconnected */
  | "reconnect_conflict";

/**
 * A conflict between user edits and an AI operation
 */
export interface OperationConflict {
  /** The operation that caused the conflict */
  operation: AIWorkflowOperation;
  /** Type of conflict */
  type: ConflictType;
  /** Node ID involved in the conflict */
  nodeId: string;
  /** Human-readable description of the conflict */
  description: string;
  /** User's version of the data (for modified_by_both) */
  userValue?: Record<string, unknown>;
  /** AI's proposed value (for modified_by_both) */
  aiValue?: Record<string, unknown>;
}

/**
 * User's resolution choice for a conflict
 */
export type ConflictResolution = "keep_mine" | "accept_ai" | "skip";

/**
 * Conflict with user's chosen resolution
 */
export interface ResolvedConflict {
  conflict: OperationConflict;
  resolution: ConflictResolution;
}

/**
 * Result of conflict detection before applying AI operations
 */
export interface ConflictDetectionResult {
  /** Whether there are any conflicts */
  hasConflicts: boolean;
  /** List of detected conflicts */
  conflicts: OperationConflict[];
  /** Operations that can be applied without conflict */
  safeOperations: AIWorkflowOperation[];
}

// ============================================
// Pipeline Conversion
// ============================================

/**
 * Pipeline step types (canonical format from @teamflojo/floimg)
 * These match the SDK's PipelineStep type exactly for End-to-End Consistency
 */
export type PipelineStep =
  | {
      kind: "generate";
      generator: string;
      params?: Record<string, unknown>;
      out: string;
    }
  | {
      kind: "transform";
      op: string;
      in: string;
      params: Record<string, unknown>;
      out: string;
      provider?: string;
    }
  | {
      kind: "save";
      in: string;
      destination: string;
      provider?: string;
      out?: string;
    }
  | {
      kind: "vision";
      provider: string;
      in: string;
      params?: Record<string, unknown>;
      out: string;
    }
  | {
      kind: "text";
      provider: string;
      in?: string;
      params?: Record<string, unknown>;
      out: string;
    }
  | {
      kind: "fan-out";
      in: string;
      mode: "count" | "array";
      count?: number;
      arrayProperty?: string;
      out: string[];
    }
  | {
      kind: "collect";
      in: string[];
      waitMode: "all" | "available";
      minRequired?: number;
      out: string;
    }
  | {
      kind: "router";
      in: string;
      selectionIn: string;
      selectionType: "index" | "property";
      selectionProperty: string;
      out: string;
    };

/**
 * Pipeline definition (canonical format)
 */
export interface Pipeline {
  name: string;
  steps: PipelineStep[];
}

/**
 * Result of converting nodes/edges to Pipeline
 */
export interface PipelineConversionResult {
  pipeline: Pipeline;
  /** Maps node ID to variable name (for resolving node-specific data like uploads) */
  nodeToVar: Map<string, string>;
}

/**
 * Build dependency graph from nodes and edges
 */
function buildDependencyGraph(nodes: StudioNode[], edges: StudioEdge[]): Map<string, Set<string>> {
  const dependencies = new Map<string, Set<string>>();

  for (const node of nodes) {
    dependencies.set(node.id, new Set());
  }

  for (const edge of edges) {
    dependencies.get(edge.target)?.add(edge.source);
  }

  return dependencies;
}

/**
 * Convert visual editor workflow (nodes + edges) to Pipeline format
 *
 * This is a pure conversion function - no API key injection or runtime concerns.
 * The resulting Pipeline can be sent to the backend for execution.
 *
 * Variable names (the `out` field) serve as step identifiers throughout
 * the system - they're used in SSE events, data flow, and results.
 *
 * @param nodes - Workflow nodes from the visual editor
 * @param edges - Connections between nodes
 * @returns Pipeline and node-to-variable mapping
 */
export function nodesToPipeline(
  nodes: StudioNode[],
  edges: StudioEdge[]
): PipelineConversionResult {
  // Build a map of fan-out node IDs to their output counts
  const fanoutNodes = new Map<string, { count: number; mode: "array" | "count" }>();
  for (const node of nodes) {
    if (node.type === "fanout") {
      const data = node.data as FanOutNodeData;
      fanoutNodes.set(node.id, {
        count: data.count || 3,
        mode: data.mode || "count",
      });
    }
  }

  // Topological sort for execution order
  const dependencies = buildDependencyGraph(nodes, edges);
  const completed = new Set<string>();
  const sorted: StudioNode[] = [];

  while (sorted.length < nodes.length) {
    const ready = nodes.filter((n) => {
      if (completed.has(n.id)) return false;
      const deps = dependencies.get(n.id) || new Set();
      for (const dep of deps) {
        if (!completed.has(dep)) return false;
      }
      return true;
    });

    if (ready.length === 0) break;

    for (const node of ready) {
      sorted.push(node);
      completed.add(node.id);
    }
  }

  const nodeToVar = new Map<string, string>();
  const steps: PipelineStep[] = [];
  const inputNodeVars: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const node = sorted[i];
    // Use node ID as variable name - ensures consistency between visual editor and Pipeline
    const varName = node.id;
    nodeToVar.set(node.id, varName);

    // Input nodes don't create pipeline steps - data injected via initialVariables
    // Track them so we can add to initialVariables for validation
    if (node.type === "input") {
      inputNodeVars.push(varName);
      continue;
    }

    if (node.type === "generator") {
      const data = node.data as GeneratorNodeData;
      const params = { ...data.params };

      // Find text input edge (for AI generators with dynamic prompts)
      const textEdge = edges.find((e) => e.target === node.id && e.targetHandle === "text");
      const textSourceVar = textEdge ? nodeToVar.get(textEdge.source) : undefined;
      const textSourceHandle = textEdge?.sourceHandle;

      // Check if text input comes from a fan-out branch
      const fanoutBranchMatch = textSourceHandle?.match(/^out\[(\d+)\]$/);
      const isFanoutBranch = fanoutBranchMatch && textEdge && fanoutNodes.has(textEdge.source);

      if (isFanoutBranch && textEdge) {
        const branchIndex = parseInt(fanoutBranchMatch![1], 10);
        const fanoutVar = nodeToVar.get(textEdge.source);
        params._promptFromVar = `${fanoutVar}_${branchIndex}`;
      } else if (textSourceVar) {
        params._promptFromVar = textSourceVar;
        if (textSourceHandle?.startsWith("output.")) {
          params._promptFromProperty = textSourceHandle.slice(7);
        }
      }

      // Find reference image edges
      const referenceEdges = edges.filter(
        (e) => e.target === node.id && e.targetHandle === "references"
      );
      if (referenceEdges.length > 0) {
        const refVars = referenceEdges
          .map((e) => nodeToVar.get(e.source))
          .filter((v): v is string => v !== undefined);
        if (refVars.length > 0) {
          params._referenceImageVars = refVars;
        }
      }

      steps.push({
        kind: "generate",
        generator: data.generatorName,
        params,
        out: varName,
      });
    } else if (node.type === "transform") {
      const data = node.data as TransformNodeData;
      const isComposite = data.operation === "composite";

      // For composite, accept "base" handle; otherwise "image" or undefined
      const imageEdge = edges.find((e) => {
        if (e.target !== node.id) return false;
        if (isComposite) {
          return e.targetHandle === "base" || e.targetHandle === "image" || !e.targetHandle;
        }
        return e.targetHandle === "image" || !e.targetHandle;
      });
      const inputVar = imageEdge ? nodeToVar.get(imageEdge.source) : undefined;

      if (!inputVar) {
        throw new Error(`Transform node requires an input image connection`);
      }

      const textEdge = edges.find((e) => e.target === node.id && e.targetHandle === "text");
      const textSourceVar = textEdge ? nodeToVar.get(textEdge.source) : undefined;
      const textSourceHandle = textEdge?.sourceHandle;

      const params = { ...data.params };

      if (textSourceVar) {
        params._promptFromVar = textSourceVar;
        if (textSourceHandle?.startsWith("output.")) {
          params._promptFromProperty = textSourceHandle.slice(7);
        }
      }

      const referenceEdges = edges.filter(
        (e) => e.target === node.id && e.targetHandle === "references"
      );
      if (referenceEdges.length > 0) {
        const refVars = referenceEdges
          .map((e) => nodeToVar.get(e.source))
          .filter((v): v is string => v !== undefined);
        if (refVars.length > 0) {
          params._referenceImageVars = refVars;
        }
      }

      // Handle composite overlay inputs - collect edges with "overlays[N]" handles
      // Store both variable name and original index to support sparse arrays
      if (isComposite) {
        const overlayEdges = edges
          .filter((e) => e.target === node.id && e.targetHandle?.startsWith("overlays["))
          .sort((a, b) => {
            // Sort by index to maintain order
            const idxA = parseInt(a.targetHandle?.match(/\[(\d+)\]/)?.[1] || "0", 10);
            const idxB = parseInt(b.targetHandle?.match(/\[(\d+)\]/)?.[1] || "0", 10);
            return idxA - idxB;
          });

        if (overlayEdges.length > 0) {
          const overlayVarsWithIndex = overlayEdges
            .map((e) => {
              const varName = nodeToVar.get(e.source);
              const index = parseInt(e.targetHandle?.match(/\[(\d+)\]/)?.[1] || "0", 10);
              return varName ? { varName, index } : null;
            })
            .filter((v): v is { varName: string; index: number } => v !== null);
          if (overlayVarsWithIndex.length > 0) {
            params._overlayImageVars = overlayVarsWithIndex;
          }
        }
      }

      steps.push({
        kind: "transform",
        op: data.operation,
        in: inputVar,
        params,
        out: varName,
        ...(data.providerName && { provider: data.providerName }),
      });
    } else if (node.type === "save") {
      const data = node.data as SaveNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      if (!inputVar) {
        throw new Error(`Save node requires an input connection`);
      }

      steps.push({
        kind: "save",
        in: inputVar,
        destination: data.destination,
        provider: data.provider,
      });
    } else if (node.type === "vision") {
      const data = node.data as VisionNodeData;
      const inputEdge = edges.find(
        (e) => e.target === node.id && (e.targetHandle === "image" || !e.targetHandle)
      );
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      if (!inputVar) {
        throw new Error(`Vision node requires an input image connection`);
      }

      const contextEdge = edges.find((e) => e.target === node.id && e.targetHandle === "context");
      const contextSourceVar = contextEdge ? nodeToVar.get(contextEdge.source) : undefined;

      const params = { ...data.params };
      if (contextSourceVar) {
        params._contextFromVar = contextSourceVar;
      }

      steps.push({
        kind: "vision",
        provider: data.providerName,
        in: inputVar,
        params,
        out: varName,
      });
    } else if (node.type === "text") {
      const data = node.data as TextNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      steps.push({
        kind: "text",
        provider: data.providerName,
        in: inputVar,
        params: { ...data.params },
        out: varName,
      });
    } else if (node.type === "fanout") {
      const data = node.data as FanOutNodeData;
      const inputEdge = edges.find((e) => e.target === node.id);
      const inputVar = inputEdge ? nodeToVar.get(inputEdge.source) : undefined;

      const branchCount = data.count || 3;
      const branchVars = Array.from({ length: branchCount }, (_, i) => `${varName}_${i}`);

      steps.push({
        kind: "fan-out",
        in: inputVar || "",
        mode: data.mode || "count",
        count: branchCount,
        arrayProperty: data.arrayProperty,
        out: branchVars,
      });
    } else if (node.type === "collect") {
      const data = node.data as CollectNodeData;
      const inputEdges = edges.filter((e) => e.target === node.id);
      const inputVars = inputEdges
        .map((e) => nodeToVar.get(e.source))
        .filter((v): v is string => v !== undefined);

      const waitMode = data.waitMode || "all";
      steps.push({
        kind: "collect",
        in: inputVars,
        waitMode,
        ...(waitMode === "available" && { minRequired: Math.max(1, data.expectedInputs || 1) }),
        out: varName,
      });
    } else if (node.type === "router") {
      const data = node.data as RouterNodeData;
      const candidatesEdge = edges.find(
        (e) => e.target === node.id && e.targetHandle === "candidates"
      );
      const selectionEdge = edges.find(
        (e) => e.target === node.id && e.targetHandle === "selection"
      );

      const candidatesVar = candidatesEdge ? nodeToVar.get(candidatesEdge.source) : undefined;
      const selectionVar = selectionEdge ? nodeToVar.get(selectionEdge.source) : undefined;

      const selectionType =
        data.selectionType === "value" ? "property" : data.selectionType || "index";

      steps.push({
        kind: "router",
        in: candidatesVar || "",
        selectionIn: selectionVar || "",
        selectionType: selectionType as "index" | "property",
        selectionProperty: data.selectionProperty || "winner",
        out: varName,
      });
    }
  }

  // Build initialVariables for input nodes (placeholder values for validation)
  // Actual data is injected at runtime via initialVariablesBase64
  const initialVariables: Record<string, unknown> | undefined =
    inputNodeVars.length > 0 ? Object.fromEntries(inputNodeVars.map((v) => [v, null])) : undefined;

  return {
    pipeline: {
      name: "Studio Workflow",
      steps,
      ...(initialVariables && { initialVariables }),
    },
    nodeToVar,
  };
}
