/**
 * Data Visualization Templates
 *
 * Charts, graphs, and diagrams using QuickChart and Mermaid generators.
 * All templates in this category work offline (OSS-compatible).
 */

import type { Template } from "../types.js";

/**
 * Revenue Dashboard Pipeline
 * Canonical ID: revenue-chart
 *
 * Multi-step workflow: Generate chart → Resize → Add caption → WebP export
 * Demonstrates: chart generation with professional output formatting
 */
export const revenueChart: Template = {
  id: "revenue-chart",
  name: "Revenue Dashboard",
  description: "Quarterly revenue chart with caption and web-optimized export",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["bar", "revenue", "quarterly", "dashboard", "sales", "pipeline"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/quarterly-revenue.png",
  },
  codeExample: `const chart = await floimg
  .generate('quickchart', {
    chart: {
      type: 'bar',
      data: {
        labels: ['Q1', 'Q2', 'Q3', 'Q4'],
        datasets: [{ label: 'Revenue ($K)', data: [120, 190, 175, 240] }]
      }
    }
  })
  .transform('resize', { width: 800, height: 500, fit: 'inside' })
  .transform('addCaption', {
    text: 'Source: Finance Dashboard',
    position: 'bottom-right',
    fontSize: 12
  })
  .transform('convert', { to: 'image/webp', quality: 90 })
  .toBlob();`,
  seo: {
    title: "Revenue Dashboard Chart Template",
    description: "Generate professional quarterly revenue bar charts with caption and optimization",
    keywords: ["revenue chart", "bar chart", "quarterly report", "dashboard"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 800,
            height: 500,
            fit: "inside",
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
            text: "Source: Finance Dashboard",
            position: "bottom-right",
            fontSize: 12,
            color: "#6B7280",
            padding: 8,
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
      { id: "e2", source: "transform-resize", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-webp" },
    ],
  },
};

/**
 * User Growth Chart for Investor Updates
 * Canonical ID: monthly-users
 *
 * Multi-step workflow: Generate chart → Resize for slides → Round corners for modern look → PNG export
 * JTBD: Create polished growth charts for investor decks and board presentations
 */
export const monthlyUsers: Template = {
  id: "monthly-users",
  name: "User Growth Chart",
  description: "Polished user growth chart ready for investor decks and presentations",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["line", "growth", "users", "monthly", "analytics", "pipeline", "investor"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/monthly-users.png",
  },
  codeExample: `const chart = await floimg
  .generate('quickchart', {
    chart: {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [{ label: 'Active Users', data: [1200, 1900, 3000, 5000, 6200, 8100] }]
      }
    }
  })
  .transform('resize', { width: 1200, height: 675 }) // 16:9 for slides
  .transform('roundCorners', { radius: 16 })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "User Growth Chart Template",
    description:
      "Visualize monthly user growth with smooth bezier curves for investor presentations",
    keywords: ["user growth", "line chart", "analytics", "investor deck"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 1200,
            height: 675,
            fit: "contain",
            background: "#ffffff",
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
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-corners" },
      { id: "e3", source: "transform-corners", target: "transform-png" },
    ],
  },
};

/**
 * Framework Comparison for Blog Posts
 * Canonical ID: framework-usage
 *
 * Multi-step workflow: Generate chart → Resize for blog → Add padding → WebP for fast loading
 * JTBD: Create comparison charts for technical blog posts and documentation
 */
export const frameworkUsage: Template = {
  id: "framework-usage",
  name: "Framework Usage Stats",
  description: "Blog-ready comparison chart with optimized sizing and fast web loading",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["bar", "comparison", "stats", "horizontal", "frameworks", "pipeline", "blog"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/framework-usage.png",
  },
  codeExample: `const chart = await floimg
  .generate('quickchart', {
    chart: {
      type: 'horizontalBar',
      data: {
        labels: ['React', 'Vue', 'Angular', 'Svelte', 'Solid'],
        datasets: [{ label: 'Usage %', data: [42, 18, 15, 8, 4] }]
      }
    }
  })
  .transform('resize', { width: 800, height: 450 }) // Blog content width
  .transform('extend', { top: 16, bottom: 16, left: 16, right: 16, background: '#ffffff' })
  .transform('convert', { to: 'image/webp', quality: 85 })
  .toBlob();`,
  seo: {
    title: "Framework Comparison Chart Template",
    description: "Generate comparison charts for technical blog posts with optimized web delivery",
    keywords: ["framework comparison", "bar chart", "tech blog", "documentation"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "quickchart",
          params: {
            chart: {
              type: "horizontalBar",
              data: {
                labels: ["React", "Vue", "Angular", "Svelte", "Solid"],
                datasets: [
                  {
                    label: "Usage %",
                    data: [42, 18, 15, 8, 4],
                    backgroundColor: [
                      "rgba(97, 218, 251, 0.8)",
                      "rgba(65, 184, 131, 0.8)",
                      "rgba(221, 0, 49, 0.8)",
                      "rgba(255, 62, 0, 0.8)",
                      "rgba(68, 107, 158, 0.8)",
                    ],
                  },
                ],
              },
              options: {
                plugins: {
                  title: {
                    display: true,
                    text: "Frontend Framework Usage 2024",
                  },
                },
              },
            },
            width: 600,
            height: 400,
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
            height: 450,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-padding",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "extend",
          params: {
            top: 16,
            bottom: 16,
            left: 16,
            right: 16,
            background: "#ffffff",
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
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-padding" },
      { id: "e3", source: "transform-padding", target: "transform-webp" },
    ],
  },
};

/**
 * Traffic Breakdown for Slack/Reports
 * Canonical ID: traffic-breakdown
 *
 * Multi-step workflow: Generate chart → Square format for Slack → Add date annotation → PNG
 * JTBD: Share analytics breakdowns in Slack channels and weekly reports
 */
export const trafficBreakdown: Template = {
  id: "traffic-breakdown",
  name: "Traffic by Device",
  description: "Analytics breakdown optimized for Slack sharing and weekly reports",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["doughnut", "traffic", "analytics", "pie", "devices", "pipeline", "slack"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/traffic-by-device.png",
  },
  codeExample: `const chart = await floimg
  .generate('quickchart', {
    chart: {
      type: 'doughnut',
      data: {
        labels: ['Desktop', 'Mobile', 'Tablet'],
        datasets: [{ data: [55, 35, 10] }]
      }
    }
  })
  .transform('resize', { width: 500, height: 500 }) // Square for Slack preview
  .transform('addCaption', {
    text: 'Week of Jan 1, 2026',
    position: 'bottom-center',
    fontSize: 14,
    color: '#6B7280'
  })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "Traffic Breakdown Chart Template",
    description: "Generate analytics breakdown charts optimized for Slack sharing and reports",
    keywords: ["traffic analytics", "doughnut chart", "slack", "weekly report"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
        data: {
          generatorName: "quickchart",
          params: {
            chart: {
              type: "doughnut",
              data: {
                labels: ["Desktop", "Mobile", "Tablet"],
                datasets: [
                  {
                    data: [55, 35, 10],
                    backgroundColor: [
                      "rgba(99, 102, 241, 0.8)",
                      "rgba(34, 197, 94, 0.8)",
                      "rgba(249, 115, 22, 0.8)",
                    ],
                  },
                ],
              },
              options: {
                plugins: {
                  title: {
                    display: true,
                    text: "Traffic by Device Type",
                  },
                },
              },
            },
            width: 400,
            height: 400,
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
            width: 500,
            height: 500,
            fit: "contain",
            background: "#ffffff",
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
            text: "Week of Jan 1, 2026",
            position: "bottom-center",
            fontSize: 14,
            color: "#6B7280",
            padding: 12,
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
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-png" },
    ],
  },
};

/**
 * API Documentation Sequence Diagram
 * Canonical ID: api-flow
 *
 * Multi-step workflow: Generate diagram → Resize for docs → Add padding → PNG for docs
 * JTBD: Create API flow diagrams for technical documentation and README files
 */
export const apiFlow: Template = {
  id: "api-flow",
  name: "API Request Flow",
  description: "Sequence diagram ready for API documentation and README files",
  category: "Data Viz",
  generator: "mermaid",
  tags: ["sequence", "api", "authentication", "diagram", "flow", "pipeline", "docs"],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "diagram",
  preview: {
    imageUrl: "/showcase/diagrams/api-flow.png",
  },
  codeExample: `const diagram = await floimg
  .generate('mermaid', {
    code: \`sequenceDiagram
    participant Client
    participant API
    participant Auth
    Client->>API: POST /login
    API->>Auth: Validate
    Auth-->>API: JWT token
    API-->>Client: 200 OK\`
  })
  .transform('resize', { width: 800, fit: 'inside' })
  .transform('extend', { top: 24, bottom: 24, left: 24, right: 24, background: '#ffffff' })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "API Flow Diagram Template",
    description: "Generate sequence diagrams for API documentation and README files",
    keywords: ["api diagram", "sequence diagram", "documentation", "readme"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
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
        id: "transform-padding",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "extend",
          params: {
            top: 24,
            bottom: 24,
            left: 24,
            right: 24,
            background: "#ffffff",
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
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-padding" },
      { id: "e3", source: "transform-padding", target: "transform-png" },
    ],
  },
};

/**
 * System Architecture for Technical Docs
 * Canonical ID: system-architecture
 *
 * Multi-step workflow: Generate diagram → Resize for wiki → Add padding → WebP for fast loading
 * JTBD: Create architecture diagrams for Confluence/Notion/README documentation
 */
export const systemArchitecture: Template = {
  id: "system-architecture",
  name: "System Architecture",
  description: "Architecture diagram optimized for Confluence, Notion, and technical documentation",
  category: "Data Viz",
  generator: "mermaid",
  tags: [
    "architecture",
    "microservices",
    "flowchart",
    "system",
    "infrastructure",
    "pipeline",
    "confluence",
  ],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "diagram",
  preview: {
    imageUrl: "/showcase/diagrams/system-architecture.png",
  },
  codeExample: `const diagram = await floimg
  .generate('mermaid', {
    code: \`flowchart TB
    subgraph Gateway
        LB[Load Balancer]
        API[API Gateway]
    end
    subgraph Services
        Auth[Auth]
        Users[Users]
    end
    LB --> API --> Auth & Users\`
  })
  .transform('resize', { width: 1000, fit: 'inside' })
  .transform('extend', { top: 32, bottom: 32, left: 32, right: 32, background: '#ffffff' })
  .transform('convert', { to: 'image/webp', quality: 90 })
  .toBlob();`,
  seo: {
    title: "System Architecture Diagram Template",
    description:
      "Generate architecture diagrams for Confluence, Notion, and technical documentation",
    keywords: ["architecture diagram", "microservices", "confluence", "notion"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 1000,
            fit: "inside",
          },
        },
      },
      {
        id: "transform-padding",
        type: "transform",
        position: { x: 700, y: 150 },
        data: {
          operation: "extend",
          params: {
            top: 32,
            bottom: 32,
            left: 32,
            right: 32,
            background: "#ffffff",
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
      { id: "e2", source: "transform-resize", target: "transform-padding" },
      { id: "e3", source: "transform-padding", target: "transform-webp" },
    ],
  },
};

/**
 * Git Workflow for Team Onboarding
 * Canonical ID: git-workflow
 *
 * Multi-step workflow: Generate diagram → Resize for wiki → Add caption → PNG for docs
 * JTBD: Create git workflow diagrams for team onboarding and CONTRIBUTING.md files
 */
export const gitWorkflow: Template = {
  id: "git-workflow",
  name: "Git Branch Workflow",
  description: "Git branching diagram for team onboarding and CONTRIBUTING.md",
  category: "Data Viz",
  generator: "mermaid",
  tags: [
    "git",
    "branching",
    "workflow",
    "development",
    "version-control",
    "pipeline",
    "onboarding",
  ],
  capabilities: {
    claudeCodeReady: true,
    pipeline: true,
  },
  icon: "diagram",
  preview: {
    imageUrl: "/showcase/diagrams/git-workflow.png",
  },
  codeExample: `const diagram = await floimg
  .generate('mermaid', {
    code: \`gitGraph
    commit id: "Initial"
    branch develop
    commit id: "Setup"
    branch feature/auth
    commit id: "Add login"
    checkout develop
    merge feature/auth tag: "v1.0.0"\`
  })
  .transform('resize', { width: 900, fit: 'inside' })
  .transform('addCaption', {
    text: 'Our Git Branching Strategy',
    position: 'top-center',
    fontSize: 16
  })
  .transform('convert', { to: 'image/png' })
  .toBlob();`,
  seo: {
    title: "Git Workflow Diagram Template",
    description: "Generate git branching diagrams for team onboarding and CONTRIBUTING.md",
    keywords: ["git workflow", "branching strategy", "team onboarding", "contributing"],
  },
  workflow: {
    nodes: [
      {
        id: "gen-1",
        type: "generator",
        position: { x: 100, y: 150 },
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
      {
        id: "transform-resize",
        type: "transform",
        position: { x: 400, y: 150 },
        data: {
          operation: "resize",
          params: {
            width: 900,
            fit: "inside",
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
            text: "Our Git Branching Strategy",
            position: "top-center",
            fontSize: 16,
            color: "#374151",
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
      { id: "e1", source: "gen-1", target: "transform-resize" },
      { id: "e2", source: "transform-resize", target: "transform-caption" },
      { id: "e3", source: "transform-caption", target: "transform-png" },
    ],
  },
};

/**
 * All data visualization templates
 */
export const dataVizTemplates: Template[] = [
  revenueChart,
  monthlyUsers,
  frameworkUsage,
  trafficBreakdown,
  apiFlow,
  systemArchitecture,
  gitWorkflow,
];
