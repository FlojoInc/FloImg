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
 * Previous Studio ID: chart-watermark
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
 * All marketing templates
 */
export const marketingTemplates: Template[] = [
  socialMediaKit,
  avatarPipeline,
  watermarkBranding,
  filterShowcase,
];
