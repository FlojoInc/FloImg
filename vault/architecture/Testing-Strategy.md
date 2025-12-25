# Testing Strategy

The floimg monorepo uses Vitest with a tiered test architecture optimized for fast feedback during development while maintaining comprehensive coverage.

## Test Tiers

Tests are organized into tiers based on execution speed and resource requirements:

| Tier        | Command                 | Duration | Packages                             |
| ----------- | ----------------------- | -------- | ------------------------------------ |
| Unit        | `pnpm test:unit`        | ~5s      | Core, AI providers, chart generators |
| Integration | `pnpm test:integration` | ~30s     | Screenshot, Mermaid (browser-based)  |
| Studio      | `pnpm test:studio`      | ~10s     | FloImg Studio backend/frontend       |
| All         | `pnpm test`             | ~45s     | Everything                           |

### Unit Tier

Fast, isolated tests with mocked dependencies:

- `@teamflojo/floimg` - Core library logic
- `@teamflojo/floimg-openai` - Mocked OpenAI API
- `@teamflojo/floimg-stability` - Mocked Stability API
- `@teamflojo/floimg-google` - Mocked Google API
- `@teamflojo/floimg-ollama` - Mocked Ollama client
- `@teamflojo/floimg-qr` - QR code generation
- `@teamflojo/floimg-quickchart` - Chart generation
- `@teamflojo/floimg-d3` - D3 visualizations (JSDOM)

### Integration Tier

Tests requiring browser automation:

- `@teamflojo/floimg-screenshot` - Playwright browser screenshots
- `@teamflojo/floimg-mermaid` - Puppeteer diagram rendering

These tests run with extended timeouts (60s) and sequential execution to avoid browser resource contention.

## Configuration

### Root Configuration (`vitest.config.ts`)

The root config provides defaults for all packages:

- Thread-based parallel execution for unit tests
- V8 coverage provider with 50% threshold
- JUnit reporter for CI integration
- Shorter timeouts in CI (10s) vs local development (30s)

### Workspace Configuration (`vitest.workspace.ts`)

Defines test projects for the `--project` flag:

```bash
pnpm vitest --project unit        # Unit tests only
pnpm vitest --project integration # Browser tests only
pnpm vitest --project studio      # FloImg Studio tests
```

### Package-Level Configuration

Packages with special requirements can override root settings in their own `vitest.config.ts`.

## Test File Structure

```
packages/floimg-example/
├── src/
│   └── index.ts
├── test/
│   ├── index.test.ts      # Main functionality
│   ├── schema.test.ts     # Schema validation
│   └── helpers.test.ts    # Utility functions
└── vitest.config.ts       # Optional overrides
```

Naming conventions:

- Use `.test.ts` suffix for all test files
- Use `.test.tsx` for React component tests
- Name files after the module they test

## Writing Tests

### Basic Structure

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import myFunction from "../src/index.js";

describe("myFunction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should handle the expected case", () => {
    const result = myFunction("input");
    expect(result).toBe("expected");
  });

  it("should throw on invalid input", () => {
    expect(() => myFunction(null)).toThrow("Input required");
  });
});
```

### Mocking External APIs

AI provider tests mock their API calls:

```typescript
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    images: {
      generate: vi.fn().mockResolvedValue({
        data: [{ url: "https://example.com/image.png" }],
      }),
    },
  })),
}));
```

### Schema Testing

Every generator/provider tests its schema definition:

```typescript
describe("myGenerator schema", () => {
  it("should have correct name", () => {
    expect(myGeneratorSchema.name).toBe("my-generator");
  });

  it("should define required parameters", () => {
    expect(myGeneratorSchema.requiredParameters).toContain("prompt");
  });
});
```

## Adding Tests to a New Package

1. Create `test/` directory with test files
2. Add test script to `package.json`:
   ```json
   { "test": "vitest --run" }
   ```
3. Add package to appropriate tier in `vitest.workspace.ts`
4. Run tests: `pnpm --filter @teamflojo/floimg-newpkg test`

## CI Integration

GitHub Actions runs tests on:

- **Push**: Unit tests only (fast feedback)
- **Pull Request**: All tests (full validation)
- **Main branch**: All tests + coverage report

## Best Practices

- Write tests alongside code
- Mock all external API calls
- Test error conditions, not just happy paths
- Use descriptive test names explaining the behavior
- Keep tests focused with one assertion per test
- Run `pnpm test:unit` frequently during development
- Don't commit with failing tests

## See Also

- [[Monorepo-Guide]] - Development setup
- [[Plugin-Architecture]] - Plugin development
- [Vitest Documentation](https://vitest.dev/)
