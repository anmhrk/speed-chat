"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import type {
  Customization,
  Models,
  Providers,
  ReasoningEfforts,
} from "@/lib/types";

const DEFAULT_MODEL =
  AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id;
const LOCAL_STORAGE_KEY = "saved_settings";

interface SettingsState {
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: Record<Providers, string>;
  customization: Customization;
  favoriteModels: Models[];
  isHydrated: boolean;
}

interface SettingsActions {
  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  setApiKeys: (apiKeys: Record<Providers, string>) => void;
  setCustomization: (customization: Customization) => void;
  toggleFavoriteModel: (model: Models) => void;
  isFavoriteModel: (model: Models) => boolean;
  hasAnyKey: () => boolean;
  hasApiKeyForProvider: (provider: Providers) => boolean;
}

type SettingsContext = SettingsState & SettingsActions;

type PartialSettingsState = Pick<
  SettingsState,
  "model" | "reasoningEffort" | "apiKeys" | "customization" | "favoriteModels"
>;

const INITIAL_STATE: PartialSettingsState = {
  model: DEFAULT_MODEL,
  reasoningEffort: REASONING_EFFORTS[0].id,
  apiKeys: {
    openrouter: "",
    openai: "",
    falai: "",
  },
  customization: {
    name: "",
    whatYouDo: "",
    traits: [],
    additionalInfo: "",
  },
  favoriteModels: [],
};

const SettingsContext = createContext<SettingsContext | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PartialSettingsState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  const hasAnyKey = useCallback(() => {
    const { openrouter, openai, falai } = state.apiKeys;
    return !!(openrouter.trim() || openai.trim() || falai.trim());
  }, [state.apiKeys]);

  const hasApiKeyForProvider = useCallback(
    (provider: Providers) => {
      const key = state.apiKeys[provider];
      return !!(key && (key as string).trim() !== "");
    },
    [state.apiKeys]
  );

  const isFavoriteModel = useCallback(
    (model: Models) => {
      return state.favoriteModels.includes(model);
    },
    [state.favoriteModels]
  );

  const toggleFavoriteModel = useCallback((model: Models) => {
    setState((prev) => ({
      ...prev,
      favoriteModels: prev.favoriteModels.includes(model)
        ? prev.favoriteModels.filter((m) => m !== model)
        : [...prev.favoriteModels, model],
    }));
  }, []);

  const setModel = (model: Models) => setState((prev) => ({ ...prev, model }));

  const setReasoningEffort = (reasoningEffort: ReasoningEfforts) =>
    setState((prev) => ({ ...prev, reasoningEffort }));

  const setApiKeys = (apiKeys: Record<Providers, string>) => {
    setState((prev) => {
      const hasAnyKey = Object.entries(apiKeys).some(([provider, key]) => {
        return key && (key as string).trim() !== "";
      });

      const availableModels = AVAILABLE_MODELS.filter((model) => {
        const provider = model.providerId;
        return (apiKeys[provider] as string)?.trim();
      });

      let selectedModel = prev.model;
      const selectedModelProvider = AVAILABLE_MODELS.find(
        (m) => m.id === selectedModel
      )?.providerId;
      const defaultModel =
        AVAILABLE_MODELS.find((m) => m.default) ?? AVAILABLE_MODELS[0];

      if (isHydrated) {
        // Removed all API keys
        if (!hasAnyKey) {
          selectedModel = defaultModel.id;
          // Removed API key for selected model
        } else if (selectedModel && selectedModelProvider) {
          const hasKeyForProvider = (() => {
            return (apiKeys[selectedModelProvider] as string)?.trim();
          })();

          if (!hasKeyForProvider) {
            selectedModel = availableModels[0]?.id ?? defaultModel.id;
          }
        }
      }

      return {
        ...prev,
        apiKeys,
        model: selectedModel,
      };
    });
  };

  const setCustomization = (customization: Customization) =>
    setState((prev) => ({ ...prev, customization }));

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }

      let persisted: PartialSettingsState;
      try {
        persisted = JSON.parse(raw);
      } catch (parseError) {
        console.error(
          "Failed to parse settings JSON, clearing corrupted data",
          parseError
        );
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setIsHydrated(true);
        return;
      }

      // Sanitize persisted values
      const sanitizedModel =
        persisted.model &&
        AVAILABLE_MODELS.some((m) => m.id === persisted.model)
          ? persisted.model
          : INITIAL_STATE.model;

      const sanitizedReasoningEffort =
        persisted.reasoningEffort &&
        REASONING_EFFORTS.some((r) => r.id === persisted.reasoningEffort)
          ? persisted.reasoningEffort
          : INITIAL_STATE.reasoningEffort;

      const sanitizedApiKeys: Record<Providers, string> = {
        openrouter: "",
        openai: "",
        falai: "",
      };

      if (persisted.apiKeys) {
        Object.entries(persisted.apiKeys).forEach(([provider, key]) => {
          if (AVAILABLE_MODELS.some((m) => m.providerId === provider)) {
            sanitizedApiKeys[provider as Providers] = (key as string) || "";
          }
        });
      }

      const sanitizedFavoriteModels = (persisted.favoriteModels || []).filter(
        (model) => AVAILABLE_MODELS.some((m) => m.id === model)
      );

      const sanitizedCustomization = persisted.customization
        ? {
            ...persisted.customization,
            traits: Array.isArray(persisted.customization.traits)
              ? persisted.customization.traits.filter(
                  (trait): trait is string => typeof trait === "string"
                )
              : INITIAL_STATE.customization.traits,
          }
        : INITIAL_STATE.customization;

      setState({
        model: sanitizedModel,
        reasoningEffort: sanitizedReasoningEffort,
        apiKeys: sanitizedApiKeys,
        customization: sanitizedCustomization,
        favoriteModels: sanitizedFavoriteModels,
      });

      setIsHydrated(true);
    } catch (err) {
      console.error("Failed to hydrate settings", err);
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage when state changes
  useEffect(() => {
    if (!isHydrated) return;

    const toPersist: PartialSettingsState = {
      model: state.model,
      reasoningEffort: state.reasoningEffort,
      apiKeys: state.apiKeys,
      customization: state.customization,
      favoriteModels: state.favoriteModels,
    };

    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(toPersist));
    } catch (err) {
      console.error("Failed to persist settings", err);
    }
  }, [
    state.model,
    state.reasoningEffort,
    state.apiKeys,
    state.customization,
    state.favoriteModels,
    isHydrated,
  ]);

  const value: SettingsContext = {
    ...state,
    isHydrated,
    hasAnyKey,
    setModel,
    setReasoningEffort,
    setApiKeys,
    setCustomization,
    toggleFavoriteModel,
    isFavoriteModel,
    hasApiKeyForProvider,
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettingsContext(): SettingsContext {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider component"
    );
  }
  return context;
}
