import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import type { Models, ReasoningEfforts, Providers } from "@/lib/types";

const VALID_MODEL_IDS = new Set(AVAILABLE_MODELS.map((m) => m.id));
const VALID_REASONING_IDS = new Set(REASONING_EFFORTS.map((r) => r.id));
const VALID_PROVIDERS = new Set(AVAILABLE_MODELS.map((m) => m.provider));

interface SettingsStore {
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: Record<Providers, string>;
  customPrompt: string;
  _hasHydrated: boolean;

  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  setApiKeys: (apiKeys: Record<Providers, string>) => void;
  setCustomPrompt: (prompt: string) => void;
  hasApiKeyForProvider: (provider: Providers) => boolean;
  setHasHydrated: (state: boolean) => void;
}

const hasApiKeyForProvider = (
  keys: Record<Providers, string>,
  provider: Providers
): boolean => {
  return !!(keys[provider] && keys[provider].trim() !== "");
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      // Default values
      model:
        AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id,
      reasoningEffort: REASONING_EFFORTS[0].id,
      apiKeys: {
        openrouter: "",
        openai: "",
        anthropic: "",
      },
      customPrompt: "",
      _hasHydrated: false,

      setModel: (model: Models) => {
        set({ model });
      },

      setReasoningEffort: (reasoningEffort: ReasoningEfforts) => {
        set({ reasoningEffort });
      },

      setApiKeys: (apiKeys: Record<Providers, string>) => {
        const hasAnyKey = Object.values(apiKeys).some(
          (key) => key && key.toString().trim() !== ""
        );

        const availableModels = AVAILABLE_MODELS.filter((model) =>
          hasApiKeyForProvider(apiKeys, model.provider)
        );

        let selectedModel = get().model;
        const selectedModelProvider = AVAILABLE_MODELS.find(
          (m) => m.id === selectedModel
        )?.provider;
        const defaultModel = AVAILABLE_MODELS.find((m) => m.default);

        // Removed all API keys
        if (!hasAnyKey) {
          selectedModel = defaultModel!.id;

          // Removed API key for selected model
        } else if (
          selectedModel &&
          selectedModelProvider &&
          !hasApiKeyForProvider(apiKeys, selectedModelProvider)
        ) {
          selectedModel = availableModels[0].id;
        }

        // Gotten here then keep the selected model as is

        set({
          apiKeys,
          model: selectedModel,
        });
      },

      setCustomPrompt: (customPrompt: string) => {
        set({ customPrompt });
      },

      hasApiKeyForProvider: (provider: Providers) => {
        const { apiKeys } = get();
        return hasApiKeyForProvider(apiKeys, provider);
      },

      setHasHydrated: (state: boolean) => {
        set({
          _hasHydrated: state,
        });
      },
    }),
    {
      name: "settings-store",
      partialize: (state) => ({
        model: state.model,
        reasoningEffort: state.reasoningEffort,
        apiKeys: state.apiKeys,
        customPrompt: state.customPrompt,
      }),

      // Fix hydration issues with proper merge function
      merge: (persistedState, currentState) => {
        const typedPersistedState = persistedState as Partial<SettingsStore>;

        // Validate and sanitize the persisted model
        const sanitizedModel =
          typedPersistedState.model &&
          VALID_MODEL_IDS.has(typedPersistedState.model)
            ? typedPersistedState.model
            : currentState.model;

        // Validate and sanitize the persisted reasoning effort
        const sanitizedReasoningEffort =
          typedPersistedState.reasoningEffort &&
          VALID_REASONING_IDS.has(typedPersistedState.reasoningEffort)
            ? typedPersistedState.reasoningEffort
            : currentState.reasoningEffort;

        // Sanitize API keys
        const sanitizedApiKeys: Record<Providers, string> = {
          openrouter: "",
          openai: "",
          anthropic: "",
        };

        // Only add keys from persisted state if the provider is valid
        if (typedPersistedState.apiKeys) {
          Object.entries(typedPersistedState.apiKeys).forEach(
            ([provider, key]) => {
              if (VALID_PROVIDERS.has(provider as Providers)) {
                sanitizedApiKeys[provider as Providers] = key || "";
              }
            }
          );
        }

        return {
          ...currentState,
          model: sanitizedModel,
          reasoningEffort: sanitizedReasoningEffort,
          apiKeys: sanitizedApiKeys,
          customPrompt:
            typedPersistedState.customPrompt || currentState.customPrompt,
          _hasHydrated: true,
        };
      },

      // Add storage check for Next.js compatibility
      storage: {
        getItem: (name) => {
          if (typeof window === "undefined") return null;
          const value = localStorage.getItem(name);
          return value ? JSON.parse(value) : null;
        },
        setItem: (name, value) => {
          if (typeof window === "undefined") return;
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          if (typeof window === "undefined") return;
          localStorage.removeItem(name);
        },
      },

      // Skip hydration during SSR
      skipHydration: true,
    }
  )
);

export const useHasApiKeys = () => {
  return useSettingsStore((state) =>
    Object.values(state.apiKeys).some((key) => key && key.trim() !== "")
  );
};

// Helper hook to check if store has hydrated
export const useHasHydrated = () => {
  return useSettingsStore((state) => state._hasHydrated);
};
