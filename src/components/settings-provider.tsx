import { createContext, useContext, useState, useEffect } from "react";
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

interface SettingsContextType {
  model: Models | null;
  setModel: (model: Models) => void;
  reasoningEffort: ReasoningEfforts | null;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  apiKeys: Record<Providers, string> | null;
  setApiKeys: (apiKeys: Record<Providers, string> | null) => void;
  hasApiKeys: boolean;
  customInstructions: CustomInstructions | null;
  setCustomInstructions: (instructions: CustomInstructions | null) => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string> | null>(
    null
  );
  const [hasApiKeys, setHasApiKeys] = useState(false);
  const [customInstructions, setCustomInstructions] =
    useState<CustomInstructions | null>(null);

  useEffect(() => {
    const savedInstructions = localStorage.getItem(CUSTOM_INSTRUCTIONS_KEY);
    if (savedInstructions) {
      const parsed = JSON.parse(savedInstructions);
      setCustomInstructions(parsed);
    }

    let keys: Record<Providers, string> = {
      openrouter: "",
      openai: "",
      anthropic: "",
    };
    const savedKeys = localStorage.getItem(API_KEYS_KEY);
    keys = savedKeys ? JSON.parse(savedKeys) : keys;
    const hasAnyKey = Object.values(keys).some(
      (key) => key && key.toString().trim() !== ""
    );
    setHasApiKeys(hasAnyKey);
    setApiKeys(keys);

    const hasApiKey = (provider: Providers) => {
      return keys[provider] && keys[provider].trim() !== "";
    };

    const savedModel = localStorage.getItem(SELECTED_MODEL_KEY);
    const savedReasoningEffort = localStorage.getItem(REASONING_EFFORT_KEY);

    const availableModels = AVAILABLE_MODELS.filter((model) =>
      hasApiKey(model.provider)
    );

    let selectedModel = null;
    if (savedModel && AVAILABLE_MODELS.find((m) => m.id === savedModel)) {
      const savedModelData = AVAILABLE_MODELS.find((m) => m.id === savedModel);
      // Check if the saved model's provider has an API key
      if (savedModelData && hasApiKey(savedModelData.provider)) {
        selectedModel = savedModel;
      }
    }

    // If no valid saved model, find the first available model with API key
    if (!selectedModel && availableModels.length > 0) {
      // Try to find a default model first
      const defaultModel = availableModels.find((m) => m.default);
      selectedModel = defaultModel ? defaultModel.id : availableModels[0].id;
    }

    // Final fallback to default model
    if (!selectedModel) {
      selectedModel =
        AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id;
    }

    setModel(selectedModel as Models);
    setReasoningEffort(
      (savedReasoningEffort &&
        REASONING_EFFORTS.find((r) => r.id === savedReasoningEffort)?.id) ||
        REASONING_EFFORTS[0].id
    );
  }, []);

  const handleModelChange = (newModel: Models) => {
    setModel(newModel);
    localStorage.setItem(SELECTED_MODEL_KEY, newModel);
  };

  const handleReasoningEffortChange = (
    newReasoningEffort: ReasoningEfforts
  ) => {
    setReasoningEffort(newReasoningEffort);
    localStorage.setItem(REASONING_EFFORT_KEY, newReasoningEffort);
  };

  const handleApiKeysChange = (
    newApiKeys: Record<Providers, string> | null
  ) => {
    setApiKeys(newApiKeys);
    localStorage.setItem(API_KEYS_KEY, JSON.stringify(newApiKeys));
    const hasAnyKey = Object.values(newApiKeys || {}).some(
      (key) => key && key.toString().trim() !== ""
    );
    setHasApiKeys(hasAnyKey);
  };

  const handleCustomInstructionsChange = (
    newInstructions: CustomInstructions | null
  ) => {
    setCustomInstructions(newInstructions);
    localStorage.setItem(
      CUSTOM_INSTRUCTIONS_KEY,
      JSON.stringify(newInstructions)
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
      "useSettingsContext must be used within a SettingsProvider"
    );
  }
  return context;
}
