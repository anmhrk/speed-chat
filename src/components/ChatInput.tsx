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
  ArrowDown,
} from "lucide-react";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "./ui/card";
import { getRateLimitStatus } from "../backend/ratelimit/status";
import type { User } from "better-auth";
import { toast } from "sonner";
import type {
  ReasoningEfforts,
  ReasoningEffortConfig,
  Models,
  ModelConfig,
  Providers,
  RateLimitInfo,
} from "@/lib/types";

export const REASONING_EFFORTS: ReasoningEffortConfig[] = [
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

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "gpt-4.1",
    name: "GPT 4.1",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    attachments: true,
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
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
    id: "claude-opus-4",
    name: "Claude Opus 4",
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
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    logo: <img src="/logos/Google.svg" alt="Google" className="h-4 w-4" />,
    provider: "openrouter",
    default: true,
    attachments: true,
  },
  {
    id: "google/gemini-2.5-pro-preview",
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
    id: "gpt-image-1",
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
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  user: User | null | undefined;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
}

export function ChatInput({
  prompt,
  handleInputChange,
  handleSubmit,
  user,
  showScrollToBottom,
  scrollToBottom,
}: ChatInputProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
  });
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null,
  );

  useEffect(() => {
    const savedModel = getLocalStorage("selectedModel");
    const savedReasoningEffort = getLocalStorage("reasoningEffort");
    let keys: Record<Providers, string> = {
      openrouter: "",
      openai: "",
      anthropic: "",
    };

    const savedKeys = getLocalStorage("api_keys");
    keys = savedKeys ? JSON.parse(savedKeys) : {};
    const hasAnyKey = Object.values(keys).some(
      (key) => key && key.toString().trim() !== "",
    );
    setHasApiKeys(hasAnyKey);
    setApiKeys(keys);

    // Helper function to check if a provider has an API key
    const hasApiKey = (provider: Providers) => {
      return keys[provider] && keys[provider].trim() !== "";
    };

    // Find available models with API keys + always include Gemini 2.5 Flash for free usage
    const availableModels = AVAILABLE_MODELS.filter(
      (model) =>
        model.id === "google/gemini-2.5-flash-preview-05-20" ||
        hasApiKey(model.provider),
    );

    // Set model with fallback logic
    let selectedModel = null;
    if (savedModel && AVAILABLE_MODELS.find((m) => m.id === savedModel)) {
      const savedModelData = AVAILABLE_MODELS.find((m) => m.id === savedModel);
      // Check if the saved model's provider has an API key OR if it's Gemini 2.5 Flash (free)
      if (
        savedModelData &&
        (savedModelData.id === "google/gemini-2.5-flash-preview-05-20" ||
          hasApiKey(savedModelData.provider))
      ) {
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

    setModel(selectedModel as Models);
    setReasoningEffort(
      (savedReasoningEffort &&
        REASONING_EFFORTS.find((r) => r.id === savedReasoningEffort)?.id) ||
        REASONING_EFFORTS[0].id,
    );
  }, []);

  const handleModelChange = (newModel: Models) => {
    setModel(newModel);
    setLocalStorage("selectedModel", newModel);
  };

  const handleReasoningEffortChange = (
    newReasoningEffort: ReasoningEfforts,
  ) => {
    setReasoningEffort(newReasoningEffort);
    setLocalStorage("reasoningEffort", newReasoningEffort);
  };

  // Fetch rate limit info when using Gemini 2.5 Flash without API key
  const fetchRateLimitInfo = async () => {
    if (
      user &&
      model === "google/gemini-2.5-flash-preview-05-20" &&
      !apiKeys.openrouter
    ) {
      try {
        const data = await getRateLimitStatus();
        setRateLimitInfo(data ?? null);
      } catch (error) {
        console.error("Failed to fetch rate limit info:", error);
      }
    } else {
      setRateLimitInfo(null);
    }
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

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    const canSubmit =
      hasApiKeys || model === "google/gemini-2.5-flash-preview-05-20";
    if (canSubmit && prompt.trim()) {
      handleSubmit(e);
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
    <div className="relative w-full space-y-3">
      {user &&
        model === "google/gemini-2.5-flash-preview-05-20" &&
        !apiKeys.openrouter &&
        rateLimitInfo && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                <span className="text-sm text-blue-800 dark:text-blue-200">
                  Free Gemini 2.5 Flash: {rateLimitInfo.remaining} messages
                  remaining today. Add API keys for extended usage.
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

      {showScrollToBottom && (
        <Button
          variant="outline"
          size="sm"
          onClick={scrollToBottom}
          className="absolute -top-16 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full"
        >
          <ArrowDown className="size-4" />
          Scroll to bottom
        </Button>
      )}

      <form onSubmit={handleChatSubmit} className="relative">
        <div className="bg-background relative rounded-t-2xl border border-b-0">
          <Textarea
            ref={promptRef}
            value={prompt}
            onChange={handleInputChange}
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
              disabled={
                !user ||
                !prompt.trim() ||
                (!hasApiKeys &&
                  model !== "google/gemini-2.5-flash-preview-05-20")
              }
            >
              <ArrowUp className="size-6" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
