/**
 * Content Moderation Module
 *
 * Provides content scanning using OpenAI's Moderation API.
 * SCAN BEFORE SAVE - Nothing touches disk without passing moderation.
 */

export {
  initModeration,
  isModerationEnabled,
  isStrictModeEnabled,
  moderateText,
  moderateImage,
  moderateContent,
  logModerationIncident,
  getRecentIncidents,
  type ModerationResult,
  type ModerationOptions,
} from "./moderator.js";
