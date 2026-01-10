import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ShortcutAction } from "../lib/keyboard/types";
import { getDefaultShortcuts } from "../lib/keyboard/shortcuts";
import { checkShortcutConflict } from "../lib/keyboard/conflicts";

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
  grok?: CloudProvider;
  openrouter?: CloudProvider;

  // Local providers (no API key, just URL)
  ollama?: LocalProvider;
  lmstudio?: LocalProvider;
}

// Keyboard settings
export interface KeyboardSettings {
  // User's custom shortcut overrides (action -> binding)
  shortcuts: Partial<Record<ShortcutAction, string>>;
  // Whether keyboard shortcuts are enabled globally
  enabled: boolean;
}

interface SettingsStore {
  // AI provider settings
  ai: AISettings;
  setAIProvider: (provider: keyof AISettings, config: CloudProvider | LocalProvider) => void;
  clearAIProvider: (provider: keyof AISettings) => void;

  // Keyboard settings
  keyboard: KeyboardSettings;
  updateShortcut: (action: ShortcutAction, binding: string | null) => void;
  resetShortcut: (action: ShortcutAction) => void;
  resetAllShortcuts: () => void;
  isShortcutConflicting: (binding: string, excludeAction?: ShortcutAction) => string | null;

  // Settings modal visibility
  showSettings: boolean;
  openSettings: () => void;
  closeSettings: () => void;

  // Command palette modal
  showCommandPalette: boolean;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;

  // Keyboard shortcuts help modal
  showShortcutsModal: boolean;
  openShortcutsModal: () => void;
  closeShortcutsModal: () => void;

  // Export modal
  showExport: boolean;
  openExport: () => void;
  closeExport: () => void;

  // Import modal
  showImport: boolean;
  openImport: () => void;
  closeImport: () => void;

  // Get configured providers for API calls
  getConfiguredProviders: () => {
    openai?: { apiKey: string };
    anthropic?: { apiKey: string };
    gemini?: { apiKey: string };
    grok?: { apiKey: string };
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

      // Keyboard settings with defaults
      keyboard: {
        shortcuts: {},
        enabled: true,
      },

      // Modal visibility states
      showSettings: false,
      showCommandPalette: false,
      showShortcutsModal: false,
      showExport: false,
      showImport: false,

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

      // Keyboard shortcut methods
      updateShortcut: (action, binding) => {
        set((state) => ({
          keyboard: {
            ...state.keyboard,
            shortcuts: {
              ...state.keyboard.shortcuts,
              [action]: binding ?? undefined,
            },
          },
        }));
      },

      resetShortcut: (action) => {
        set((state) => {
          const newShortcuts = { ...state.keyboard.shortcuts };
          delete newShortcuts[action];
          return {
            keyboard: {
              ...state.keyboard,
              shortcuts: newShortcuts,
            },
          };
        });
      },

      resetAllShortcuts: () => {
        set((state) => ({
          keyboard: {
            ...state.keyboard,
            shortcuts: {},
          },
        }));
      },

      isShortcutConflicting: (binding, excludeAction) => {
        const { keyboard } = get();
        // Merge defaults with user overrides
        const defaults = getDefaultShortcuts();
        const currentShortcuts: Partial<Record<ShortcutAction, string>> = {};

        for (const [action, defaultBinding] of Object.entries(defaults)) {
          const userBinding = keyboard.shortcuts[action as ShortcutAction];
          if (userBinding !== undefined) {
            currentShortcuts[action as ShortcutAction] = userBinding;
          } else if (defaultBinding) {
            currentShortcuts[action as ShortcutAction] = defaultBinding;
          }
        }

        const result = checkShortcutConflict(binding, currentShortcuts, excludeAction);
        return result.hasConflict ? (result.message ?? "Conflict detected") : null;
      },

      // Modal controls
      openSettings: () => set({ showSettings: true }),
      closeSettings: () => set({ showSettings: false }),

      openCommandPalette: () => set({ showCommandPalette: true }),
      closeCommandPalette: () => set({ showCommandPalette: false }),

      openShortcutsModal: () => set({ showShortcutsModal: true }),
      closeShortcutsModal: () => set({ showShortcutsModal: false }),

      openExport: () => set({ showExport: true }),
      closeExport: () => set({ showExport: false }),

      openImport: () => set({ showImport: true }),
      closeImport: () => set({ showImport: false }),

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
        if (ai.grok?.enabled && ai.grok.apiKey) {
          result.grok = { apiKey: ai.grok.apiKey };
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
      // Persist AI settings and keyboard settings, not modal visibility
      partialize: (state) => ({
        ai: state.ai,
        keyboard: state.keyboard,
      }),
    }
  )
);
