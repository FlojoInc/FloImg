/**
 * Template Registry
 *
 * All bundled templates that ship with floimg-studio.
 * These work offline and for self-hosted deployments.
 */

import type { GalleryTemplate } from "@floimg-studio/shared";

// ============================================
// Chart Templates (QuickChart)
// ============================================

export const salesDashboard: GalleryTemplate = {
  id: "sales-dashboard",
  name: "Sales Dashboard",
  description: "Quarterly revenue bar chart with gradient styling",
  category: "Charts",
  generator: "quickchart",
  tags: ["bar", "sales", "revenue", "quarterly"],
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
                labels: ["Q1", "Q2", "Q3", "Q4"],
                datasets: [
                  {
                    label: "Revenue ($K)",
                    data: [120, 190, 175, 240],
                    backgroundColor: [
                      "rgba(99, 102, 241, 0.8)",
                      "rgba(139, 92, 246, 0.8)",
                      "rgba(168, 85, 247, 0.8)",
                      "rgba(192, 132, 252, 0.8)",
                    ],
                  },
                ],
              },
              options: {
                plugins: {
                  title: {
                    display: true,
                    text: "Quarterly Revenue 2024",
                  },
                },
              },
            },
            width: 600,
            height: 400,
          },
        },
      },
    ],
    edges: [],
  },
};

export const userGrowth: GalleryTemplate = {
  id: "user-growth",
  name: "User Growth Line Chart",
  description: "Monthly user growth with smooth bezier curves",
  category: "Charts",
  generator: "quickchart",
  tags: ["line", "growth", "users", "monthly"],
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
              type: "line",
              data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [
                  {
                    label: "Active Users",
                    data: [1200, 1900, 3000, 5000, 6200, 8100],
                    borderColor: "rgb(99, 102, 241)",
                    backgroundColor: "rgba(99, 102, 241, 0.1)",
                    fill: true,
                    tension: 0.4,
                  },
                ],
              },
              options: {
                plugins: {
                  title: {
                    display: true,
                    text: "User Growth 2024",
                  },
                },
              },
            },
            width: 600,
            height: 400,
          },
        },
      },
    ],
    edges: [],
  },
};

// ============================================
// Diagram Templates (Mermaid)
// ============================================

export const apiFlowDiagram: GalleryTemplate = {
  id: "api-flow",
  name: "API Request Flow",
  description: "Sequence diagram showing API authentication flow",
  category: "Diagrams",
  generator: "mermaid",
  tags: ["sequence", "api", "authentication", "flow"],
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "mermaid",
          params: {
            code: `sequenceDiagram
    participant Client
    participant API
    participant Auth
    participant DB

    Client->>API: POST /login
    API->>Auth: Validate credentials
    Auth->>DB: Query user
    DB-->>Auth: User data
    Auth-->>API: JWT token
    API-->>Client: 200 OK + token

    Client->>API: GET /data (+ JWT)
    API->>Auth: Verify token
    Auth-->>API: Valid
    API->>DB: Fetch data
    DB-->>API: Data
    API-->>Client: 200 OK + data`,
            theme: "default",
          },
        },
      },
    ],
    edges: [],
  },
};

export const systemArchitecture: GalleryTemplate = {
  id: "system-architecture",
  name: "System Architecture",
  description: "Microservices architecture diagram",
  category: "Diagrams",
  generator: "mermaid",
  tags: ["architecture", "microservices", "system", "flowchart"],
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "mermaid",
          params: {
            code: `flowchart TB
    subgraph Client
        Web[Web App]
        Mobile[Mobile App]
    end

    subgraph Gateway
        LB[Load Balancer]
        API[API Gateway]
    end

    subgraph Services
        Auth[Auth Service]
        Users[User Service]
        Orders[Order Service]
        Notify[Notification Service]
    end

    subgraph Data
        PG[(PostgreSQL)]
        Redis[(Redis Cache)]
        S3[(S3 Storage)]
    end

    Web --> LB
    Mobile --> LB
    LB --> API
    API --> Auth
    API --> Users
    API --> Orders
    API --> Notify
    Auth --> Redis
    Users --> PG
    Orders --> PG
    Notify --> Redis`,
            theme: "default",
          },
        },
      },
    ],
    edges: [],
  },
};

export const gitWorkflow: GalleryTemplate = {
  id: "git-workflow",
  name: "Git Branch Workflow",
  description: "Git branching strategy with feature and release branches",
  category: "Diagrams",
  generator: "mermaid",
  tags: ["git", "branching", "workflow", "development"],
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 100 },
        data: {
          generatorName: "mermaid",
          params: {
            code: `gitGraph
    commit id: "Initial"
    branch develop
    checkout develop
    commit id: "Setup"
    branch feature/auth
    checkout feature/auth
    commit id: "Add login"
    commit id: "Add signup"
    checkout develop
    merge feature/auth
    branch feature/dashboard
    checkout feature/dashboard
    commit id: "Add charts"
    checkout develop
    merge feature/dashboard
    checkout main
    merge develop tag: "v1.0.0"
    checkout develop
    commit id: "Post-release"`,
            theme: "default",
          },
        },
      },
    ],
    edges: [],
  },
};

// ============================================
// QR Code Templates
// ============================================

export const websiteQR: GalleryTemplate = {
  id: "website-qr",
  name: "Website QR Code",
  description: "QR code linking to your website with custom styling",
  category: "QR Codes",
  generator: "qr",
  tags: ["qr", "website", "link", "url"],
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
            dark: "#4f46e5",
            light: "#ffffff",
            errorCorrectionLevel: "M",
          },
        },
      },
    ],
    edges: [],
  },
};

export const wifiQR: GalleryTemplate = {
  id: "wifi-qr",
  name: "WiFi QR Code",
  description: "Scannable QR code for WiFi network access",
  category: "QR Codes",
  generator: "qr",
  tags: ["qr", "wifi", "network", "guest"],
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

// ============================================
// Transform Pipeline Templates
// ============================================

export const chartWithWatermark: GalleryTemplate = {
  id: "chart-watermark",
  name: "Chart with Watermark",
  description: "Bar chart with company watermark and rounded corners",
  category: "Pipelines",
  generator: "quickchart",
  tags: ["chart", "watermark", "branded", "pipeline"],
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

export const diagramToWebP: GalleryTemplate = {
  id: "diagram-webp",
  name: "Diagram to WebP",
  description: "Mermaid diagram converted to optimized WebP format",
  category: "Pipelines",
  generator: "mermaid",
  tags: ["mermaid", "webp", "optimize", "pipeline"],
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

// ============================================
// Template Registry
// ============================================

/**
 * All available templates, organized by category
 */
export const templates: GalleryTemplate[] = [
  // Charts
  salesDashboard,
  userGrowth,
  // Diagrams
  apiFlowDiagram,
  systemArchitecture,
  gitWorkflow,
  // QR Codes
  websiteQR,
  wifiQR,
  // Pipelines
  chartWithWatermark,
  diagramToWebP,
];

/**
 * Get all unique categories
 */
export function getCategories(): string[] {
  const categories = new Set(templates.map((t) => t.category));
  return Array.from(categories).sort();
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): GalleryTemplate[] {
  return templates.filter((t) => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): GalleryTemplate | undefined {
  return templates.find((t) => t.id === id);
}

/**
 * Search templates by query
 */
export function searchTemplates(query: string): GalleryTemplate[] {
  const q = query.toLowerCase();
  return templates.filter(
    (t) =>
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.generator.toLowerCase().includes(q) ||
      t.tags?.some((tag) => tag.toLowerCase().includes(q))
  );
}
