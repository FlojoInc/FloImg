/**
 * Prompt Enhancement Module for Gemini Image Generation
 *
 * Automatically enhances user prompts based on Google's image generation best practices.
 * Uses rule-based pattern matching to detect prompt type and apply appropriate templates.
 *
 * Key principles from Google's guide:
 * - Describe the scene, don't just list keywords
 * - Be hyper-specific with details
 * - Use photographic/artistic terminology
 * - Provide context and intent
 */

/**
 * Prompt types that can be detected and enhanced
 */
export type PromptType =
  | "photorealistic"
  | "illustration"
  | "logo"
  | "product"
  | "minimalist"
  | "portrait"
  | "landscape"
  | "abstract"
  | "edit"
  | "general";

/**
 * Keywords that help identify prompt types
 */
const PROMPT_TYPE_KEYWORDS: Record<PromptType, string[]> = {
  photorealistic: [
    "photo",
    "photograph",
    "realistic",
    "real",
    "camera",
    "shot",
    "captured",
    "lens",
    "dslr",
    "photorealistic",
  ],
  portrait: ["portrait", "headshot", "face", "person", "man", "woman", "child", "people", "selfie"],
  landscape: [
    "landscape",
    "scenery",
    "mountain",
    "ocean",
    "forest",
    "sky",
    "sunset",
    "sunrise",
    "nature",
    "outdoor",
  ],
  illustration: [
    "illustration",
    "drawing",
    "cartoon",
    "anime",
    "comic",
    "sketch",
    "artwork",
    "artistic",
    "painted",
    "digital art",
  ],
  logo: ["logo", "brand", "icon", "emblem", "badge", "symbol", "wordmark", "monogram"],
  product: [
    "product",
    "e-commerce",
    "mockup",
    "packaging",
    "bottle",
    "box",
    "merchandise",
    "advertisement",
  ],
  minimalist: [
    "minimalist",
    "minimal",
    "simple",
    "clean",
    "negative space",
    "white space",
    "sparse",
  ],
  abstract: ["abstract", "geometric", "pattern", "texture", "shapes", "lines", "colors"],
  edit: [
    "change",
    "modify",
    "edit",
    "replace",
    "remove",
    "add",
    "transform",
    "adjust",
    "make",
    "turn",
  ],
  general: [],
};

/**
 * Photography terms to potentially add for realistic images
 */
const PHOTOGRAPHY_TERMS = {
  shotTypes: [
    "wide-angle shot",
    "close-up",
    "medium shot",
    "extreme close-up",
    "full shot",
    "establishing shot",
  ],
  lighting: [
    "soft natural light",
    "golden hour lighting",
    "dramatic side lighting",
    "diffused studio lighting",
    "backlit",
    "rim lighting",
  ],
  lenses: ["85mm portrait lens", "35mm lens", "50mm lens", "macro lens", "telephoto lens"],
  cameras: ["DSLR", "mirrorless camera", "medium format"],
  effects: ["shallow depth of field", "bokeh", "sharp focus", "soft focus"],
};

/**
 * Artistic style terms for illustrations
 */
const ARTISTIC_TERMS = {
  styles: [
    "vibrant colors",
    "muted palette",
    "high contrast",
    "soft gradients",
    "bold outlines",
    "cel-shading",
  ],
  techniques: [
    "digital painting",
    "watercolor style",
    "oil painting style",
    "pencil sketch",
    "vector art",
  ],
};

/**
 * Detect the type of prompt based on keywords
 */
export function detectPromptType(prompt: string): PromptType {
  const lowerPrompt = prompt.toLowerCase();

  // Check for edit-specific patterns first (for image editing context)
  const editPatterns = [
    /^(change|modify|edit|replace|remove|add|make|turn)\b/i,
    /\b(the|this) (image|photo|picture)\b/i,
  ];
  if (editPatterns.some((pattern) => pattern.test(prompt))) {
    return "edit";
  }

  // Score each type based on keyword matches
  const scores: Record<PromptType, number> = {
    photorealistic: 0,
    portrait: 0,
    landscape: 0,
    illustration: 0,
    logo: 0,
    product: 0,
    minimalist: 0,
    abstract: 0,
    edit: 0,
    general: 0,
  };

  for (const [type, keywords] of Object.entries(PROMPT_TYPE_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerPrompt.includes(keyword.toLowerCase())) {
        scores[type as PromptType] += 1;
      }
    }
  }

  // Find highest scoring type
  let maxScore = 0;
  let detectedType: PromptType = "general";

  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      detectedType = type as PromptType;
    }
  }

  return detectedType;
}

/**
 * Check if a prompt is already detailed enough
 * Detailed prompts have sufficient length and descriptive words
 */
export function isPromptDetailed(prompt: string): boolean {
  const wordCount = prompt.split(/\s+/).length;

  // Short prompts definitely need enhancement
  if (wordCount < 5) return false;

  // Long prompts are likely already detailed
  if (wordCount > 30) return true;

  // Check for descriptive indicators
  const descriptivePatterns = [
    /\b(with|featuring|showing|displaying)\b/i,
    /\b(lighting|light|lit|illuminated)\b/i,
    /\b(style|styled|aesthetic)\b/i,
    /\b(detailed|intricate|elaborate)\b/i,
    /\b(background|foreground|setting|scene)\b/i,
    /\b(color|colours?|palette)\b/i,
    /\b(angle|perspective|view|shot)\b/i,
  ];

  const matchCount = descriptivePatterns.filter((p) => p.test(prompt)).length;

  // If several descriptive elements present, consider it detailed
  return matchCount >= 3;
}

/**
 * Extract the main subject from a prompt
 */
function extractSubject(prompt: string): string {
  // Common patterns: "a/an [subject]", "[subject] with", "of a/an [subject]"
  const patterns = [
    /^(?:a|an|the)\s+([^,.]+)/i,
    /(?:of|featuring|showing)\s+(?:a|an|the)?\s*([^,.]+)/i,
    /^([^,.]{3,30})/i, // Fallback: first part of prompt
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return prompt.slice(0, 50);
}

/**
 * Enhance a photorealistic/portrait prompt
 */
function enhancePhotorealistic(prompt: string, _subject: string): string {
  const hasLighting = /\b(light|lighting|lit|illuminated)\b/i.test(prompt);
  const hasCamera = /\b(camera|lens|shot|captured|dslr)\b/i.test(prompt);

  let enhanced = prompt;

  // Add shot type if not present
  if (!/\b(shot|close-up|portrait|wide|angle)\b/i.test(prompt)) {
    enhanced = `A photorealistic ${enhanced}`;
  }

  // Add lighting if not present
  if (!hasLighting) {
    const lighting =
      PHOTOGRAPHY_TERMS.lighting[Math.floor(Math.random() * PHOTOGRAPHY_TERMS.lighting.length)];
    enhanced += `. The scene is illuminated by ${lighting}`;
  }

  // Add camera details if not present
  if (!hasCamera) {
    enhanced += ". Captured with professional photography equipment, sharp focus, high detail";
  }

  return enhanced;
}

/**
 * Enhance an illustration prompt
 */
function enhanceIllustration(prompt: string, subject: string): string {
  const hasStyle = /\b(style|art|artistic|drawing|painted)\b/i.test(prompt);
  const hasColors = /\b(color|colour|palette|vibrant|muted)\b/i.test(prompt);

  let enhanced = prompt;

  // Add style description if not present
  if (!hasStyle) {
    enhanced = `A detailed illustration of ${subject}`;
  }

  // Add color/style details
  if (!hasColors) {
    const style = ARTISTIC_TERMS.styles[Math.floor(Math.random() * ARTISTIC_TERMS.styles.length)];
    enhanced += `, ${style}`;
  }

  enhanced += ". Clean composition with attention to detail";

  return enhanced;
}

/**
 * Enhance a logo prompt
 */
function enhanceLogo(prompt: string, _subject: string): string {
  let enhanced = prompt;

  // Ensure it mentions logo design principles
  if (!/\b(modern|minimalist|professional|clean)\b/i.test(prompt)) {
    enhanced = `Create a modern, professional ${enhanced}`;
  }

  if (!/\b(background)\b/i.test(prompt)) {
    enhanced += ". Clean background suitable for various uses";
  }

  if (!/\b(scalable|vector)\b/i.test(prompt)) {
    enhanced += ". Design should be bold and legible at any size";
  }

  return enhanced;
}

/**
 * Enhance a product photography prompt
 */
function enhanceProduct(prompt: string, subject: string): string {
  let enhanced = prompt;

  if (!/\b(studio|professional|high-resolution)\b/i.test(prompt)) {
    enhanced = `A high-resolution, studio-lit product photograph of ${subject}`;
  }

  if (!/\b(background|surface)\b/i.test(prompt)) {
    enhanced += " on a clean, neutral background";
  }

  if (!/\b(lighting)\b/i.test(prompt)) {
    enhanced += ". Professional three-point lighting setup with soft shadows";
  }

  enhanced += ". Ultra-realistic with sharp focus on product details";

  return enhanced;
}

/**
 * Enhance a minimalist prompt
 */
function enhanceMinimalist(prompt: string, subject: string): string {
  let enhanced = prompt;

  if (!/\b(composition|positioned|placed)\b/i.test(prompt)) {
    enhanced = `A minimalist composition featuring ${subject}`;
  }

  if (!/\b(negative space|white space|empty)\b/i.test(prompt)) {
    enhanced += " with significant negative space";
  }

  if (!/\b(lighting|soft|subtle)\b/i.test(prompt)) {
    enhanced += ". Soft, subtle lighting";
  }

  return enhanced;
}

/**
 * Enhance an edit prompt (for image editing context)
 */
function enhanceEditPrompt(prompt: string): string {
  let enhanced = prompt;

  // Add preservation instruction if not present
  if (!/\b(keep|preserve|maintain|unchanged)\b/i.test(prompt)) {
    enhanced += ". Preserve the original style, lighting, and composition for unchanged areas";
  }

  // Add integration instruction for additions
  if (
    /\b(add|place|put|include)\b/i.test(prompt) &&
    !/\b(naturally|seamlessly|blend)\b/i.test(prompt)
  ) {
    enhanced = enhanced.replace(/\.$/, "") + ", seamlessly integrated into the scene";
  }

  return enhanced;
}

/**
 * Enhance a general prompt that doesn't fit other categories
 */
function enhanceGeneral(prompt: string, _subject: string): string {
  let enhanced = prompt;

  // Add basic scene description
  if (prompt.split(/\s+/).length < 8) {
    enhanced = `A detailed image of ${enhanced}`;
  }

  // Add quality indicators
  if (!/\b(detailed|high quality|professional)\b/i.test(prompt)) {
    enhanced += ". High quality, detailed rendering";
  }

  return enhanced;
}

/**
 * Main enhancement function
 *
 * Enhances a prompt based on detected type and Google's best practices.
 * Returns the original prompt if it's already detailed enough.
 *
 * @param prompt - The user's original prompt
 * @param context - Optional context: "generate" for text-to-image, "edit" for image editing
 * @returns Enhanced prompt string
 */
export function enhancePrompt(prompt: string, context: "generate" | "edit" = "generate"): string {
  // Don't enhance empty or very short prompts
  if (!prompt || prompt.trim().length < 2) {
    return prompt;
  }

  const trimmedPrompt = prompt.trim();

  // Check if already detailed
  if (isPromptDetailed(trimmedPrompt)) {
    return trimmedPrompt;
  }

  // Detect prompt type
  let promptType = detectPromptType(trimmedPrompt);

  // Override to edit type if in edit context and not already detected as edit
  if (context === "edit" && promptType !== "edit") {
    // Check if it looks like an edit instruction
    const isEditInstruction = /^(change|modify|make|add|remove|replace|turn)/i.test(trimmedPrompt);
    if (isEditInstruction) {
      promptType = "edit";
    }
  }

  const subject = extractSubject(trimmedPrompt);

  // Apply type-specific enhancement
  switch (promptType) {
    case "photorealistic":
    case "portrait":
    case "landscape":
      return enhancePhotorealistic(trimmedPrompt, subject);

    case "illustration":
      return enhanceIllustration(trimmedPrompt, subject);

    case "logo":
      return enhanceLogo(trimmedPrompt, subject);

    case "product":
      return enhanceProduct(trimmedPrompt, subject);

    case "minimalist":
      return enhanceMinimalist(trimmedPrompt, subject);

    case "edit":
      return enhanceEditPrompt(trimmedPrompt);

    case "abstract":
    case "general":
    default:
      return enhanceGeneral(trimmedPrompt, subject);
  }
}
