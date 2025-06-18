"use client";

import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDown, ArrowUp, Square } from "lucide-react";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import type { Models, Providers, ReasoningEfforts } from "@/lib/types";
import { ModelPicker } from "@/components/ModelPicker";
import type { Doc } from "../../convex/_generated/dataModel";

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
  isCreatingInitialChat: boolean;
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
  isCreatingInitialChat,
}: ChatInputProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const savedModel = localStorage.getItem("selected_model");
    const savedReasoningEffort = localStorage.getItem("reasoning_effort");

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

    const hasApiKey = (provider: Providers) => {
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

    // Final fallback to default Gemini 2.5 Flash model
    // It won't work without an API key, just a fallback to show something in the select box
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
  }, [setModel, setReasoningEffort, setHasApiKeys, setApiKeys]);

  const handleModelChange = (newModel: Models) => {
    setModel(newModel);
    localStorage.setItem("selected_model", newModel);
  };

  const handleReasoningEffortChange = (
    newReasoningEffort: ReasoningEfforts,
  ) => {
    setReasoningEffort(newReasoningEffort);
    localStorage.setItem("reasoning_effort", newReasoningEffort);
  };

  useEffect(() => {
    if (promptRef.current) {
      promptRef.current.focus();
    }
  }, []);

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
            {status === "submitted" ||
            status === "streaming" ||
            isCreatingInitialChat ? (
              <Button
                type="button"
                size="icon"
                onClick={stop}
                disabled={isCreatingInitialChat}
                className="bg-muted-foreground hover:bg-muted-foreground/80"
              >
                <Square className="size-6" />
              </Button>
            ) : (
              <Button
                type="button"
                size="icon"
                onClick={handleSubmit}
                disabled={!user || !prompt.trim() || !hasApiKeys}
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
