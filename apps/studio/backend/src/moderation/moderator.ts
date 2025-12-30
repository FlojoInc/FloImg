/**
 * Content Moderation Service
 *
 * Uses OpenAI's Moderation API to scan content before it's saved to disk.
 * SCAN BEFORE SAVE - Nothing touches disk without passing moderation.
 *
 * Format handling:
 * - PNG, JPEG, GIF, WebP: Sent directly to OpenAI
 * - SVG: Converted to PNG via Resvg, then moderated
 * - AVIF: Passed through (not commonly abused, conversion complex)
 *
 * Configuration:
 * - OPENAI_API_KEY: Required for moderation to work (optional for self-hosted)
 * - MODERATION_STRICT_MODE: If "true", block content when moderation fails (default: false)
 */

import OpenAI from "openai";
import { Resvg } from "@resvg/resvg-js";
import { mkdir, appendFile } from "fs/promises";
import { join } from "path";

export interface ModerationResult {
  safe: boolean;
  flagged: boolean;
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
  categoryScores: Record<string, number>;
  flaggedCategories: string[];
}

export interface ModerationOptions {
  /** Skip moderation (for self-hosted instances without API key) */
  skip?: boolean;
}

// Singleton OpenAI client
let openaiClient: OpenAI | null = null;

// Configuration
let strictMode = false;
const INCIDENT_LOG_DIR = "./data/moderation";
const INCIDENT_LOG_FILE = "incidents.jsonl";

/**
 * Initialize the moderation service
 * Call this on server startup
 */
export function initModeration(): boolean {
  const apiKey = process.env.OPENAI_API_KEY;

  // Strict mode: block content if moderation fails
  // Default: false for self-hosted (permissive)
  strictMode = process.env.MODERATION_STRICT_MODE === "true";

  if (!apiKey) {
    console.warn("[Moderation] OPENAI_API_KEY not set. Content moderation is DISABLED.");
    console.warn("[Moderation] Set OPENAI_API_KEY to enable automatic content scanning.");
    return false;
  }

  openaiClient = new OpenAI({ apiKey });
  console.log("[Moderation] Content moderation enabled with OpenAI Moderation API");
  console.log(`[Moderation] Strict mode: ${strictMode ? "ON" : "OFF"} (block on API failures)`);
  return true;
}

/**
 * Check if moderation is available
 */
export function isModerationEnabled(): boolean {
  return openaiClient !== null;
}

/**
 * Check if strict mode is enabled (block on moderation failures)
 */
export function isStrictModeEnabled(): boolean {
  return strictMode;
}

/**
 * Moderate text content (chart labels, diagram text, etc.)
 */
export async function moderateText(text: string): Promise<ModerationResult> {
  if (!openaiClient) {
    // Moderation disabled - allow content through with warning
    return createPassResult();
  }

  try {
    const response = await openaiClient.moderations.create({
      model: "omni-moderation-latest",
      input: text,
    });

    const result = response.results[0];
    return convertOpenAIResult(result);
  } catch (error) {
    console.error("[Moderation] Text moderation failed:", error);
    // On error, err on the side of caution - block content
    return createBlockResult("Moderation service unavailable");
  }
}

/**
 * Moderate image content
 *
 * Handles format conversion for unsupported types:
 * - SVG: Converted to PNG via Resvg before moderation
 * - AVIF: Passed through (moderation skipped - not commonly abused)
 *
 * @param imageBuffer - Raw image bytes
 * @param mimeType - Image MIME type (image/png, image/jpeg, etc.)
 */
export async function moderateImage(
  imageBuffer: Buffer,
  mimeType: string = "image/png"
): Promise<ModerationResult> {
  if (!openaiClient) {
    // Moderation disabled - allow content through with warning
    return createPassResult();
  }

  let bufferToModerate = imageBuffer;
  let mimeToUse = mimeType;

  // Handle SVG: Convert to PNG for moderation (OpenAI doesn't support SVG)
  if (mimeType === "image/svg+xml") {
    try {
      const resvg = new Resvg(imageBuffer, { fitTo: { mode: "original" } });
      const pngData = resvg.render();
      bufferToModerate = pngData.asPng();
      mimeToUse = "image/png";
      console.log("[Moderation] Converted SVG to PNG for moderation");
    } catch (error) {
      console.error("[Moderation] Failed to convert SVG for moderation:", error);
      // If conversion fails, respect strict mode setting
      if (strictMode) {
        return createBlockResult("SVG conversion failed");
      }
      // Permissive mode: allow through if we can't convert
      console.warn("[Moderation] SVG conversion failed but strict mode OFF - allowing through");
      return createPassResult();
    }
  }

  // Handle AVIF: Not supported by OpenAI, pass through
  // AVIF is typically from deterministic transforms, not a common attack vector
  if (mimeType === "image/avif") {
    console.log("[Moderation] Skipping AVIF - format not supported by moderation API");
    return createPassResult();
  }

  try {
    // Convert buffer to base64 data URL
    const base64 = bufferToModerate.toString("base64");
    const dataUrl = `data:${mimeToUse};base64,${base64}`;

    const response = await openaiClient.moderations.create({
      model: "omni-moderation-latest",
      input: [
        {
          type: "image_url",
          image_url: {
            url: dataUrl,
          },
        },
      ],
    });

    const result = response.results[0];
    return convertOpenAIResult(result);
  } catch (error) {
    console.error("[Moderation] Image moderation failed:", error);
    // On error, err on the side of caution - block content
    return createBlockResult("Moderation service unavailable");
  }
}

/**
 * Moderate both text and image together
 * Useful for charts/diagrams that contain both text labels and generated images
 */
export async function moderateContent(
  text?: string,
  imageBuffer?: Buffer,
  mimeType?: string
): Promise<ModerationResult> {
  const results: ModerationResult[] = [];

  // Check text if provided
  if (text && text.trim().length > 0) {
    const textResult = await moderateText(text);
    results.push(textResult);
  }

  // Check image if provided
  if (imageBuffer && imageBuffer.length > 0) {
    const imageResult = await moderateImage(imageBuffer, mimeType);
    results.push(imageResult);
  }

  // If no content to check, pass
  if (results.length === 0) {
    return createPassResult();
  }

  // Combine results - flagged if ANY check is flagged
  return combineResults(results);
}

/**
 * Convert OpenAI moderation result to our format
 */
function convertOpenAIResult(result: OpenAI.Moderation): ModerationResult {
  const flaggedCategories: string[] = [];

  // Collect flagged categories
  for (const [category, flagged] of Object.entries(result.categories)) {
    if (flagged) {
      flaggedCategories.push(category);
    }
  }

  return {
    safe: !result.flagged,
    flagged: result.flagged,
    categories: {
      sexual: result.categories.sexual || false,
      sexualMinors: result.categories["sexual/minors"] || false,
      hate: result.categories.hate || false,
      hateThreatening: result.categories["hate/threatening"] || false,
      harassment: result.categories.harassment || false,
      harassmentThreatening: result.categories["harassment/threatening"] || false,
      selfHarm: result.categories["self-harm"] || false,
      selfHarmIntent: result.categories["self-harm/intent"] || false,
      selfHarmInstructions: result.categories["self-harm/instructions"] || false,
      violence: result.categories.violence || false,
      violenceGraphic: result.categories["violence/graphic"] || false,
    },
    categoryScores: result.category_scores as unknown as Record<string, number>,
    flaggedCategories,
  };
}

/**
 * Create a passing result (for when moderation is disabled)
 */
function createPassResult(): ModerationResult {
  return {
    safe: true,
    flagged: false,
    categories: {
      sexual: false,
      sexualMinors: false,
      hate: false,
      hateThreatening: false,
      harassment: false,
      harassmentThreatening: false,
      selfHarm: false,
      selfHarmIntent: false,
      selfHarmInstructions: false,
      violence: false,
      violenceGraphic: false,
    },
    categoryScores: {},
    flaggedCategories: [],
  };
}

/**
 * Create a blocking result (for errors/unavailability)
 */
function createBlockResult(reason: string): ModerationResult {
  return {
    safe: false,
    flagged: true,
    categories: {
      sexual: false,
      sexualMinors: false,
      hate: false,
      hateThreatening: false,
      harassment: false,
      harassmentThreatening: false,
      selfHarm: false,
      selfHarmIntent: false,
      selfHarmInstructions: false,
      violence: false,
      violenceGraphic: false,
    },
    categoryScores: {},
    flaggedCategories: [reason],
  };
}

/**
 * Combine multiple moderation results
 * Flagged if ANY result is flagged
 */
function combineResults(results: ModerationResult[]): ModerationResult {
  const combined = createPassResult();

  for (const result of results) {
    if (result.flagged) {
      combined.safe = false;
      combined.flagged = true;
      combined.flaggedCategories.push(...result.flaggedCategories);

      // Merge categories
      for (const [key, value] of Object.entries(result.categories)) {
        if (value) {
          (combined.categories as Record<string, boolean>)[key] = true;
        }
      }

      // Merge scores (take max)
      for (const [key, value] of Object.entries(result.categoryScores)) {
        const currentScore = combined.categoryScores[key] || 0;
        combined.categoryScores[key] = Math.max(currentScore, value);
      }
    }
  }

  // Dedupe flagged categories
  combined.flaggedCategories = [...new Set(combined.flaggedCategories)];

  return combined;
}

/**
 * Log a moderation incident for admin review
 * Writes to both console and a persistent log file
 */
export async function logModerationIncident(
  type: "generated" | "uploaded" | "error",
  result: ModerationResult,
  context?: Record<string, unknown>
): Promise<void> {
  const incident = {
    timestamp: new Date().toISOString(),
    type,
    flagged: result.flagged,
    categories: result.flaggedCategories,
    scores: result.categoryScores,
    context,
  };

  // Log to console
  console.warn("[Moderation] Incident:", JSON.stringify(incident));

  // Persist to log file (JSONL format - one JSON object per line)
  try {
    await mkdir(INCIDENT_LOG_DIR, { recursive: true });
    const logPath = join(INCIDENT_LOG_DIR, INCIDENT_LOG_FILE);
    await appendFile(logPath, JSON.stringify(incident) + "\n");
  } catch (error) {
    console.error("[Moderation] Failed to write incident log:", error);
  }
}

/**
 * Get recent moderation incidents (for admin dashboard)
 */
export async function getRecentIncidents(limit: number = 100): Promise<unknown[]> {
  try {
    const { readFile } = await import("fs/promises");
    const logPath = join(INCIDENT_LOG_DIR, INCIDENT_LOG_FILE);
    const content = await readFile(logPath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);
    const incidents = lines.map((line) => JSON.parse(line));
    // Return most recent first
    return incidents.reverse().slice(0, limit);
  } catch {
    return [];
  }
}
