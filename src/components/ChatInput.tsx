import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ModelPicker } from "./ModelPicker";
import {
  ArrowUp,
  Sparkle,
  Sparkles,
  WandSparkles,
  type LucideIcon,
} from "lucide-react";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";

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
};

export const AVAILABLE_MODELS: Model[] = [
  {
    id: "gpt-4.1",
    name: "GPT 4.1",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
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
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    logo: <img src="/logos/Google.svg" alt="Google" className="h-4 w-4" />,
    provider: "openrouter",
    default: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    logo: <img src="/logos/Google.svg" alt="Google" className="h-4 w-4" />,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    reasoning: true,
  },
  {
    id: "gpt-imagegen",
    name: "GPT ImageGen",
    logo: <img src="/logos/OpenAI-dark.svg" alt="OpenAI" className="h-4 w-4" />,
    provider: "openai",
    images: true,
  },
];

interface ChatInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
}

export function ChatInput({ prompt, setPrompt }: ChatInputProps) {
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [model, setModel] = useState(() => {
    const savedModel = getLocalStorage("selectedModel");
    return (
      (savedModel && AVAILABLE_MODELS.find((m) => m.id === savedModel)?.id) ||
      AVAILABLE_MODELS.find((m) => m.default)?.id
    );
  });
  const [reasoningEffort, setReasoningEffort] = useState(() => {
    const savedReasoningEffort = getLocalStorage("reasoningEffort");
    return (
      (savedReasoningEffort &&
        REASONING_EFFORTS.find((r) => r.id === savedReasoningEffort)?.id) ||
      REASONING_EFFORTS[0].id
    );
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      // TODO: Handle message submission
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
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="bg-background border-border relative rounded-lg border">
          <Textarea
            ref={promptRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message here..."
            className="placeholder:text-muted-foreground max-h-[400px] min-h-[120px] w-full resize-none border-0 bg-transparent p-4 text-sm focus-visible:ring-0"
            rows={4}
          />

          <div className="flex items-center justify-between px-4 py-3">
            <ModelPicker
              selectedModel={model!}
              onModelChange={handleModelChange}
              reasoningEffort={reasoningEffort}
              onReasoningEffortChange={handleReasoningEffortChange}
            />
            <Button
              type="button"
              size="icon"
              onClick={handleSubmit}
              disabled={!prompt.trim()}
            >
              <ArrowUp className="size-6" />
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
