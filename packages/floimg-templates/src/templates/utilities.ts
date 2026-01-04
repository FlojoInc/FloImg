/**
 * Utility Templates
 *
 * QR codes, format conversion, and general-purpose utilities.
 * All templates in this category work offline (OSS-compatible).
 */

import type { Template } from "../types.js";

/**
 * Branded QR Code
 * Canonical ID: branded-qr
 */
export const brandedQR: Template = {
  id: "branded-qr",
  name: "Branded QR Code",
  description: "QR code with custom colors and styling to match your brand",
  category: "Utilities",
  generator: "qr",
  tags: ["qr", "branded", "link", "custom", "url"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "qr",
  preview: {
    imageUrl: "/showcase/qr-codes/qr-brand.png",
  },
  codeExample: `const qr = await floimg.generate({
  generator: 'qr',
  params: {
    data: 'https://floimg.com',
    color: '#0d9488',
    backgroundColor: '#ffffff',
    margin: 2
  }
});`,
  seo: {
    title: "Branded QR Code Generator",
    description: "Generate QR codes with custom colors to match your brand identity",
    keywords: ["qr code", "branded qr", "custom qr", "marketing"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "qr",
          params: {
            data: "https://floimg.com",
            size: 400,
            margin: 2,
            dark: "#0d9488",
            light: "#ffffff",
            errorCorrectionLevel: "M",
          },
        },
      },
    ],
    edges: [],
  },
};

/**
 * Dark Mode QR Code
 * Canonical ID: dark-qr
 */
export const darkQR: Template = {
  id: "dark-qr",
  name: "Dark Mode QR",
  description: "QR code optimized for dark backgrounds",
  category: "Utilities",
  generator: "qr",
  tags: ["qr", "dark-mode", "link", "inverted"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "qr",
  preview: {
    imageUrl: "/showcase/qr-codes/qr-dark.png",
  },
  seo: {
    title: "Dark Mode QR Code",
    description: "QR codes optimized for dark backgrounds and dark mode UIs",
    keywords: ["qr code", "dark mode", "inverted qr", "night mode"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "qr",
          params: {
            data: "https://floimg.com",
            size: 400,
            margin: 2,
            dark: "#ffffff",
            light: "#18181b",
            errorCorrectionLevel: "M",
          },
        },
      },
    ],
    edges: [],
  },
};

/**
 * WiFi QR Code
 * Canonical ID: wifi-qr
 */
export const wifiQR: Template = {
  id: "wifi-qr",
  name: "WiFi QR Code",
  description: "Scannable QR code for WiFi network access",
  category: "Utilities",
  generator: "qr",
  tags: ["qr", "wifi", "network", "guest", "access"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "qr",
  seo: {
    title: "WiFi QR Code Generator",
    description: "Generate scannable QR codes for easy WiFi network access sharing",
    keywords: ["wifi qr", "network access", "guest wifi", "qr code"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "qr",
          params: {
            data: "WIFI:T:WPA;S:GuestNetwork;P:welcome123;;",
            size: 400,
            margin: 2,
            dark: "#059669",
            light: "#ffffff",
            errorCorrectionLevel: "H",
          },
        },
      },
    ],
    edges: [],
  },
};

/**
 * Thumbnail Generator
 * Canonical ID: thumbnail-generator
 */
export const thumbnailGenerator: Template = {
  id: "thumbnail-generator",
  name: "Thumbnail Generator",
  description: "Create multiple thumbnail sizes with automatic optimization",
  category: "Utilities",
  generator: "pipeline",
  tags: ["thumbnail", "resize", "optimize", "batch", "responsive"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "image",
  preview: {
    imageUrl: "/showcase/pipelines/output/thumb-200.png",
  },
  seo: {
    title: "Thumbnail Generator",
    description: "Generate multiple thumbnail sizes with automatic optimization",
    keywords: ["thumbnail", "image resize", "responsive images", "optimization"],
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
        id: "transform-800",
        type: "transform",
        position: { x: 400, y: 100 },
        data: {
          operation: "resize",
          params: {
            width: 800,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-400",
        type: "transform",
        position: { x: 400, y: 200 },
        data: {
          operation: "resize",
          params: {
            width: 400,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-200",
        type: "transform",
        position: { x: 400, y: 300 },
        data: {
          operation: "resize",
          params: {
            width: 200,
            fit: "inside",
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "input-1", target: "transform-800" },
      { id: "e2", source: "input-1", target: "transform-400" },
      { id: "e3", source: "input-1", target: "transform-200" },
    ],
  },
};

/**
 * Diagram to WebP Conversion
 * Canonical ID: diagram-webp
 */
export const diagramWebp: Template = {
  id: "diagram-webp",
  name: "Diagram to WebP",
  description: "Mermaid diagram converted to optimized WebP format",
  category: "Utilities",
  generator: "mermaid",
  tags: ["mermaid", "webp", "optimize", "pipeline", "conversion"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "diagram",
  seo: {
    title: "Diagram to WebP Converter",
    description: "Convert Mermaid diagrams to optimized WebP format",
    keywords: ["mermaid diagram", "webp conversion", "image optimization"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "mermaid",
          params: {
            code: `graph LR
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E`,
            theme: "neutral",
          },
        },
      },
      {
        id: "transform-1",
        type: "transform",
        position: { x: 400, y: 100 },
        data: {
          operation: "convert",
          params: {
            to: "image/webp",
            quality: 90,
          },
        },
      },
    ],
    edges: [{ id: "e1", source: "gen-1", target: "transform-1" }],
  },
};

/**
 * All utility templates
 */
export const utilityTemplates: Template[] = [
  brandedQR,
  darkQR,
  wifiQR,
  thumbnailGenerator,
  diagramWebp,
];
