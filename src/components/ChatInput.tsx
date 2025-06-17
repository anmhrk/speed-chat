"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ModelPicker } from "@/components/ModelPicker";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import {
  ArrowUp,
  // AlertTriangle,
  ArrowDown,
  Square,
} from "lucide-react";
// import { Card, CardContent } from "@/components/ui/card";
// import { useRouter } from "next/navigation";
// import { getRateLimitStatus } from "@/lib/ratelimit/status";
import type {
  ReasoningEfforts,
  Models,
  Providers,
  // RateLimitInfo,
} from "@/lib/types";
import { Doc } from "../../convex/_generated/dataModel";

interface ChatInputProps {
  prompt: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  user: Doc<"users"> | null;
  showScrollToBottom: boolean;
  scrollToBottom: () => void;
  status: "error" | "submitted" | "streaming" | "ready";
  stop: () => void;
  model: Models | null;
  reasoningEffort: ReasoningEfforts | null;
  apiKeys: Record<Providers, string> | null;
  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  setApiKeys: (apiKeys: Record<Providers, string> | null) => void;
  hasApiKeys: boolean;
  setHasApiKeys: (hasApiKeys: boolean) => void;
}

export function ChatInput({
  prompt,
  handleInputChange,
  handleSubmit,
  user,
  showScrollToBottom,
  scrollToBottom,
  status,
  stop,
  model,
  reasoningEffort,
  apiKeys,
  setModel,
  setReasoningEffort,
  setApiKeys,
  hasApiKeys,
  setHasApiKeys,
}: ChatInputProps) {
  // const router = useRouter();
  const promptRef = useRef<HTMLTextAreaElement>(null);
  // const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
  //   null,
  // );

  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    const savedReasoningEffort = localStorage.getItem("reasoningEffort");

    let keys: Record<Providers, string> = {
      openrouter: "",
      openai: "",
      anthropic: "",
    };
    const savedKeys = localStorage.getItem("api_keys");
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
    localStorage.setItem("selectedModel", newModel);
  };

  const handleReasoningEffortChange = (
    newReasoningEffort: ReasoningEfforts,
  ) => {
    setReasoningEffort(newReasoningEffort);
    localStorage.setItem("reasoningEffort", newReasoningEffort);
  };

  // Fetch rate limit info when using Gemini 2.5 Flash without API key
  // const fetchRateLimitInfo = async () => {
  //   if (
  //     user &&
  //     model === "google/gemini-2.5-flash-preview-05-20" &&
  //     !apiKeys?.openrouter
  //   ) {
  //     try {
  //       const data = await getRateLimitStatus();
  //       setRateLimitInfo(data ?? null);
  //     } catch (error) {
  //       console.error("Failed to fetch rate limit info:", error);
  //     }
  //   } else {
  //     setRateLimitInfo(null);
  //   }
  // };

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.focus();
    }
  }, []);

  // Listen for storage changes to update API keys in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedKeys = localStorage.getItem("api_keys");
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
  });

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
      {/* {user &&
        model === "google/gemini-2.5-flash-preview-05-20" &&
        !apiKeys?.openrouter &&
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
                onClick={() => router.push("/settings/keys")}
              >
                Add Keys
              </Button>
            </CardContent>
          </Card>
        )} */}

      {showScrollToBottom && (
        <Button
          onClick={scrollToBottom}
          className="absolute -top-16 left-1/2 z-10 flex -translate-x-1/2 items-center rounded-full shadow-sm"
        >
          <ArrowDown className="size-5" />
          Scroll to bottom
        </Button>
      )}

      <form onSubmit={handleSubmit} className="relative">
        <div className="relative rounded-t-2xl border border-b-0">
          <Textarea
            ref={promptRef}
            value={prompt}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="placeholder:text-muted-foreground !bg-background max-h-[350px] min-h-[100px] w-full resize-none rounded-t-2xl border-0 p-4 shadow-none focus-visible:ring-0"
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
            {status === "submitted" || status === "streaming" ? (
              <Button
                type="button"
                size="icon"
                onClick={stop}
                className="bg-muted-foreground hover:bg-muted-foreground/80"
              >
                <Square className="size-6" />
              </Button>
            ) : (
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
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
