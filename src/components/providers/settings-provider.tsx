"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { z } from "zod";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import type {
  Customization,
  Models,
  Providers,
  ReasoningEfforts,
  APIKeys,
} from "@/lib/types";

// Zod schemas for validation
const ModelsSchema = z.enum(
  AVAILABLE_MODELS.map((m) => m.id) as [Models, ...Models[]]
);

const ReasoningEffortSchema = z.enum(
  REASONING_EFFORTS.map((r) => r.id) as [
    ReasoningEfforts,
    ...ReasoningEfforts[],
  ]
);

const APIKeysSchema = z.object({
  openrouter: z.string(),
  openai: z.string(),
  falai: z.string(),
  exa: z.string(),
});

const CustomizationSchema = z.object({
  name: z.string(),
  whatYouDo: z.string(),
  traits: z.array(z.string()),
  additionalInfo: z.string(),
});

const SettingsStateSchema = z.object({
  model: ModelsSchema,
  reasoningEffort: ReasoningEffortSchema,
  apiKeys: APIKeysSchema,
  customization: CustomizationSchema,
  favoriteModels: z.array(ModelsSchema),
  reasoningEnabled: z.boolean(),
});

const DEFAULT_MODEL =
  AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id;
const LOCAL_STORAGE_KEY = "saved_settings";

interface SettingsState {
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: APIKeys;
  customization: Customization;
  favoriteModels: Models[];
  reasoningEnabled: boolean;
  isHydrated: boolean;
}

interface SettingsActions {
  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  setApiKeys: (apiKeys: APIKeys) => void;
  setCustomization: (customization: Customization) => void;
  toggleFavoriteModel: (model: Models) => void;
  isFavoriteModel: (model: Models) => boolean;
  setReasoningEnabled: (reasoningEnabled: boolean) => void;
  hasAnyKey: () => boolean;
  hasApiKeyForProvider: (provider: Providers) => boolean;
}

type SettingsContext = SettingsState & SettingsActions;

type PartialSettingsState = Pick<
  SettingsState,
  | "model"
  | "reasoningEffort"
  | "apiKeys"
  | "customization"
  | "favoriteModels"
  | "reasoningEnabled"
>;

const INITIAL_STATE: PartialSettingsState = {
  model: DEFAULT_MODEL,
  reasoningEffort: REASONING_EFFORTS[0].id,
  apiKeys: {
    openrouter: "",
    openai: "",
    falai: "",
    exa: "",
  },
  customization: {
    name: "",
    whatYouDo: "",
    traits: [],
    additionalInfo: "",
  },
  favoriteModels: [],
  reasoningEnabled: true,
};

const SettingsContext = createContext<SettingsContext | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PartialSettingsState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  const hasAnyKey = () => {
    const { openrouter, openai, falai } = state.apiKeys;
    return !!(openrouter.trim() || openai.trim() || falai.trim()); // Don't include exa key cos this checks only for model keys
  };

  const hasApiKeyForProvider = (provider: Providers) => {
    const key = state.apiKeys[provider];
    return !!(key && (key as string).trim() !== "");
  };

  const isFavoriteModel = (model: Models) => {
    return state.favoriteModels.includes(model);
  };

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

  const setApiKeys = (apiKeys: APIKeys) => {
    setState((prev) => {
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

  const setReasoningEnabled = (reasoningEnabled: boolean) =>
    setState((prev) => ({ ...prev, reasoningEnabled }));

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

      // Validate persisted values using Zod schema
      const validationResult = SettingsStateSchema.safeParse(persisted);

      if (!validationResult.success) {
        console.warn(
          "Invalid settings data found, clearing...",
          validationResult.error
        );
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        setIsHydrated(true);
        return;
      }

      setState(validationResult.data);
      setIsHydrated(true);
    } catch (err) {
      console.error("Failed to hydrate settings", err);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
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
      reasoningEnabled: state.reasoningEnabled,
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
    state.reasoningEnabled,
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
    setReasoningEnabled,
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
