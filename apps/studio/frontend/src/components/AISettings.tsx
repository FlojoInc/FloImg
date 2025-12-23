import { useState } from "react";
import { useSettingsStore } from "../stores/settingsStore";

// Provider metadata
const CLOUD_PROVIDERS = [
  {
    id: "openai" as const,
    name: "OpenAI",
    description: "GPT-4 Vision, GPT-4 Text, DALL-E 3",
    placeholder: "sk-...",
    docsUrl: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic" as const,
    name: "Anthropic",
    description: "Claude Vision, Claude Text",
    placeholder: "sk-ant-...",
    docsUrl: "https://console.anthropic.com/settings/keys",
  },
  {
    id: "gemini" as const,
    name: "Google AI",
    description: "Gemini Vision, Gemini Text",
    placeholder: "AIza...",
    docsUrl: "https://aistudio.google.com/apikey",
  },
  {
    id: "openrouter" as const,
    name: "OpenRouter",
    description: "Access multiple models with one API key",
    placeholder: "sk-or-...",
    docsUrl: "https://openrouter.ai/keys",
  },
];

const LOCAL_PROVIDERS = [
  {
    id: "ollama" as const,
    name: "Ollama",
    description: "Local LLaVA Vision, Llama/Mistral Text",
    defaultUrl: "http://localhost:11434",
    docsUrl: "https://ollama.ai",
  },
  {
    id: "lmstudio" as const,
    name: "LM Studio",
    description: "Local models via OpenAI-compatible API",
    defaultUrl: "http://localhost:1234",
    docsUrl: "https://lmstudio.ai",
  },
];

function CloudProviderRow({ provider }: { provider: (typeof CLOUD_PROVIDERS)[number] }) {
  const ai = useSettingsStore((s) => s.ai);
  const setAIProvider = useSettingsStore((s) => s.setAIProvider);

  const config = ai[provider.id];
  const isEnabled = config?.enabled ?? false;
  const apiKey = (config as { apiKey?: string })?.apiKey ?? "";

  const [localKey, setLocalKey] = useState(apiKey);
  const [showKey, setShowKey] = useState(false);

  const handleToggle = () => {
    setAIProvider(provider.id, {
      apiKey: localKey,
      enabled: !isEnabled,
    });
  };

  const handleKeyChange = (value: string) => {
    setLocalKey(value);
    setAIProvider(provider.id, {
      apiKey: value,
      enabled: isEnabled,
    });
  };

  return (
    <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{provider.name}</span>
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            Get API key
          </a>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{provider.description}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? "text" : "password"}
              value={localKey}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={provider.placeholder}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {showKey ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? "bg-teal-600" : "bg-gray-300 dark:bg-zinc-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

function LocalProviderRow({ provider }: { provider: (typeof LOCAL_PROVIDERS)[number] }) {
  const ai = useSettingsStore((s) => s.ai);
  const setAIProvider = useSettingsStore((s) => s.setAIProvider);

  const config = ai[provider.id];
  const isEnabled = config?.enabled ?? false;
  const baseUrl = (config as { baseUrl?: string })?.baseUrl ?? provider.defaultUrl;

  const [localUrl, setLocalUrl] = useState(baseUrl);

  const handleToggle = () => {
    setAIProvider(provider.id, {
      baseUrl: localUrl,
      enabled: !isEnabled,
    });
  };

  const handleUrlChange = (value: string) => {
    setLocalUrl(value);
    setAIProvider(provider.id, {
      baseUrl: value,
      enabled: isEnabled,
    });
  };

  return (
    <div className="flex items-start gap-4 p-4 border border-gray-200 dark:border-zinc-700 rounded-lg">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900 dark:text-white">{provider.name}</span>
          <a
            href={provider.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-teal-600 dark:text-teal-400 hover:underline"
          >
            Docs
          </a>
          <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded">
            Local
          </span>
        </div>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{provider.description}</p>
        <div className="mt-2">
          <input
            type="text"
            value={localUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder={provider.defaultUrl}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-zinc-600 rounded bg-white dark:bg-zinc-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-zinc-500"
          />
        </div>
      </div>
      <div className="flex items-center">
        <button
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isEnabled ? "bg-teal-600" : "bg-gray-300 dark:bg-zinc-600"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              isEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>
    </div>
  );
}

export function AISettings() {
  const showSettings = useSettingsStore((s) => s.showSettings);
  const closeSettings = useSettingsStore((s) => s.closeSettings);

  if (!showSettings) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-zinc-800 rounded-lg shadow-xl max-w-xl w-full mx-4 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-zinc-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              AI Provider Settings
            </h2>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">
              Configure your AI providers for vision and text generation
            </p>
          </div>
          <button
            onClick={closeSettings}
            className="text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-200"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Cloud Providers */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              Cloud Providers
            </h3>
            <div className="space-y-3">
              {CLOUD_PROVIDERS.map((provider) => (
                <CloudProviderRow key={provider.id} provider={provider} />
              ))}
            </div>
          </section>

          {/* Local Providers */}
          <section>
            <h3 className="text-sm font-medium text-gray-700 dark:text-zinc-300 mb-3">
              Local Providers
            </h3>
            <div className="space-y-3">
              {LOCAL_PROVIDERS.map((provider) => (
                <LocalProviderRow key={provider.id} provider={provider} />
              ))}
            </div>
          </section>

          {/* Privacy Notice */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-300">
                  Your keys stay local
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
                  API keys are stored in your browser only and sent directly to providers. They
                  never pass through our servers.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end px-6 py-4 border-t border-gray-200 dark:border-zinc-700">
          <button
            onClick={closeSettings}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-md hover:bg-teal-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
