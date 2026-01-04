# @teamflojo/floimg-templates

Official workflow templates for FloImg Studio.

## Installation

```bash
npm install @teamflojo/floimg-templates
```

## Usage

### OSS Studio (Offline/Self-Hosted)

```typescript
import {
  coreTemplates,
  getCoreCategories,
  resolveTemplate,
} from "@teamflojo/floimg-templates";

// Get templates that work offline
const templates = coreTemplates;

// Get available categories
const categories = getCoreCategories();

// Resolve template by ID (handles legacy IDs)
const template = resolveTemplate("revenue-chart");
```

### All Templates (Including Cloud-Only)

```typescript
import {
  allTemplates,
  getCategories,
  getTemplateById,
} from "@teamflojo/floimg-templates";

// Get all templates including those requiring API keys
const templates = allTemplates;

// Get a specific template
const template = getTemplateById("ai-product-shot");
```

Templates with `requiresCloud: true` need API keys (OpenAI, etc.) to execute.

### Marketing/Integration

```typescript
import {
  allTemplates,
  getStudioUrl,
  searchTemplates,
} from "@teamflojo/floimg-templates";

// Generate Studio URL for a template
const url = getStudioUrl("revenue-chart");
// → "https://studio.floimg.com/?template=revenue-chart"

// Search templates
const results = searchTemplates("chart");
```

## Template Categories

- **AI Workflows** - AI-powered image generation (cloud-only)
- **Data Viz** - Charts, graphs, and diagrams
- **Marketing** - Social media assets and branding
- **Utilities** - QR codes, format conversion, thumbnails

## Template Interface

```typescript
interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  generator: string;
  workflow: { nodes: StudioNode[]; edges: StudioEdge[] };

  // Availability
  requiresCloud?: boolean;
  requiresAuth?: boolean;

  // Discovery
  tags?: string[];
  preview?: { imageUrl: string };
}
```

## License

MIT
