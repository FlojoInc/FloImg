import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";
import { resolve } from "path";
import packageJson from "./package.json";

// Common version injection for all build modes
const versionDefines = {
  __APP_VERSION__: JSON.stringify(packageJson.version),
  __GIT_COMMIT__: JSON.stringify(process.env.GIT_COMMIT || "dev"),
};

export default defineConfig(({ mode }) => {
  // Library mode for npm publishing
  if (mode === "lib") {
    return {
      define: versionDefines,
      plugins: [
        react(),
        dts({
          include: ["src"],
          exclude: ["src/main.tsx", "src/vite-env.d.ts"],
        }),
      ],
      build: {
        lib: {
          entry: resolve(__dirname, "src/index.ts"),
          name: "FloImgStudioUI",
          formats: ["es"],
          fileName: "index",
        },
        rollupOptions: {
          external: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            // These use React context - must be external to share state with host app
            "reactflow",
            "@tanstack/react-query",
            "zustand",
          ],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM",
            },
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === "style.css") return "styles.css";
              return assetInfo.name || "asset";
            },
          },
        },
        sourcemap: true,
        cssCodeSplit: false,
      },
    };
  }

  // Default mode for development and app builds
  return {
    define: versionDefines,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:5100",
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: "dist",
      sourcemap: true,
    },
  };
});
