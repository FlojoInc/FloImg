# Template System Architecture

The template system provides pre-built workflow definitions that users can load into FloImg Studio.

## Package Structure

Templates are defined in the `@teamflojo/floimg-templates` package:

```
packages/floimg-templates/
  src/
    index.ts          # Main exports and query functions
    types.ts          # Template interface definition
    templates/
      data-viz.ts     # Charts and data visualization
      ai-workflows.ts # AI image generation (requiresCloud: true)
      marketing.ts    # Social media and branding
      utilities.ts    # QR codes, format conversion
```

## Template Interface

```typescript
interface Template {
  // Core fields
  id: string;
  name: string;
  description: string;
  category: "AI Workflows" | "Data Viz" | "Marketing" | "Utilities";
  generator: string;
  workflow: { nodes: StudioNode[]; edges: StudioEdge[] };

  // Availability
  requiresCloud?: boolean;  // FSC-only (needs API keys)
  requiresAuth?: boolean;   // Needs sign-in

  // Discovery
  tags?: string[];
  preview?: { imageUrl: string };
  capabilities?: { claudeCodeReady?: boolean; pipeline?: boolean };

  // Marketing/SEO
  codeExample?: string;
  seo?: { title: string; description: string; keywords: string[] };
}
```

## Usage

### FloImg Studio
```typescript
import {
  coreTemplates,        // Templates that work offline
  getCoreCategories,    // Categories from core templates
  resolveTemplate       // Handles legacy ID mapping
} from "@teamflojo/floimg-templates";
```

### All Templates (Including Cloud-Only)
```typescript
import {
  allTemplates,         // All templates including cloud-only
  getCategories,        // All categories
  getStudioUrl          // Generate Studio URLs
} from "@teamflojo/floimg-templates";
```

Templates with `requiresCloud: true` require API keys for AI providers (OpenAI, etc.).

## Legacy ID Resolution

Some templates were renamed for consistency. The `resolveTemplate()` function handles backward compatibility:

```typescript
const legacyIdMap = {
  "sales-dashboard": "revenue-chart",
  "user-growth": "monthly-users",
  "website-qr": "branded-qr",
  "chart-watermark": "watermark-branding",
};
```

URLs like `?template=sales-dashboard` resolve to the canonical `revenue-chart` template.

## Adding New Templates

1. Add template definition to appropriate category file in `src/templates/`
2. Set `requiresCloud: true` if template needs cloud API access
3. Add preview image to floimg-web showcase directory
4. Rebuild: `pnpm --filter @teamflojo/floimg-templates build`

## Related Docs

- [[Monorepo-Guide]] - Package development
- [README](../../packages/floimg-templates/README.md) - Package usage
