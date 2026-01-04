/**
 * Data Visualization Templates
 *
 * Charts, graphs, and diagrams using QuickChart and Mermaid generators.
 * All templates in this category work offline (OSS-compatible).
 */

import type { Template } from "../types.js";

/**
 * Revenue Dashboard (QuickChart bar chart)
 * Canonical ID: revenue-chart
 */
export const revenueChart: Template = {
  id: "revenue-chart",
  name: "Revenue Dashboard",
  description: "Quarterly revenue visualization with gradient bars",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["bar", "revenue", "quarterly", "dashboard", "sales"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/quarterly-revenue.png",
  },
  codeExample: `const chart = await floimg.generate({
  generator: 'quickchart',
  params: {
    type: 'bar',
    data: {
      labels: ['Q1', 'Q2', 'Q3', 'Q4'],
      datasets: [{
        label: 'Revenue ($M)',
        data: [12, 19, 8, 15]
      }]
    }
  }
});`,
  seo: {
    title: "Revenue Dashboard Chart Template",
    description: "Generate professional quarterly revenue bar charts with gradient styling",
    keywords: ["revenue chart", "bar chart", "quarterly report", "dashboard"],
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

/**
 * User Growth Line Chart
 * Canonical ID: monthly-users
 */
export const monthlyUsers: Template = {
  id: "monthly-users",
  name: "User Growth Chart",
  description: "Track monthly user growth with smooth line chart",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["line", "growth", "users", "monthly", "analytics"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/monthly-users.png",
  },
  seo: {
    title: "User Growth Chart Template",
    description: "Visualize monthly user growth with smooth bezier curves",
    keywords: ["user growth", "line chart", "analytics", "monthly stats"],
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

/**
 * Framework Usage Stats
 * Canonical ID: framework-usage
 */
export const frameworkUsage: Template = {
  id: "framework-usage",
  name: "Framework Usage Stats",
  description: "Compare framework popularity with horizontal bar chart",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["bar", "comparison", "stats", "horizontal", "frameworks"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/framework-usage.png",
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
    ],
    edges: [],
  },
};

/**
 * Traffic Breakdown Doughnut
 * Canonical ID: traffic-breakdown
 */
export const trafficBreakdown: Template = {
  id: "traffic-breakdown",
  name: "Traffic by Device",
  description: "Doughnut chart showing traffic sources by device type",
  category: "Data Viz",
  generator: "quickchart",
  tags: ["doughnut", "traffic", "analytics", "pie", "devices"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "chart",
  preview: {
    imageUrl: "/showcase/data-viz/traffic-by-device.png",
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
    ],
    edges: [],
  },
};

/**
 * API Request Flow Diagram
 * Canonical ID: api-flow
 */
export const apiFlow: Template = {
  id: "api-flow",
  name: "API Request Flow",
  description: "Sequence diagram showing API authentication flow",
  category: "Data Viz",
  generator: "mermaid",
  tags: ["sequence", "api", "authentication", "diagram", "flow"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "diagram",
  seo: {
    title: "API Flow Diagram Template",
    description: "Generate sequence diagrams for API authentication flows",
    keywords: ["api diagram", "sequence diagram", "authentication flow"],
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

/**
 * System Architecture Diagram
 * Canonical ID: system-architecture
 */
export const systemArchitecture: Template = {
  id: "system-architecture",
  name: "System Architecture",
  description: "Microservices architecture diagram",
  category: "Data Viz",
  generator: "mermaid",
  tags: ["architecture", "microservices", "flowchart", "system", "infrastructure"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "diagram",
  seo: {
    title: "System Architecture Diagram Template",
    description: "Generate microservices architecture diagrams with Mermaid",
    keywords: ["architecture diagram", "microservices", "system design"],
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

/**
 * Git Branch Workflow
 * Canonical ID: git-workflow
 */
export const gitWorkflow: Template = {
  id: "git-workflow",
  name: "Git Branch Workflow",
  description: "Git branching strategy with feature and release branches",
  category: "Data Viz",
  generator: "mermaid",
  tags: ["git", "branching", "workflow", "development", "version-control"],
  capabilities: {
    claudeCodeReady: true,
  },
  icon: "diagram",
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
