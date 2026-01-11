// vite.config.ts
import { defineConfig } from "file:///Users/brettcooke/Documents/Projects/FloImg/floimg-hq/repos/FloImg/node_modules/.pnpm/vite@5.4.21_@types+node@22.19.3/node_modules/vite/dist/node/index.js";
import react from "file:///Users/brettcooke/Documents/Projects/FloImg/floimg-hq/repos/FloImg/node_modules/.pnpm/@vitejs+plugin-react@4.7.0_vite@5.4.21_@types+node@22.19.3_/node_modules/@vitejs/plugin-react/dist/index.js";
import dts from "file:///Users/brettcooke/Documents/Projects/FloImg/floimg-hq/repos/FloImg/node_modules/.pnpm/vite-plugin-dts@3.9.1_@types+node@22.19.3_rollup@4.54.0_typescript@5.9.3_vite@5.4.21_@types+node@22.19.3_/node_modules/vite-plugin-dts/dist/index.mjs";
import { resolve } from "path";
var __vite_injected_original_dirname = "/Users/brettcooke/Documents/Projects/FloImg/floimg-hq/repos/FloImg/apps/studio/frontend";
var vite_config_default = defineConfig(({ mode }) => {
  if (mode === "lib") {
    return {
      plugins: [
        react(),
        dts({
          include: ["src"],
          exclude: ["src/main.tsx", "src/vite-env.d.ts"]
        })
      ],
      build: {
        lib: {
          entry: resolve(__vite_injected_original_dirname, "src/index.ts"),
          name: "FloImgStudioUI",
          formats: ["es"],
          fileName: "index"
        },
        rollupOptions: {
          external: [
            "react",
            "react-dom",
            "react/jsx-runtime",
            // These use React context - must be external to share state with host app
            "reactflow",
            "@tanstack/react-query",
            "zustand"
          ],
          output: {
            globals: {
              react: "React",
              "react-dom": "ReactDOM"
            },
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === "style.css") return "styles.css";
              return assetInfo.name || "asset";
            }
          }
        },
        sourcemap: true,
        cssCodeSplit: false
      }
    };
  }
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": {
          target: "http://localhost:5100",
          changeOrigin: true
        }
      }
    },
    build: {
      outDir: "dist",
      sourcemap: true
    }
  };
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvYnJldHRjb29rZS9Eb2N1bWVudHMvUHJvamVjdHMvRmxvSW1nL2Zsb2ltZy1ocS9yZXBvcy9GbG9JbWcvYXBwcy9zdHVkaW8vZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy9icmV0dGNvb2tlL0RvY3VtZW50cy9Qcm9qZWN0cy9GbG9JbWcvZmxvaW1nLWhxL3JlcG9zL0Zsb0ltZy9hcHBzL3N0dWRpby9mcm9udGVuZC92aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vVXNlcnMvYnJldHRjb29rZS9Eb2N1bWVudHMvUHJvamVjdHMvRmxvSW1nL2Zsb2ltZy1ocS9yZXBvcy9GbG9JbWcvYXBwcy9zdHVkaW8vZnJvbnRlbmQvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xuaW1wb3J0IGR0cyBmcm9tIFwidml0ZS1wbHVnaW4tZHRzXCI7XG5pbXBvcnQgeyByZXNvbHZlIH0gZnJvbSBcInBhdGhcIjtcblxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKCh7IG1vZGUgfSkgPT4ge1xuICAvLyBMaWJyYXJ5IG1vZGUgZm9yIG5wbSBwdWJsaXNoaW5nXG4gIGlmIChtb2RlID09PSBcImxpYlwiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHBsdWdpbnM6IFtcbiAgICAgICAgcmVhY3QoKSxcbiAgICAgICAgZHRzKHtcbiAgICAgICAgICBpbmNsdWRlOiBbXCJzcmNcIl0sXG4gICAgICAgICAgZXhjbHVkZTogW1wic3JjL21haW4udHN4XCIsIFwic3JjL3ZpdGUtZW52LmQudHNcIl0sXG4gICAgICAgIH0pLFxuICAgICAgXSxcbiAgICAgIGJ1aWxkOiB7XG4gICAgICAgIGxpYjoge1xuICAgICAgICAgIGVudHJ5OiByZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvaW5kZXgudHNcIiksXG4gICAgICAgICAgbmFtZTogXCJGbG9JbWdTdHVkaW9VSVwiLFxuICAgICAgICAgIGZvcm1hdHM6IFtcImVzXCJdLFxuICAgICAgICAgIGZpbGVOYW1lOiBcImluZGV4XCIsXG4gICAgICAgIH0sXG4gICAgICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgICAgICBleHRlcm5hbDogW1xuICAgICAgICAgICAgXCJyZWFjdFwiLFxuICAgICAgICAgICAgXCJyZWFjdC1kb21cIixcbiAgICAgICAgICAgIFwicmVhY3QvanN4LXJ1bnRpbWVcIixcbiAgICAgICAgICAgIC8vIFRoZXNlIHVzZSBSZWFjdCBjb250ZXh0IC0gbXVzdCBiZSBleHRlcm5hbCB0byBzaGFyZSBzdGF0ZSB3aXRoIGhvc3QgYXBwXG4gICAgICAgICAgICBcInJlYWN0Zmxvd1wiLFxuICAgICAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtcXVlcnlcIixcbiAgICAgICAgICAgIFwienVzdGFuZFwiLFxuICAgICAgICAgIF0sXG4gICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgICAgIHJlYWN0OiBcIlJlYWN0XCIsXG4gICAgICAgICAgICAgIFwicmVhY3QtZG9tXCI6IFwiUmVhY3RET01cIixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhc3NldEZpbGVOYW1lczogKGFzc2V0SW5mbykgPT4ge1xuICAgICAgICAgICAgICBpZiAoYXNzZXRJbmZvLm5hbWUgPT09IFwic3R5bGUuY3NzXCIpIHJldHVybiBcInN0eWxlcy5jc3NcIjtcbiAgICAgICAgICAgICAgcmV0dXJuIGFzc2V0SW5mby5uYW1lIHx8IFwiYXNzZXRcIjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgc291cmNlbWFwOiB0cnVlLFxuICAgICAgICBjc3NDb2RlU3BsaXQ6IGZhbHNlLFxuICAgICAgfSxcbiAgICB9O1xuICB9XG5cbiAgLy8gRGVmYXVsdCBtb2RlIGZvciBkZXZlbG9wbWVudCBhbmQgYXBwIGJ1aWxkc1xuICByZXR1cm4ge1xuICAgIHBsdWdpbnM6IFtyZWFjdCgpXSxcbiAgICBzZXJ2ZXI6IHtcbiAgICAgIHBvcnQ6IDUxNzMsXG4gICAgICBwcm94eToge1xuICAgICAgICBcIi9hcGlcIjoge1xuICAgICAgICAgIHRhcmdldDogXCJodHRwOi8vbG9jYWxob3N0OjUxMDBcIixcbiAgICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0sXG4gICAgYnVpbGQ6IHtcbiAgICAgIG91dERpcjogXCJkaXN0XCIsXG4gICAgICBzb3VyY2VtYXA6IHRydWUsXG4gICAgfSxcbiAgfTtcbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF1YixTQUFTLG9CQUFvQjtBQUNwZCxPQUFPLFdBQVc7QUFDbEIsT0FBTyxTQUFTO0FBQ2hCLFNBQVMsZUFBZTtBQUh4QixJQUFNLG1DQUFtQztBQUt6QyxJQUFPLHNCQUFRLGFBQWEsQ0FBQyxFQUFFLEtBQUssTUFBTTtBQUV4QyxNQUFJLFNBQVMsT0FBTztBQUNsQixXQUFPO0FBQUEsTUFDTCxTQUFTO0FBQUEsUUFDUCxNQUFNO0FBQUEsUUFDTixJQUFJO0FBQUEsVUFDRixTQUFTLENBQUMsS0FBSztBQUFBLFVBQ2YsU0FBUyxDQUFDLGdCQUFnQixtQkFBbUI7QUFBQSxRQUMvQyxDQUFDO0FBQUEsTUFDSDtBQUFBLE1BQ0EsT0FBTztBQUFBLFFBQ0wsS0FBSztBQUFBLFVBQ0gsT0FBTyxRQUFRLGtDQUFXLGNBQWM7QUFBQSxVQUN4QyxNQUFNO0FBQUEsVUFDTixTQUFTLENBQUMsSUFBSTtBQUFBLFVBQ2QsVUFBVTtBQUFBLFFBQ1o7QUFBQSxRQUNBLGVBQWU7QUFBQSxVQUNiLFVBQVU7QUFBQSxZQUNSO0FBQUEsWUFDQTtBQUFBLFlBQ0E7QUFBQTtBQUFBLFlBRUE7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBLFVBQ0Y7QUFBQSxVQUNBLFFBQVE7QUFBQSxZQUNOLFNBQVM7QUFBQSxjQUNQLE9BQU87QUFBQSxjQUNQLGFBQWE7QUFBQSxZQUNmO0FBQUEsWUFDQSxnQkFBZ0IsQ0FBQyxjQUFjO0FBQzdCLGtCQUFJLFVBQVUsU0FBUyxZQUFhLFFBQU87QUFDM0MscUJBQU8sVUFBVSxRQUFRO0FBQUEsWUFDM0I7QUFBQSxVQUNGO0FBQUEsUUFDRjtBQUFBLFFBQ0EsV0FBVztBQUFBLFFBQ1gsY0FBYztBQUFBLE1BQ2hCO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFHQSxTQUFPO0FBQUEsSUFDTCxTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsSUFDakIsUUFBUTtBQUFBLE1BQ04sTUFBTTtBQUFBLE1BQ04sT0FBTztBQUFBLFFBQ0wsUUFBUTtBQUFBLFVBQ04sUUFBUTtBQUFBLFVBQ1IsY0FBYztBQUFBLFFBQ2hCO0FBQUEsTUFDRjtBQUFBLElBQ0Y7QUFBQSxJQUNBLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxNQUNSLFdBQVc7QUFBQSxJQUNiO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
