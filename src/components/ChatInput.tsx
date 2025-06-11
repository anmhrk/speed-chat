import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ModelPicker } from "./ModelPicker";
import {
  ArrowUp,
  Sparkle,
  Sparkles,
  WandSparkles,
  AlertTriangle,
  type LucideIcon,
} from "lucide-react";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "./ui/card";

type ReasoningEffort = {
  id: string;
  icon: LucideIcon;
};

export const REASONING_EFFORTS: ReasoningEffort[] = [
  {
    id: "low",
    icon: Sparkle,
  },
  {
    id: "medium",
    icon: Sparkles,
  },
  {
    id: "high",
    icon: WandSparkles,
  },
];

type Model = {
  id: string;
  name: string;
  logo: React.ReactNode;
  default?: boolean;
  provider: "openai" | "anthropic" | "openrouter";
  reasoning?: boolean;
  images?: boolean;
  attachments?: boolean;
  search?: boolean;
};

export const AVAILABLE_MODELS: Model[] = [
  {
    id: "gpt-4.1",
    name: "GPT 4.1",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    attachments: true,
  },
  {
    id: "claude-4-sonnet",
    name: "Claude 4 Sonnet",
    logo: (
      <img
        src="/logos/Anthropic-dark.svg"
        alt="Anthropic"
        className="h-4 w-4"
      />
    ),
    provider: "anthropic",
    attachments: true,
    search: true,
  },
  {
    id: "claude-4-opus",
    name: "Claude 4 Opus",
    logo: (
      <img
        src="/logos/Anthropic-dark.svg"
        alt="Anthropic"
        className="h-4 w-4"
      />
    ),
    provider: "anthropic",
    attachments: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    logo: <img src="/logos/Google.svg" alt="Google" className="h-4 w-4" />,
    provider: "openrouter",
    default: true,
    attachments: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    logo: <img src="/logos/Google.svg" alt="Google" className="h-4 w-4" />,
    provider: "openrouter",
    reasoning: true,
    attachments: true,
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    attachments: true,
    reasoning: true,
  },
  {
    id: "gpt-imagegen",
    name: "GPT ImageGen",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    images: true,
  },
  {
    id: "o3",
    name: "o3",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    attachments: true,
    reasoning: true,
  },
];

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export function ChatInput({ prompt, setPrompt }: ChatInputProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [model, setModel] = useState<string | null>(null);
  const [reasoningEffort, setReasoningEffort] = useState<string | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(true);
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});

  useEffect(() => {
    const savedModel = getLocalStorage("selectedModel");
    const savedReasoningEffort = getLocalStorage("reasoningEffort");
    let keys: Record<string, string> = {};

    try {
      const savedKeys = getLocalStorage("api_keys");
      keys = savedKeys ? JSON.parse(savedKeys) : {};
      const hasAnyKey = Object.values(keys).some(
        (key) => key && key.toString().trim() !== "",
      );
      setHasApiKeys(hasAnyKey);
      setApiKeys(keys);
    } catch {
      setHasApiKeys(false);
      setApiKeys({});
    }

    // Helper function to check if a provider has an API key
    const hasApiKey = (provider: string) => {
      return keys[provider] && keys[provider].trim() !== "";
    };

    // Find available models with API keys
    const availableModels = AVAILABLE_MODELS.filter((model) =>
      hasApiKey(model.provider),
    );

    // Set model with fallback logic
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

    // Final fallback to any model (for cases where no API keys are set)
    if (!selectedModel) {
      selectedModel =
        AVAILABLE_MODELS.find((m) => m.default)?.id || AVAILABLE_MODELS[0].id;
    }

    setModel(selectedModel);
    setReasoningEffort(
      (savedReasoningEffort &&
        REASONING_EFFORTS.find((r) => r.id === savedReasoningEffort)?.id) ||
        REASONING_EFFORTS[0].id,
    );
  }, []);

  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    setLocalStorage("selectedModel", newModel);
  };

  const handleReasoningEffortChange = (newReasoningEffort: string) => {
    setReasoningEffort(newReasoningEffort);
    setLocalStorage("reasoningEffort", newReasoningEffort);
  };

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.focus();
    }
  }, []);

  // Listen for storage changes to update API keys in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedKeys = getLocalStorage("api_keys");
        const keys = savedKeys ? JSON.parse(savedKeys) : {};
        const hasAnyKey = Object.values(keys).some(
          (key) => key && key.toString().trim() !== "",
        );
        setHasApiKeys(hasAnyKey);
        setApiKeys(keys);
      } catch {
        setHasApiKeys(false);
        setApiKeys({});
      }
    };

    // Listen for storage events (when localStorage is changed in another tab)
    window.addEventListener("storage", handleStorageChange);

    // Also listen for focus events to check when user returns to tab
    window.addEventListener("focus", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("focus", handleStorageChange);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasApiKeys && prompt.trim()) {
      console.log("Sending message:", prompt);
      setPrompt("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }

    if (e.key === "Escape") {
      promptRef.current?.blur();
    }
  };

  return (
    <div className="w-full space-y-3">
      {!hasApiKeys && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center justify-between px-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-sm text-yellow-800 dark:text-yellow-200">
                No API keys detected. Add one to start chatting.
              </span>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hover:bg-zinc-800"
            >
              <Link to="/settings/keys">Add Keys</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-background relative rounded-t-2xl border border-b-0">
          <Textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="placeholder:text-muted-foreground max-h-[350px] min-h-[100px] w-full resize-none border-0 bg-transparent p-4 focus-visible:ring-0"
          />

          <div className="flex items-center justify-between px-4 py-3">
            {model && reasoningEffort ? (
              <ModelPicker
                selectedModel={model}
                onModelChange={handleModelChange}
                reasoningEffort={reasoningEffort}
                onReasoningEffortChange={handleReasoningEffortChange}
                availableApiKeys={apiKeys}
              />
            ) : (
              <div className="flex-1" />
            )}
            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={!prompt.trim() || !hasApiKeys}
            >
              <ArrowUp className="size-6" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
