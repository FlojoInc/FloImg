/**
 * AI Workflow Templates
 *
 * Templates that use AI image generation (OpenAI DALL-E, etc.)
 * These require API keys (cloud deployment) to execute.
 */

import type { Template } from "../types.js";

/**
 * AI Product Photography
 * Canonical ID: ai-product-shot
 */
export const aiProductShot: Template = {
  id: "ai-product-shot",
  name: "AI Product Photography",
  description: "Generate professional product images with AI-controlled lighting and backgrounds",
  category: "AI Workflows",
  generator: "openai",
  tags: ["product", "ecommerce", "photography", "dall-e", "ai"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {},
  icon: "sparkles",
  valueProp: "Professional product photos in seconds",
  preview: {
    imageUrl: "/showcase/ai-generation/product-headphones.png",
  },
  codeExample: `const image = await floimg.generate({
  generator: 'openai',
  params: {
    prompt: 'Professional product photo of headphones on white background',
    size: '1024x1024'
  }
});`,
  seo: {
    title: "AI Product Photography Template",
    description: "Generate professional product photos with AI-controlled lighting and backgrounds",
    keywords: ["product photography", "ai generation", "ecommerce", "dall-e"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-ai",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "openai",
          params: {
            prompt:
              "Professional product photo of modern wireless headphones on a clean white background, studio lighting, high-end commercial photography style",
            model: "dall-e-3",
            size: "1024x1024",
            quality: "hd",
          },
        },
      },
    ],
    edges: [],
  },
};

/**
 * AI Hero Image
 * Canonical ID: ai-hero-image
 */
export const aiHeroImage: Template = {
  id: "ai-hero-image",
  name: "AI Hero Image",
  description: "Create stunning hero images for websites and landing pages",
  category: "AI Workflows",
  generator: "openai",
  tags: ["hero", "landing-page", "marketing", "dall-e", "ai"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {},
  icon: "sparkles",
  valueProp: "Stunning hero images for your landing page",
  preview: {
    imageUrl: "/showcase/ai-generation/futuristic-city.png",
  },
  codeExample: `const image = await floimg.generate({
  generator: 'openai',
  params: {
    prompt: 'Futuristic city skyline at sunset, cinematic lighting',
    size: '1792x1024'
  }
});`,
  seo: {
    title: "AI Hero Image Generator",
    description: "Generate stunning hero images for websites and landing pages with AI",
    keywords: ["hero image", "landing page", "ai generation", "website design"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-ai",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "openai",
          params: {
            prompt:
              "Futuristic city skyline at golden hour sunset, cinematic wide angle, volumetric lighting, sci-fi architecture, dramatic clouds, professional photography",
            model: "dall-e-3",
            size: "1792x1024",
            quality: "hd",
          },
        },
      },
    ],
    edges: [],
  },
};

/**
 * AI Mascot Generator
 * Canonical ID: ai-mascot
 */
export const aiMascot: Template = {
  id: "ai-mascot",
  name: "AI Mascot Generator",
  description: "Design unique mascots and characters for your brand",
  category: "AI Workflows",
  generator: "openai",
  tags: ["mascot", "character", "branding", "dall-e", "ai"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {},
  icon: "sparkles",
  valueProp: "Unique mascots for your brand",
  preview: {
    imageUrl: "/showcase/ai-generation/robot-mascot.png",
  },
  seo: {
    title: "AI Mascot Generator",
    description: "Create unique brand mascots and characters with AI",
    keywords: ["mascot design", "character design", "branding", "ai generation"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-ai",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "openai",
          params: {
            prompt:
              "Friendly robot mascot character, modern flat design style, vibrant teal and purple colors, simple geometric shapes, suitable for tech company branding, white background",
            model: "dall-e-3",
            size: "1024x1024",
            quality: "hd",
          },
        },
      },
    ],
    edges: [],
  },
};

/**
 * AI Logo to Brand Kit (Cloud Onboarding)
 * Canonical ID: cloud-ai-logo-brand
 */
export const aiLogoBrandKit: Template = {
  id: "cloud-ai-logo-brand",
  name: "AI Logo to Brand Kit",
  description: "Generate a logo with AI, then create production-ready brand assets",
  category: "AI Workflows",
  generator: "openai",
  tags: ["ai", "logo", "branding", "dall-e", "pipeline"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {
    pipeline: true,
  },
  icon: "sparkles",
  valueProp: "From idea to brand kit in seconds",
  seo: {
    title: "AI Logo to Brand Kit",
    description: "Generate a logo with AI and create production-ready brand assets",
    keywords: ["logo design", "brand kit", "ai generation", "branding"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-ai",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "openai",
          params: {
            prompt:
              "A modern minimalist logo for a tech startup called 'Nexus', clean geometric lines, professional, suitable for business cards and websites, white background",
            model: "dall-e-3",
            size: "1024x1024",
            quality: "standard",
          },
        },
      },
      {
        id: "transform-bg",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "removeBackground",
          params: {},
        },
      },
      {
        id: "transform-watermark",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "addCaption",
          params: {
            text: "Nexus Inc.",
            position: "bottom-right",
            fontSize: 14,
            color: "#6B7280",
            padding: 16,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-ai", target: "transform-bg" },
      { id: "e2", source: "transform-bg", target: "transform-watermark" },
    ],
  },
};

/**
 * Product Photo Enhancement (Cloud Onboarding)
 * Canonical ID: cloud-product-enhance
 */
export const productPhotoEnhancement: Template = {
  id: "cloud-product-enhance",
  name: "Product Photo Enhancement",
  description: "Remove background and add professional product labeling",
  category: "AI Workflows",
  generator: "input",
  tags: ["product", "ecommerce", "background-removal", "pipeline"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: false, // Uses AI transforms but not AI generation
  aiCreditsNeeded: 0,
  capabilities: {
    pipeline: true,
  },
  icon: "image",
  valueProp: "E-commerce ready in one click",
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 150 },
        data: {},
      },
      {
        id: "transform-bg",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "removeBackground",
          params: {},
        },
      },
      {
        id: "transform-caption",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "addCaption",
          params: {
            text: "Premium Quality",
            position: "bottom-center",
            fontSize: 24,
            color: "#18181B",
            padding: 20,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-bg" },
      { id: "e2", source: "transform-bg", target: "transform-caption" },
    ],
  },
};

/**
 * AI Art to Social Post (Cloud Onboarding)
 * Canonical ID: cloud-ai-social
 */
export const aiArtSocialPost: Template = {
  id: "cloud-ai-social",
  name: "AI Art to Social Post",
  description: "Generate creative AI art, optimize for social media",
  category: "AI Workflows",
  generator: "openai",
  tags: ["ai", "art", "social-media", "dall-e", "pipeline"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {
    pipeline: true,
  },
  icon: "share",
  valueProp: "Creative content for your feed",
  workflow: {
    nodes: [
      {
        id: "gen-ai",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "openai",
          params: {
            prompt:
              "Abstract colorful digital art with flowing gradients, trending on artstation, vibrant neon colors, perfect for social media",
            model: "dall-e-3",
            size: "1024x1024",
            style: "vivid",
          },
        },
      },
      {
        id: "transform-corners",
        type: "transform",
        position: { x: 400, y: 100 },
        data: {
          operation: "roundCorners",
          params: {
            radius: 24,
          },
        },
      },
      {
        id: "transform-caption",
        type: "transform",
        position: { x: 700, y: 100 },
        data: {
          operation: "addCaption",
          params: {
            text: "@floimg",
            position: "bottom-right",
            fontSize: 18,
            color: "#FFFFFF",
            padding: 16,
          },
        },
      },
      {
        id: "transform-webp",
        type: "transform",
        position: { x: 1000, y: 100 },
        data: {
          operation: "convert",
          params: {
            to: "image/webp",
            quality: 85,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-ai", target: "transform-corners" },
      { id: "e2", source: "transform-corners", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-webp" },
    ],
  },
};

/**
 * All AI workflow templates
 */
export const aiWorkflowTemplates: Template[] = [
  aiProductShot,
  aiHeroImage,
  aiMascot,
  aiLogoBrandKit,
  productPhotoEnhancement,
  aiArtSocialPost,
];
