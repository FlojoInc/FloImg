import { create } from "zustand";
import { persist } from "zustand/middleware";

// Provider configuration for cloud APIs
interface CloudProvider {
  apiKey: string;
  enabled: boolean;
}

// Provider configuration for local APIs
interface LocalProvider {
  baseUrl: string;
  enabled: boolean;
}

// All AI provider settings
export interface AISettings {
  // Cloud providers (require API keys)
  openai?: CloudProvider;
  anthropic?: CloudProvider;
  gemini?: CloudProvider;
  openrouter?: CloudProvider;

  // Local providers (no API key, just URL)
  ollama?: LocalProvider;
  lmstudio?: LocalProvider;
}

interface SettingsStore {
  // AI provider settings
  ai: AISettings;
  setAIProvider: (provider: keyof AISettings, config: CloudProvider | LocalProvider) => void;
  clearAIProvider: (provider: keyof AISettings) => void;

  // Settings modal visibility
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Get configured providers for API calls
  getConfiguredProviders: () => {
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    gemini?: { apiKey: string };
    openrouter?: { apiKey: string };
    ollama?: { baseUrl: string };
    lmstudio?: { baseUrl: string };
  };
}

// Default URLs for local providers
const DEFAULT_OLLAMA_URL = "http://localhost:11434";
const DEFAULT_LMSTUDIO_URL = "http://localhost:1234";

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      ai: {
        ollama: {
          baseUrl: DEFAULT_OLLAMA_URL,
          enabled: false,
        },
        lmstudio: {
          baseUrl: DEFAULT_LMSTUDIO_URL,
          enabled: false,
        },
      },
      showSettings: false,

      setAIProvider: (provider, config) => {
        set((state) => ({
          ai: {
            ...state.ai,
            [provider]: config,
          },
        }));
      },

      clearAIProvider: (provider) => {
        set((state) => {
          const newAI = { ...state.ai };
          delete newAI[provider];
          return { ai: newAI };
        });
      },

      openSettings: () => set({ showSettings: true }),
      closeSettings: () => set({ showSettings: false }),

      getConfiguredProviders: () => {
        const { ai } = get();
        const result: ReturnType<SettingsStore["getConfiguredProviders"]> = {};

        // Cloud providers - only include if enabled and has API key
        if (ai.openai?.enabled && ai.openai.apiKey) {
          result.openai = { apiKey: ai.openai.apiKey };
        }
        if (ai.anthropic?.enabled && ai.anthropic.apiKey) {
          result.anthropic = { apiKey: ai.anthropic.apiKey };
        }
        if (ai.gemini?.enabled && ai.gemini.apiKey) {
          result.gemini = { apiKey: ai.gemini.apiKey };
        }
        if (ai.openrouter?.enabled && ai.openrouter.apiKey) {
          result.openrouter = { apiKey: ai.openrouter.apiKey };
        }

        // Local providers - only include if enabled
        if (ai.ollama?.enabled) {
          result.ollama = { baseUrl: ai.ollama.baseUrl || DEFAULT_OLLAMA_URL };
        }
        if (ai.lmstudio?.enabled) {
          result.lmstudio = { baseUrl: ai.lmstudio.baseUrl || DEFAULT_LMSTUDIO_URL };
        }

        return result;
      },
    }),
    {
      name: "floimg-studio-settings",
      // Only persist AI settings, not modal visibility
      partialize: (state) => ({ ai: state.ai }),
    }
  )
);
