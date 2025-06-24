"use client";

import { createContext, useContext, useState, useEffect, useMemo } from "react";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import type {
  Models,
  ReasoningEfforts,
  Providers,
  CustomInstructions,
} from "@/lib/types";

const CUSTOM_INSTRUCTIONS_KEY = "custom_instructions";
const API_KEYS_KEY = "api_keys";
const SELECTED_MODEL_KEY = "selected_model";
const REASONING_EFFORT_KEY = "reasoning_effort";

const DEFAULT_MODEL =
  AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id;
const DEFAULT_REASONING_EFFORT: ReasoningEfforts = "low";
const DEFAULT_API_KEYS: Record<Providers, string> = {
  openrouter: "",
  openai: "",
  anthropic: "",
};
const DEFAULT_CUSTOM_INSTRUCTIONS: CustomInstructions = {
  name: "",
  whatYouDo: "",
  howToRespond: "",
  additionalInfo: "",
};

interface SettingsContextType {
  model: Models;
  setModel: (model: Models) => void;
  reasoningEffort: ReasoningEfforts;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  apiKeys: Record<Providers, string>;
  setApiKeys: (apiKeys: Record<Providers, string>) => void;
  hasApiKeys: boolean;
  customInstructions: CustomInstructions;
  setCustomInstructions: (instructions: CustomInstructions) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined,
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<Models>(DEFAULT_MODEL as Models);
  const [reasoningEffort, setReasoningEffort] = useState<ReasoningEfforts>(
    DEFAULT_REASONING_EFFORT,
  );
  const [apiKeys, setApiKeys] =
    useState<Record<Providers, string>>(DEFAULT_API_KEYS);
  const [customInstructions, setCustomInstructions] =
    useState<CustomInstructions>(DEFAULT_CUSTOM_INSTRUCTIONS);

  const hasApiKeys = useMemo(() => {
    return Object.values(apiKeys).some((key) => key && key.trim() !== "");
  }, [apiKeys]);

  useEffect(() => {
    try {
      const savedInstructions = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
      if (savedInstructions) {
        const parsed = JSON.parse(savedInstructions);
        setCustomInstructions({ ...DEFAULT_CUSTOM_INSTRUCTIONS, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to parse saved custom instructions:", error);
    }

    try {
      const savedKeys = localStorage.getItem(API_KEYS_KEY);
      if (savedKeys) {
        const parsed = JSON.parse(savedKeys);
        setApiKeys({ ...DEFAULT_API_KEYS, ...parsed });
      }
    } catch (error) {
      console.warn("Failed to parse saved API keys:", error);
    }

    try {
      const savedReasoningEffort = localStorage.getItem(REASONING_EFFORT_KEY);
      if (
        savedReasoningEffort &&
        REASONING_EFFORTS.includes(savedReasoningEffort as ReasoningEfforts)
      ) {
        setReasoningEffort(savedReasoningEffort as ReasoningEfforts);
      }
    } catch (error) {
      console.warn("Failed to parse saved reasoning effort:", error);
    }

    try {
      const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
      if (savedModel && AVAILABLE_MODELS.find((m) => m.id === savedModel)) {
        setModel(savedModel as Models);
      }
    } catch (error) {
      console.warn("Failed to parse saved model:", error);
    }
  }, []);

  useEffect(() => {
    const hasApiKey = (provider: Providers) => {
      return apiKeys[provider] && apiKeys[provider].trim() !== "";
    };

    const availableModels = AVAILABLE_MODELS.filter((model) =>
      hasApiKey(model.provider),
    );

    // Check if current model is still valid (has API key)
    const currentModelData = AVAILABLE_MODELS.find((m) => m.id === model);
    if (currentModelData && !hasApiKey(currentModelData.provider)) {
      // Current model is no longer valid, find a new one
      if (availableModels.length > 0) {
        const defaultModel = availableModels.find((m) => m.default);
        const newModel = defaultModel ? defaultModel.id : availableModels[0].id;
        setModel(newModel as Models);
        localStorage.setItem(SELECTED_MODEL_KEY, newModel);
      } else {
        // No models with API keys, fall back to default
        setModel(DEFAULT_MODEL as Models);
        localStorage.setItem(SELECTED_MODEL_KEY, DEFAULT_MODEL);
      }
    }
  }, [apiKeys, model]);

  const handleModelChange = (newModel: Models) => {
    setModel(newModel);
    localStorage.setItem(SELECTED_MODEL_KEY, newModel);
  };

  const handleReasoningEffortChange = (
    newReasoningEffort: ReasoningEfforts,
  ) => {
    setReasoningEffort(newReasoningEffort);
    localStorage.setItem(REASONING_EFFORT_KEY, newReasoningEffort);
  };

  const handleApiKeysChange = (newApiKeys: Record<Providers, string>) => {
    setApiKeys(newApiKeys);
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(newApiKeys));
  };

  const handleCustomInstructionsChange = (
    newInstructions: CustomInstructions,
  ) => {
    setCustomInstructions(newInstructions);
    localStorage.setItem(
      CUSTOM_INSTRUCTIONS_KEY,
      JSON.stringify(newInstructions),
    );
  };

  const contextValue: SettingsContextType = {
    model,
    setModel: handleModelChange,
    reasoningEffort,
    setReasoningEffort: handleReasoningEffortChange,
    apiKeys,
    setApiKeys: handleApiKeysChange,
    hasApiKeys,
    customInstructions,
    setCustomInstructions: handleCustomInstructionsChange,
  };

  return <SettingsContext value={contextValue}>{children}</SettingsContext>;
}

export function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error(
      "useSettingsContext must be used within a SettingsProvider",
    );
  }
  return context;
}
