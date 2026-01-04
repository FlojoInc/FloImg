/**
 * @teamflojo/floimg-templates
 *
 * Official workflow templates for FloImg Studio.
 * Single source of truth for template definitions.
 *
 * @example
 * ```typescript
 * // Self-hosted: Get only templates that work offline
 * import { getCoreTemplates } from '@teamflojo/floimg-templates';
 * const templates = getCoreTemplates();
 *
 * // Cloud/full: Get all templates including those requiring API keys
 * import { getAllTemplates } from '@teamflojo/floimg-templates';
 * const templates = getAllTemplates();
 *
 * // Get specific template with metadata
 * import { getTemplateById } from '@teamflojo/floimg-templates';
 * const template = getTemplateById('revenue-chart');
 * ```
 */

// Re-export types
export type { Template, TemplateCategory, GalleryTemplate } from "./types.js";

// Import all template categories
import { dataVizTemplates } from "./templates/data-viz.js";
import { aiWorkflowTemplates } from "./templates/ai-workflows.js";
import { marketingTemplates } from "./templates/marketing.js";
import { utilityTemplates } from "./templates/utilities.js";

import type { Template, TemplateCategory } from "./types.js";

// Re-export individual templates for direct imports
export * from "./templates/data-viz.js";
export * from "./templates/ai-workflows.js";
export * from "./templates/marketing.js";
export * from "./templates/utilities.js";

// ============================================
// Template Registry
// ============================================

/**
 * All templates combined
 */
export const allTemplates: Template[] = [
  ...dataVizTemplates,
  ...aiWorkflowTemplates,
  ...marketingTemplates,
  ...utilityTemplates,
];

/**
 * Core templates that work offline (no cloud required)
 * For FloImg Studio OSS and self-hosted deployments
 */
export const coreTemplates: Template[] = allTemplates.filter((t) => !t.requiresCloud);

/**
 * Cloud-only templates (require API keys like OpenAI, etc.)
 */
export const cloudTemplates: Template[] = allTemplates.filter((t) => t.requiresCloud);

// ============================================
// Query Functions
// ============================================

/**
 * Get all templates (includes cloud-only templates)
 */
export function getAllTemplates(): Template[] {
  return allTemplates;
}

/**
 * Get only core templates that work offline (for OSS Studio)
 */
export function getCoreTemplates(): Template[] {
  return coreTemplates;
}

/**
 * Get cloud-only templates (require API keys)
 */
export function getCloudTemplates(): Template[] {
  return cloudTemplates;
}

/**
 * Get a template by ID (searches all templates)
 */
export function getTemplateById(id: string): Template | undefined {
  return allTemplates.find((t) => t.id === id);
}

/**
 * Get a core template by ID (OSS-compatible only)
 */
export function getCoreTemplateById(id: string): Template | undefined {
  return coreTemplates.find((t) => t.id === id);
}

/**
 * Get all unique categories (from all templates)
 */
export function getCategories(): TemplateCategory[] {
  const categories = new Set<TemplateCategory>(allTemplates.map((t) => t.category));
  return Array.from(categories);
}

/**
 * Get categories available in core templates (OSS-compatible)
 */
export function getCoreCategories(): TemplateCategory[] {
  const categories = new Set<TemplateCategory>(coreTemplates.map((t) => t.category));
  return Array.from(categories);
}

/**
 * Get templates by category (from all templates)
 */
export function getTemplatesByCategory(category: TemplateCategory): Template[] {
  return allTemplates.filter((t) => t.category === category);
}

/**
 * Get core templates by category (OSS-compatible)
 */
export function getCoreTemplatesByCategory(category: TemplateCategory): Template[] {
  return coreTemplates.filter((t) => t.category === category);
}

/**
 * Get templates by generator type
 */
export function getTemplatesByGenerator(generator: string): Template[] {
  return allTemplates.filter((t) => t.generator === generator);
}

/**
 * Search templates by query (searches name, description, tags)
 */
export function searchTemplates(query: string): Template[] {
  const q = query.toLowerCase();
  return allTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.generator.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
  );
}

/**
 * Search core templates by query (OSS-compatible)
 */
export function searchCoreTemplates(query: string): Template[] {
  const q = query.toLowerCase();
  return coreTemplates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.generator.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
  );
}

/**
 * Get templates that require authentication
 */
export function getAuthRequiredTemplates(): Template[] {
  return allTemplates.filter((t) => t.requiresAuth);
}

/**
 * Get templates by capability
 */
export function getTemplatesByCapability(
  capability: keyof NonNullable<Template["capabilities"]>
): Template[] {
  return allTemplates.filter((t) => t.capabilities?.[capability]);
}

// ============================================
// Studio URL Helpers
// ============================================

/**
 * Get the Studio URL for a template
 * @param templateId - The template ID
 * @param baseUrl - Base URL (defaults to studio.floimg.com for cloud, or can be overridden for self-hosted)
 */
export function getStudioUrl(templateId: string, baseUrl = "https://studio.floimg.com"): string {
  return `${baseUrl}/?template=${templateId}`;
}

/**
 * Get the OSS Studio URL for a template (localhost default)
 * @param templateId - The template ID
 * @param port - Port number (defaults to 5173)
 */
export function getOSSStudioUrl(templateId: string, port = 5173): string {
  return `http://localhost:${port}/?template=${templateId}`;
}

/**
 * Resolve a template by ID
 * @param id - Template ID
 * @returns The template or undefined
 */
export function resolveTemplate(id: string): Template | undefined {
  return getTemplateById(id);
}
