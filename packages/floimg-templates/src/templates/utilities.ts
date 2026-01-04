/**
 * Utility Templates
 *
 * QR codes, format conversion, and general-purpose utilities.
 * All templates in this category work offline (OSS-compatible).
 */

import type { Template } from "../types.js";

/**
 * Branded QR Code Pipeline
 * Canonical ID: branded-qr
 *
 * Multi-step workflow: Generate QR → Resize → Add rounded corners → Convert to PNG
 * Demonstrates: composable transforms on generated content
 */
export const brandedQR: Template = {
  id: "branded-qr",
  name: "Branded QR Code",
  description: "QR code with custom colors, rounded corners, and optimized for print or digital",
  category: "Utilities",
  generator: "qr",
  tags: ["qr", "branded", "link", "custom", "url", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "qr",
  preview: {
    imageUrl: "/showcase/qr-codes/qr-brand.png",
  },
  codeExample: `const qr = await floimg
  .generate('qr', {
    data: 'https://floimg.com',
    dark: '#0d9488',
    light: '#ffffff'
  })
  .transform('resize', { width: 300, height: 300 })
  .transform('roundCorners', { radius: 16 })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "Branded QR Code Generator",
    description: "Generate QR codes with custom colors, rounded corners, and professional styling",
    keywords: ["qr code", "branded qr", "custom qr", "marketing"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 300,
            height: 300,
            fit: "contain",
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
            radius: 16,
          },
        },
      },
      {
        id: "transform-convert",
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
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-corners" },
      { id: "e3", source: "transform-corners", target: "transform-convert" },
    ],
  },
};

/**
 * Dark Mode QR Code Pipeline
 * Canonical ID: dark-qr
 *
 * Multi-step workflow: Generate inverted QR → Resize → Add subtle border → WebP export
 * Demonstrates: transforms for dark UI integration
 */
export const darkQR: Template = {
  id: "dark-qr",
  name: "Dark Mode QR",
  description: "QR code optimized for dark backgrounds with subtle border and web-optimized export",
  category: "Utilities",
  generator: "qr",
  tags: ["qr", "dark-mode", "link", "inverted", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "qr",
  preview: {
    imageUrl: "/showcase/qr-codes/qr-dark.png",
  },
  codeExample: `const qr = await floimg
  .generate('qr', {
    data: 'https://floimg.com',
    dark: '#ffffff',
    light: '#18181b'
  })
  .transform('resize', { width: 300, height: 300 })
  .transform('extend', {
    top: 8, bottom: 8, left: 8, right: 8,
    background: '#27272a'
  })
  .transform('convert', { to: 'image/webp', quality: 90 })
  .toBlob();`,
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
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 300,
            height: 300,
            fit: "contain",
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
            top: 8,
            bottom: 8,
            left: 8,
            right: 8,
            background: "#27272a",
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
            quality: 90,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-border" },
      { id: "e3", source: "transform-border", target: "transform-webp" },
    ],
  },
};

/**
 * WiFi QR Code Pipeline
 * Canonical ID: wifi-qr
 *
 * Multi-step workflow: Generate WiFi QR → Resize → Add caption label → Rounded corners
 * Demonstrates: adding context/labels to generated content
 */
export const wifiQR: Template = {
  id: "wifi-qr",
  name: "WiFi QR Code",
  description: "Scannable WiFi QR code with network name label and professional styling",
  category: "Utilities",
  generator: "qr",
  tags: ["qr", "wifi", "network", "guest", "access", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "qr",
  preview: {
    imageUrl: "/showcase/qr-codes/qr-wifi.png",
  },
  codeExample: `const qr = await floimg
  .generate('qr', {
    data: 'WIFI:T:WPA;S:GuestNetwork;P:welcome123;;',
    dark: '#059669',
    light: '#ffffff'
  })
  .transform('resize', { width: 300, height: 300 })
  .transform('addCaption', {
    text: 'Scan for WiFi',
    position: 'bottom-center',
    fontSize: 18,
    color: '#059669'
  })
  .transform('roundCorners', { radius: 12 })
  .toBlob();`,
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
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 300,
            height: 300,
            fit: "contain",
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
            text: "Scan for WiFi",
            position: "bottom-center",
            fontSize: 18,
            color: "#059669",
            padding: 16,
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
            radius: 12,
          },
        },
      },
    ],
    edges: [
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-corners" },
    ],
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
