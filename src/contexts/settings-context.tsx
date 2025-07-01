"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import type { Models, Providers, ReasoningEfforts } from "@/lib/types";

const VALID_MODEL_IDS = new Set(AVAILABLE_MODELS.map((m) => m.id));
const VALID_REASONING_IDS = new Set(REASONING_EFFORTS.map((r) => r.id));
const VALID_PROVIDERS = new Set(AVAILABLE_MODELS.map((m) => m.providerId));
const DEFAULT_MODEL =
  AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id;
const LOCAL_STORAGE_KEY = "settings";

interface SettingsState {
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: Record<Providers, string>;
  customPrompt: string;
  hasApiKeys: boolean;
  isHydrated: boolean;
}

interface SettingsActions {
  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  setApiKeys: (apiKeys: Record<Providers, string>) => void;
  setCustomPrompt: (prompt: string) => void;
  hasApiKeyForProvider: (provider: Providers) => boolean;
}

type SettingsContext = SettingsState & SettingsActions;

type PartialSettingsState = Pick<
  SettingsState,
  "model" | "reasoningEffort" | "apiKeys" | "customPrompt"
>;

const INITIAL_STATE: PartialSettingsState = {
  model: DEFAULT_MODEL,
  reasoningEffort: REASONING_EFFORTS[0].id,
  apiKeys: {
    openrouter: "",
    openai: "",
    falai: "",
    vertex: "",
  },
  customPrompt: "",
};

const SettingsContext = createContext<SettingsContext | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PartialSettingsState>(INITIAL_STATE);
  const [isHydrated, setIsHydrated] = useState(false);

  const hasApiKeyForProvider = useCallback(
    (provider: Providers) => {
      const key = state.apiKeys[provider];
      return !!(key && key.trim() !== "");
    },
    [state.apiKeys]
  );

  const setModel = (model: Models) => setState((prev) => ({ ...prev, model }));

  const setReasoningEffort = (reasoningEffort: ReasoningEfforts) =>
    setState((prev) => ({ ...prev, reasoningEffort }));

  const setApiKeys = (apiKeys: Record<Providers, string>) => {
    setState((prev) => {
      const hasAnyKey = Object.values(apiKeys).some(
        (key) => key && key.toString().trim() !== ""
      );

      const availableModels = AVAILABLE_MODELS.filter((model) =>
        apiKeys[model.providerId as Providers]?.trim()
      );

      let selectedModel = prev.model;
      const selectedModelProvider = AVAILABLE_MODELS.find(
        (m) => m.id === selectedModel
      )?.providerId;
      const defaultModel =
        AVAILABLE_MODELS.find((m) => m.default) ?? AVAILABLE_MODELS[0];

      // Only change model if we're hydrated and not during initial load
      if (isHydrated) {
        // Removed all API keys
        if (!hasAnyKey) {
          selectedModel = defaultModel.id;
          // Removed API key for selected model
        } else if (
          selectedModel &&
          selectedModelProvider &&
          !apiKeys[selectedModelProvider]?.trim()
        ) {
          selectedModel = availableModels[0]?.id ?? defaultModel.id;
        }
      }

      return {
        ...prev,
        apiKeys,
        model: selectedModel,
      };
    });
  };

  const setCustomPrompt = (customPrompt: string) =>
    setState((prev) => ({ ...prev, customPrompt }));

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (!raw) {
        setIsHydrated(true);
        return;
      }

      const persisted: PartialSettingsState = JSON.parse(raw);

      // Sanitize persisted values
      const sanitizedModel =
        persisted.model && VALID_MODEL_IDS.has(persisted.model)
          ? persisted.model
          : INITIAL_STATE.model;

      const sanitizedReasoningEffort =
        persisted.reasoningEffort &&
        VALID_REASONING_IDS.has(persisted.reasoningEffort)
          ? persisted.reasoningEffort
          : INITIAL_STATE.reasoningEffort;

      const sanitizedApiKeys: Record<Providers, string> = {
        openrouter: "",
        openai: "",
        falai: "",
        vertex: "",
      };

      if (persisted.apiKeys) {
        Object.entries(persisted.apiKeys).forEach(([provider, key]) => {
          if (VALID_PROVIDERS.has(provider as Providers)) {
            sanitizedApiKeys[provider as Providers] = key || "";
          }
        });
      }

      // Set state all at once to avoid multiple re-renders
      setState({
        model: sanitizedModel,
        reasoningEffort: sanitizedReasoningEffort,
        apiKeys: sanitizedApiKeys,
        customPrompt: persisted.customPrompt || "",
      });

      setIsHydrated(true);
    } catch (err) {
      console.error("Failed to hydrate settings", err);
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage when state changes (but only after hydration)
  useEffect(() => {
    if (!isHydrated) return;

    const toPersist: PartialSettingsState = {
      model: state.model,
      reasoningEffort: state.reasoningEffort,
      apiKeys: state.apiKeys,
      customPrompt: state.customPrompt,
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
    state.customPrompt,
    isHydrated,
  ]);

  const value: SettingsContext = {
    ...state,
    isHydrated,
    hasApiKeys: Object.values(state.apiKeys).some(
      (key) => key && key.trim() !== ""
    ),
    setModel,
    setReasoningEffort,
    setApiKeys,
    setCustomPrompt,
    hasApiKeyForProvider,
  };

  return <SettingsContext value={value}>{children}</SettingsContext>;
}

export function useSettingsContext(): SettingsContext {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error(
      "useSettingsStore must be used within a SettingsProvider component"
    );
  }
  return context;
}
