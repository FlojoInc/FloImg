import { defineConfig } from "vitest/config";

/**
 * Root Vitest configuration for the floimg monorepo.
 *
 * Uses Vitest 4's projects feature to organize tests into tiers:
 * - unit: Fast tests with mocked dependencies (~5s)
 * - integration: Browser-based tests (~30s+)
 * - studio: FloImg Studio application tests
 *
 * Usage:
 *   pnpm test              # Run all tests via pnpm -r test
 *   pnpm test:unit         # Run unit tier only
 *   pnpm test:integration  # Run browser-based tests
 *
 * @see vault/architecture/Testing-Strategy.md for full documentation
 */
export default defineConfig({
  test: {
    // Project-based test organization (Vitest 4 feature)
    projects: [
      // ========================================================================
      // UNIT TESTS - Fast, no external dependencies
      // ========================================================================
      {
        test: {
          name: "unit",
          globals: true,
          environment: "node",
          include: [
            // Core library
            "packages/floimg/test/**/*.test.ts",
            // AI providers (mocked API calls)
            "packages/floimg-openai/test/**/*.test.ts",
            "packages/floimg-stability/test/**/*.test.ts",
            "packages/floimg-google/test/**/*.test.ts",
            "packages/floimg-ollama/test/**/*.test.ts",
            // Chart/visualization generators (no browser)
            "packages/floimg-qr/test/**/*.test.ts",
            "packages/floimg-quickchart/test/**/*.test.ts",
            "packages/floimg-d3/test/**/*.test.ts",
            // Transform plugins
            "packages/floimg-vectorize/test/**/*.test.ts",
          ],
          testTimeout: 10000,
        },
      },

      // ========================================================================
      // INTEGRATION TESTS - Browser automation required
      // ========================================================================
      {
        test: {
          name: "integration",
          globals: true,
          environment: "node",
          include: [
            "packages/floimg-screenshot/test/**/*.test.ts",
            "packages/floimg-mermaid/test/**/*.test.ts",
          ],
          testTimeout: 60000,
          hookTimeout: 30000,
          sequence: {
            concurrent: false,
          },
        },
      },

      // ========================================================================
      // STUDIO TESTS - Application tests (when implemented)
      // ========================================================================
      {
        test: {
          name: "studio",
          globals: true,
          environment: "node",
          include: [
            "apps/studio/backend/test/**/*.test.ts",
            "apps/studio/frontend/test/**/*.test.tsx",
          ],
        },
      },
    ],

    // Global settings (apply to all projects unless overridden)
    globals: true,
    environment: "node",
    testTimeout: process.env.CI ? 10000 : 30000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // Reporter configuration
    reporters: process.env.CI ? ["default", "junit"] : ["default"],
    outputFile: {
      junit: "./test-results/junit.xml",
    },

    // Coverage configuration (run with pnpm test:coverage)
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/test/**",
        "**/*.d.ts",
        "**/vitest.config.ts",
      ],
    },

    // Default include/exclude
    include: ["**/test/**/*.test.ts", "**/test/**/*.test.tsx"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
