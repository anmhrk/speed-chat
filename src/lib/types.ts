import type { Message } from "ai";
import type { LucideIcon } from "lucide-react";
import type { IconType } from "react-icons";

export type Models =
  | "google/gemini-2.5-flash-preview-05-20"
  | "google/gemini-2.5-pro-preview"
  | "gpt-4.1"
  | "o4-mini"
  | "claude-4-sonnet-20250514"
  | "claude-4-opus-20250514"
  | "claude-4-sonnet-20250514-thinking";

export type Providers = "openrouter" | "openai" | "anthropic";

export type ReasoningEfforts = "low" | "medium" | "high";

export type ModelConfig = {
  id: Models;
  name: string;
  icon: IconType;
  provider: Providers;
  default?: boolean;
  reasoning?: boolean;
};

export type ReasoningEffortConfig = {
  id: ReasoningEfforts;
  icon: LucideIcon;
};

export type ProviderConfig = {
  id: Providers;
  name: string;
  placeholder: string;
  url: string;
};

export type CustomInstructions = {
  name: string;
  whatYouDo: string;
  howToRespond: string;
  additionalInfo: string;
};

export type ChatRequest = {
  messages: Message[];
  chatId: string;
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: Record<Providers, string>;
  temporaryChat: boolean;
  customInstructions: CustomInstructions;
};
