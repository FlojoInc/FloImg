/**
 * AI Workflow Templates
 *
 * Templates that use AI image generation (OpenAI DALL-E, etc.)
 * These require API keys (cloud deployment) to execute.
 */

import type { Template } from "../types.js";

/**
 * AI Product Photography for E-commerce
 * Canonical ID: ai-product-shot
 *
 * Multi-step workflow: AI generate → Remove background → Resize for listing → Add watermark
 * JTBD: Create e-commerce-ready product photos with transparent backgrounds and consistent sizing
 */
export const aiProductShot: Template = {
  id: "ai-product-shot",
  name: "AI Product Photography",
  description: "Generate AI product photos with background removal and e-commerce-ready sizing",
  category: "AI Workflows",
  generator: "openai",
  tags: ["product", "ecommerce", "photography", "dall-e", "ai", "pipeline", "background-removal"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {
    pipeline: true,
  },
  icon: "sparkles",
  valueProp: "E-commerce-ready product photos in seconds",
  preview: {
    imageUrl: "/showcase/ai-generation/product-headphones.png",
  },
  codeExample: `const product = await floimg
  .generate('openai', {
    prompt: 'Professional product photo of headphones on white background',
    model: 'dall-e-3',
    size: '1024x1024'
  })
  .transform('removeBackground')
  .transform('resize', { width: 800, height: 800, fit: 'contain', background: '#ffffff' })
  .transform('addCaption', { text: 'SKU-12345', position: 'bottom-right', fontSize: 12 })
  .toBlob();`,
  seo: {
    title: "AI Product Photography Template",
    description: "Generate e-commerce-ready product photos with AI and background removal",
    keywords: ["product photography", "ai generation", "ecommerce", "background removal"],
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
        id: "transform-resize",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 800,
            height: 800,
            fit: "contain",
            background: "#ffffff",
          },
        },
      },
      {
        id: "transform-caption",
        type: "transform",
        position: { x: 1000, y: 150 },
        data: {
          operation: "addCaption",
          params: {
            text: "SKU-12345",
            position: "bottom-right",
            fontSize: 12,
            color: "#9CA3AF",
            padding: 8,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-ai", target: "transform-bg" },
      { id: "e2", source: "transform-bg", target: "transform-resize" },
      { id: "e3", source: "transform-resize", target: "transform-caption" },
    ],
  },
};

/**
 * AI Hero Image for Landing Pages
 * Canonical ID: ai-hero-image
 *
 * Multi-step workflow: AI generate → Resize to OG dimensions → Round corners → WebP for fast loading
 * JTBD: Create landing page hero images optimized for web performance and social sharing
 */
export const aiHeroImage: Template = {
  id: "ai-hero-image",
  name: "AI Hero Image",
  description: "Generate landing page hero images optimized for web and social sharing",
  category: "AI Workflows",
  generator: "openai",
  tags: ["hero", "landing-page", "marketing", "dall-e", "ai", "pipeline", "og-image"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {
    pipeline: true,
  },
  icon: "sparkles",
  valueProp: "Landing page hero images in seconds",
  preview: {
    imageUrl: "/showcase/ai-generation/futuristic-city.png",
  },
  codeExample: `const hero = await floimg
  .generate('openai', {
    prompt: 'Futuristic city skyline at sunset, cinematic lighting',
    model: 'dall-e-3',
    size: '1792x1024'
  })
  .transform('resize', { width: 1200, height: 630 }) // OG image dimensions
  .transform('roundCorners', { radius: 8 })
  .transform('convert', { to: 'image/webp', quality: 85 })
  .toBlob();`,
  seo: {
    title: "AI Hero Image Generator",
    description: "Generate landing page hero images optimized for web and social sharing",
    keywords: ["hero image", "landing page", "og image", "social sharing"],
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 1200,
            height: 630,
            fit: "cover",
          },
        },
      },
      {
        id: "transform-corners",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "roundCorners",
          params: {
            radius: 8,
          },
        },
      },
      {
        id: "transform-webp",
        type: "transform",
        position: { x: 1000, y: 150 },
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
      { id: "e1", source: "gen-ai", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-corners" },
      { id: "e3", source: "transform-corners", target: "transform-webp" },
    ],
  },
};

/**
 * AI Mascot with Brand Kit Export
 * Canonical ID: ai-mascot
 *
 * Multi-step workflow: AI generate → Remove background → Export multiple sizes for different uses
 * JTBD: Create mascot assets ready for favicon, social avatars, and website use
 */
export const aiMascot: Template = {
  id: "ai-mascot",
  name: "AI Mascot Generator",
  description: "Generate mascot with transparent background and multiple export sizes",
  category: "AI Workflows",
  generator: "openai",
  tags: ["mascot", "character", "branding", "dall-e", "ai", "pipeline", "favicon", "avatar"],
  requiresCloud: true,
  requiresAuth: true,
  usesAI: true,
  aiCreditsNeeded: 1,
  capabilities: {
    pipeline: true,
  },
  icon: "sparkles",
  valueProp: "Brand-ready mascot assets in seconds",
  preview: {
    imageUrl: "/showcase/ai-generation/robot-mascot.png",
  },
  codeExample: `const mascot = await floimg
  .generate('openai', {
    prompt: 'Friendly robot mascot, modern flat design, teal colors, white background',
    model: 'dall-e-3',
    size: '1024x1024'
  })
  .transform('removeBackground')
  .transform('resize', { width: 512, height: 512, fit: 'contain' })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "AI Mascot Generator",
    description: "Create brand mascots with transparent backgrounds ready for any use",
    keywords: ["mascot design", "character design", "branding", "favicon"],
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
        id: "transform-resize",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 512,
            height: 512,
            fit: "contain",
          },
        },
      },
      {
        id: "transform-png",
        type: "transform",
        position: { x: 1000, y: 150 },
        data: {
          operation: "convert",
          params: {
            to: "image/png",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-ai", target: "transform-bg" },
      { id: "e2", source: "transform-bg", target: "transform-resize" },
      { id: "e3", source: "transform-resize", target: "transform-png" },
    ],
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
