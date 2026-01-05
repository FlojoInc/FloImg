/**
 * Marketing Templates
 *
 * Social media kits, branding, and promotional asset workflows.
 * Most are pipeline templates that work offline (OSS-compatible).
 */

import type { Template } from "../types.js";

/**
 * Social Media Kit
 * Canonical ID: social-media-kit
 */
export const socialMediaKit: Template = {
  id: "social-media-kit",
  name: "Social Media Kit",
  description: "Generate optimized images for all social platforms from one source",
  category: "Marketing",
  generator: "pipeline",
  tags: ["social", "og-image", "twitter", "instagram", "resize"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "share",
  preview: {
    imageUrl: "/showcase/pipelines/output/og-image.png",
  },
  codeExample: `// One source -> all platforms
const socialKit = await floimg.pipeline(heroImage, [
  { op: 'resize', params: { width: 1200, height: 630 }, save: 'og-image.png' },
  { op: 'resize', params: { width: 800, height: 418 }, save: 'twitter-card.png' },
  { op: 'resize', params: { width: 1080, height: 1080 }, save: 'instagram.png' },
]);`,
  seo: {
    title: "Social Media Kit Generator",
    description: "Generate optimized images for all social platforms from one source image",
    keywords: ["social media", "og image", "twitter card", "instagram", "image resize"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {},
      },
      {
        id: "transform-og",
        type: "transform",
        position: { x: 400, y: 100 },
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
        id: "transform-twitter",
        type: "transform",
        position: { x: 400, y: 200 },
        data: {
          operation: "resize",
          params: {
            width: 800,
            height: 418,
            fit: "cover",
          },
        },
      },
      {
        id: "transform-instagram",
        type: "transform",
        position: { x: 400, y: 300 },
        data: {
          operation: "resize",
          params: {
            width: 1080,
            height: 1080,
            fit: "cover",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-og" },
      { id: "e2", source: "input-1", target: "transform-twitter" },
      { id: "e3", source: "input-1", target: "transform-instagram" },
    ],
  },
};

/**
 * Avatar Processing Pipeline
 * Canonical ID: avatar-pipeline
 */
export const avatarPipeline: Template = {
  id: "avatar-pipeline",
  name: "Avatar Processing",
  description: "Generate consistent avatar sizes with circular crop and optimization",
  category: "Marketing",
  generator: "pipeline",
  tags: ["avatar", "profile", "resize", "crop", "user"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/avatar-128.png",
  },
  codeExample: `const avatars = await floimg.pipeline(photo, [
  { op: 'crop', params: { shape: 'circle' } },
  { op: 'resize', params: { width: 256 }, save: 'avatar-256.png' },
  { op: 'resize', params: { width: 128 }, save: 'avatar-128.png' },
  { op: 'resize', params: { width: 64 }, save: 'avatar-64.png' },
]);`,
  seo: {
    title: "Avatar Processing Pipeline",
    description: "Generate consistent avatar sizes with circular crop and optimization",
    keywords: ["avatar", "profile picture", "image resize", "circular crop"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {},
      },
      {
        id: "transform-crop",
        type: "transform",
        position: { x: 350, y: 200 },
        data: {
          operation: "crop",
          params: {
            shape: "circle",
          },
        },
      },
      {
        id: "transform-256",
        type: "transform",
        position: { x: 600, y: 100 },
        data: {
          operation: "resize",
          params: {
            width: 256,
            height: 256,
          },
        },
      },
      {
        id: "transform-128",
        type: "transform",
        position: { x: 600, y: 200 },
        data: {
          operation: "resize",
          params: {
            width: 128,
            height: 128,
          },
        },
      },
      {
        id: "transform-64",
        type: "transform",
        position: { x: 600, y: 300 },
        data: {
          operation: "resize",
          params: {
            width: 64,
            height: 64,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-crop" },
      { id: "e2", source: "transform-crop", target: "transform-256" },
      { id: "e3", source: "transform-crop", target: "transform-128" },
      { id: "e4", source: "transform-crop", target: "transform-64" },
    ],
  },
};

/**
 * Branded Watermark
 * Canonical ID: watermark-branding
 */
export const watermarkBranding: Template = {
  id: "watermark-branding",
  name: "Branded Watermark",
  description: "Add your logo watermark to images automatically",
  category: "Marketing",
  generator: "pipeline",
  tags: ["watermark", "branding", "logo", "protection", "copyright"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/watermark-branded.png",
  },
  seo: {
    title: "Branded Watermark Template",
    description: "Add professional watermarks to protect and brand your images",
    keywords: ["watermark", "branding", "image protection", "logo overlay"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "quickchart",
          params: {
            chart: {
              type: "bar",
              data: {
                labels: ["Mon", "Tue", "Wed", "Thu", "Fri"],
                datasets: [
                  {
                    label: "Sales",
                    data: [45, 62, 38, 71, 55],
                    backgroundColor: "rgba(99, 102, 241, 0.8)",
                  },
                ],
              },
            },
            width: 600,
            height: 400,
          },
        },
      },
      {
        id: "transform-1",
        type: "transform",
        position: { x: 400, y: 100 },
        data: {
          operation: "addCaption",
          params: {
            text: "floimg.com",
            position: "bottom-right",
            fontSize: 14,
            color: "#9ca3af",
            padding: 10,
          },
        },
      },
      {
        id: "transform-2",
        type: "transform",
        position: { x: 700, y: 100 },
        data: {
          operation: "roundCorners",
          params: {
            radius: 16,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-1", target: "transform-1" },
      { id: "e2", source: "transform-1", target: "transform-2" },
    ],
  },
};

/**
 * Image Filters
 * Canonical ID: filter-showcase
 */
export const filterShowcase: Template = {
  id: "filter-showcase",
  name: "Image Filters",
  description: "Apply artistic filters: vintage, dramatic, vibrant, and more",
  category: "Marketing",
  generator: "pipeline",
  tags: ["filter", "vintage", "effects", "artistic", "photo"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/filter-vintage.png",
  },
  seo: {
    title: "Image Filter Effects",
    description: "Apply artistic filters like vintage, dramatic, and vibrant effects",
    keywords: ["image filter", "photo effects", "vintage filter", "artistic"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {},
      },
      {
        id: "transform-vintage",
        type: "transform",
        position: { x: 400, y: 100 },
        data: {
          operation: "adjustColors",
          params: {
            saturation: 0.7,
            brightness: 0.9,
            sepia: 0.3,
          },
        },
      },
      {
        id: "transform-vibrant",
        type: "transform",
        position: { x: 400, y: 200 },
        data: {
          operation: "adjustColors",
          params: {
            saturation: 1.4,
            contrast: 1.2,
          },
        },
      },
      {
        id: "transform-dramatic",
        type: "transform",
        position: { x: 400, y: 300 },
        data: {
          operation: "adjustColors",
          params: {
            contrast: 1.5,
            brightness: 0.8,
            saturation: 0.9,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-vintage" },
      { id: "e2", source: "input-1", target: "transform-vibrant" },
      { id: "e3", source: "input-1", target: "transform-dramatic" },
    ],
  },
};

/**
 * Responsive Image Pipeline
 * Canonical ID: responsive-images
 *
 * Multi-step workflow: Input → 5 parallel resize branches for responsive web
 * JTBD: Generate all responsive image sizes from one source for web performance
 */
export const responsiveImages: Template = {
  id: "responsive-images",
  name: "Responsive Image Pipeline",
  description: "Generate thumbnail, mobile, tablet, desktop, and retina sizes from one source",
  category: "Marketing",
  generator: "pipeline",
  tags: ["responsive", "web", "performance", "srcset", "resize", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/responsive-desktop.png",
  },
  codeExample: `// One source → all responsive sizes
const responsive = await floimg.from(source)
  .transform('resize', { width: 320 })   // Mobile
  .transform('resize', { width: 768 })   // Tablet
  .transform('resize', { width: 1024 })  // Desktop
  .transform('resize', { width: 2048 })  // Retina
  .toBlob();`,
  seo: {
    title: "Responsive Image Pipeline",
    description: "Generate all responsive image sizes for web srcset from one source",
    keywords: ["responsive images", "srcset", "web performance", "image optimization"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 250 },
        data: {},
      },
      {
        id: "transform-thumb",
        type: "transform",
        position: { x: 400, y: 50 },
        data: {
          operation: "resize",
          params: {
            width: 150,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-mobile",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 320,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-tablet",
        type: "transform",
        position: { x: 400, y: 250 },
        data: {
          operation: "resize",
          params: {
            width: 768,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-desktop",
        type: "transform",
        position: { x: 400, y: 350 },
        data: {
          operation: "resize",
          params: {
            width: 1024,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-retina",
        type: "transform",
        position: { x: 400, y: 450 },
        data: {
          operation: "resize",
          params: {
            width: 2048,
            fit: "inside",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-thumb" },
      { id: "e2", source: "input-1", target: "transform-mobile" },
      { id: "e3", source: "input-1", target: "transform-tablet" },
      { id: "e4", source: "input-1", target: "transform-desktop" },
      { id: "e5", source: "input-1", target: "transform-retina" },
    ],
  },
};

/**
 * Team Headshot Standardizer
 * Canonical ID: team-headshots
 *
 * Multi-step workflow: Input → Crop square → Resize → Grayscale → PNG export
 * JTBD: Standardize team photos for about pages and directories
 */
export const teamHeadshots: Template = {
  id: "team-headshots",
  name: "Team Headshot Standardizer",
  description: "Standardize team photos with consistent sizing and professional styling",
  category: "Marketing",
  generator: "pipeline",
  tags: ["headshot", "team", "about-page", "profile", "standardize", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/headshot-standard.png",
  },
  codeExample: `const headshot = await floimg.from(photo)
  .transform('extract', { width: 400, height: 400, gravity: 'face' })
  .transform('resize', { width: 300, height: 300 })
  .transform('grayscale')
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "Team Headshot Standardizer",
    description: "Standardize team photos with consistent sizing for about pages",
    keywords: ["headshot", "team photo", "about page", "profile picture"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 150 },
        data: {},
      },
      {
        id: "transform-crop",
        type: "transform",
        position: { x: 350, y: 150 },
        data: {
          operation: "extract",
          params: {
            width: 400,
            height: 400,
            gravity: "center",
          },
        },
      },
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 600, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 300,
            height: 300,
            fit: "cover",
          },
        },
      },
      {
        id: "transform-grayscale",
        type: "transform",
        position: { x: 850, y: 150 },
        data: {
          operation: "grayscale",
          params: {},
        },
      },
      {
        id: "transform-png",
        type: "transform",
        position: { x: 1100, y: 150 },
        data: {
          operation: "convert",
          params: {
            to: "image/png",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-crop" },
      { id: "e2", source: "transform-crop", target: "transform-resize" },
      { id: "e3", source: "transform-resize", target: "transform-grayscale" },
      { id: "e4", source: "transform-grayscale", target: "transform-png" },
    ],
  },
};

/**
 * Screenshot to Documentation Asset
 * Canonical ID: screenshot-docs
 *
 * Multi-step workflow: Screenshot URL → Resize → Add border/shadow → Optimize
 * JTBD: Prepare screenshots for documentation and README files
 */
export const screenshotDocs: Template = {
  id: "screenshot-docs",
  name: "Screenshot to Docs",
  description: "Prepare screenshots for documentation with borders and optimization",
  category: "Marketing",
  generator: "screenshot",
  tags: ["screenshot", "documentation", "readme", "border", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/screenshot-docs.png",
  },
  codeExample: `const docImage = await floimg
  .generate('screenshot', { url: 'https://example.com', width: 1280 })
  .transform('resize', { width: 800, fit: 'inside' })
  .transform('extend', { top: 16, bottom: 16, left: 16, right: 16, background: '#f3f4f6' })
  .transform('roundCorners', { radius: 8 })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "Screenshot to Documentation Asset",
    description: "Prepare screenshots for documentation with professional styling",
    keywords: ["screenshot", "documentation", "readme", "developer tools"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "screenshot",
          params: {
            url: "https://floimg.com",
            width: 1280,
            height: 800,
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
            width: 800,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-border",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "extend",
          params: {
            top: 16,
            bottom: 16,
            left: 16,
            right: 16,
            background: "#f3f4f6",
          },
        },
      },
      {
        id: "transform-corners",
        type: "transform",
        position: { x: 1000, y: 150 },
        data: {
          operation: "roundCorners",
          params: {
            radius: 8,
          },
        },
      },
      {
        id: "transform-png",
        type: "transform",
        position: { x: 1300, y: 150 },
        data: {
          operation: "convert",
          params: {
            to: "image/png",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-border" },
      { id: "e3", source: "transform-border", target: "transform-corners" },
      { id: "e4", source: "transform-corners", target: "transform-png" },
    ],
  },
};

/**
 * Blog Post OG Image
 * Canonical ID: blog-og-image
 *
 * Multi-step workflow: Input → Resize to OG → Add title overlay → WebP export
 * JTBD: Create social sharing images for blog posts with title overlay
 */
export const blogOgImage: Template = {
  id: "blog-og-image",
  name: "Blog Post OG Image",
  description: "Create social sharing images for blog posts with title overlay",
  category: "Marketing",
  generator: "pipeline",
  tags: ["blog", "og-image", "social", "title", "overlay", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "share",
  preview: {
    imageUrl: "/showcase/pipelines/output/blog-og.png",
  },
  codeExample: `const ogImage = await floimg.from(heroImage)
  .transform('resize', { width: 1200, height: 630, fit: 'cover' })
  .transform('addCaption', {
    text: 'How to Build Image Pipelines',
    position: 'center',
    fontSize: 48,
    color: '#ffffff'
  })
  .transform('convert', { to: 'image/webp', quality: 85 })
  .toBlob();`,
  seo: {
    title: "Blog Post OG Image Generator",
    description: "Create social sharing images for blog posts with title overlay",
    keywords: ["og image", "blog", "social sharing", "title overlay"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 150 },
        data: {},
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
        id: "transform-caption",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "addCaption",
          params: {
            text: "Your Blog Post Title",
            position: "center",
            fontSize: 48,
            color: "#ffffff",
            padding: 32,
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
      { id: "e1", source: "input-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-webp" },
    ],
  },
};

/**
 * Email Banner
 * Canonical ID: email-banner
 *
 * Multi-step workflow: Input → Resize 600x200 → Add CTA text → PNG export
 * JTBD: Create email header banners with consistent dimensions for newsletters
 */
export const emailBanner: Template = {
  id: "email-banner",
  name: "Email Banner",
  description: "Create email header banners with consistent dimensions for newsletters",
  category: "Marketing",
  generator: "pipeline",
  tags: ["email", "banner", "newsletter", "header", "marketing", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "share",
  preview: {
    imageUrl: "/showcase/pipelines/output/email-banner.png",
  },
  codeExample: `const banner = await floimg.from(image)
  .transform('resize', { width: 600, height: 200, fit: 'cover' })
  .transform('addCaption', {
    text: 'Weekly Newsletter',
    position: 'center',
    fontSize: 32,
    color: '#ffffff'
  })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "Email Banner Generator",
    description: "Create email header banners with consistent dimensions",
    keywords: ["email banner", "newsletter", "email marketing", "header image"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 150 },
        data: {},
      },
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 600,
            height: 200,
            fit: "cover",
          },
        },
      },
      {
        id: "transform-caption",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "addCaption",
          params: {
            text: "Weekly Newsletter",
            position: "center",
            fontSize: 32,
            color: "#ffffff",
            padding: 16,
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
      { id: "e1", source: "input-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-png" },
    ],
  },
};

/**
 * App Icon Generator
 * Canonical ID: app-icons
 *
 * Multi-step workflow: Input → Remove background → Multiple iOS/Android sizes
 * JTBD: Generate all required app icon sizes for iOS and Android from one source
 */
export const appIcons: Template = {
  id: "app-icons",
  name: "App Icon Generator",
  description: "Generate iOS and Android app icon sizes from one source image",
  category: "Marketing",
  generator: "pipeline",
  tags: ["app-icon", "ios", "android", "mobile", "resize", "pipeline"],
  requiresCloud: true,
  requiresAuth: true,
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/app-icon-180.png",
  },
  codeExample: `const icons = await floimg.from(logo)
  .transform('removeBackground')
  .transform('resize', { width: 180, height: 180 })  // iOS
  .transform('resize', { width: 192, height: 192 })  // Android
  .transform('resize', { width: 512, height: 512 })  // Store
  .toBlob();`,
  seo: {
    title: "App Icon Generator",
    description: "Generate all required iOS and Android app icon sizes",
    keywords: ["app icon", "ios icon", "android icon", "mobile app"],
  },
  workflow: {
    nodes: [
      {
        id: "input-1",
        type: "input",
        position: { x: 100, y: 200 },
        data: {},
      },
      {
        id: "transform-bg",
        type: "transform",
        position: { x: 350, y: 200 },
        data: {
          operation: "removeBackground",
          params: {},
        },
      },
      {
        id: "transform-ios-60",
        type: "transform",
        position: { x: 600, y: 50 },
        data: {
          operation: "resize",
          params: {
            width: 60,
            height: 60,
            fit: "contain",
          },
        },
      },
      {
        id: "transform-ios-180",
        type: "transform",
        position: { x: 600, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 180,
            height: 180,
            fit: "contain",
          },
        },
      },
      {
        id: "transform-android-192",
        type: "transform",
        position: { x: 600, y: 250 },
        data: {
          operation: "resize",
          params: {
            width: 192,
            height: 192,
            fit: "contain",
          },
        },
      },
      {
        id: "transform-store-512",
        type: "transform",
        position: { x: 600, y: 350 },
        data: {
          operation: "resize",
          params: {
            width: 512,
            height: 512,
            fit: "contain",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-bg" },
      { id: "e2", source: "transform-bg", target: "transform-ios-60" },
      { id: "e3", source: "transform-bg", target: "transform-ios-180" },
      { id: "e4", source: "transform-bg", target: "transform-android-192" },
      { id: "e5", source: "transform-bg", target: "transform-store-512" },
    ],
  },
};

/**
 * All marketing templates
 */
export const marketingTemplates: Template[] = [
  socialMediaKit,
  avatarPipeline,
  watermarkBranding,
  filterShowcase,
  responsiveImages,
  teamHeadshots,
  screenshotDocs,
  blogOgImage,
  emailBanner,
  appIcons,
];
