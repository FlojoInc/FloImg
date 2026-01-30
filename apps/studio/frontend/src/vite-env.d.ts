/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_WEB_URL: string;
  readonly VITE_DEPLOYMENT_MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Global version constants injected by Vite
declare const __APP_VERSION__: string;
declare const __GIT_COMMIT__: string;
