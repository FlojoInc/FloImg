/**
 * Template Types
 *
 * Extended template interface that serves as the single source of truth
 * for template definitions across all FloImg surfaces.
 */

import type { StudioNode, StudioEdge } from "@teamflojo/floimg-studio-shared";

/**
 * Template categories organized by USE CASE, not generator type
 */
export type TemplateCategory = "AI Workflows" | "Data Viz" | "Marketing" | "Utilities";

/**
 * Extended template interface with full metadata
 *
 * Core fields are required for Studio functionality.
 * Extended fields support marketing, SEO, and access control.
 */
export interface Template {
  // ============================================
  // Core Fields (required for Studio)
  // ============================================

  /** Unique identifier - canonical IDs from floimg-web */
  id: string;

  /** Display name (e.g., "Revenue Dashboard") */
  name: string;

  /** Short description for cards and previews */
  description: string;

  /** Category for filtering */
  category: TemplateCategory;

  /** Primary generator used (e.g., "quickchart", "mermaid", "openai") */
  generator: string;

  /** The workflow definition */
  workflow: {
    nodes: StudioNode[];
    edges: StudioEdge[];
  };

  // ============================================
  // Discovery & Search
  // ============================================

  /** Tags for search and filtering */
  tags?: string[];

  // ============================================
  // Availability & Access Control
  // ============================================

  /**
   * Requires cloud API access (e.g., OpenAI API keys)
   * AI generation templates need API keys to execute
   */
  requiresCloud?: boolean;

  /**
   * Requires authentication to use
   * Some templates may be viewable but require sign-in
   */
  requiresAuth?: boolean;

  // ============================================
  // Preview & Assets
  // ============================================

  /** Preview image for cards and detail pages */
  preview?: {
    /** URL path (e.g., "/showcase/data-viz/revenue.png") */
    imageUrl: string;
    /** Optional dimensions for layout optimization */
    width?: number;
    height?: number;
  };

  /** Capabilities badges for marketing */
  capabilities?: {
    /** Works with Claude Code CLI */
    claudeCodeReady?: boolean;
    /** Multi-step pipeline workflow */
    pipeline?: boolean;
  };

  // ============================================
  // Marketing & Documentation
  // ============================================

  /** Code example for SDK users */
  codeExample?: string;

  /** SEO metadata for detail pages */
  seo?: {
    title: string;
    description: string;
    keywords: string[];
  };

  // ============================================
  // Cloud-Specific (onboarding, credits)
  // ============================================

  /** Whether this template uses AI generation (not just transforms) */
  usesAI?: boolean;

  /** Estimated AI credits consumed (0 for transform-only) */
  aiCreditsNeeded?: number;

  /** Short value proposition for onboarding display */
  valueProp?: string;

  /** Icon identifier for template cards */
  icon?: "sparkles" | "image" | "share" | "chart" | "diagram" | "qr";

  // ============================================
  // Computed Metadata (derived from workflow)
  // ============================================

  /**
   * Number of nodes in the workflow
   * Can be explicitly set or computed from workflow.nodes.length
   */
  nodeCount?: number;
}

/**
 * Backwards-compatible alias for GalleryTemplate
 * @deprecated Use Template instead
 */
export type GalleryTemplate = Template;
