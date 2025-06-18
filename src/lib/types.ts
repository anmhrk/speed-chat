import type { Message } from "ai";
import { LucideIcon } from "lucide-react";

export type Models =
  | "google/gemini-2.5-flash-preview-05-20"
  | "google/gemini-2.5-pro-preview"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "o3"
  | "o4-mini"
  | "claude-4-sonnet-20250514"
  | "claude-4-opus-20250514";

export type ReasoningEfforts = "low" | "medium" | "high";

export type Providers = "openrouter" | "openai" | "anthropic";

export type ModelConfig = {
  id: Models;
  name: string;
  logo: React.ReactNode;
  provider: Providers;
  default?: boolean;
  reasoning?: boolean;
  attachments?: boolean;
  search?: boolean;
};

export type ReasoningEffortConfig = {
  id: ReasoningEfforts;
  icon: LucideIcon;
};

export type CustomizationSettings = {
  name: string;
  whatYouDo: string;
  howToRespond: string;
  additionalInfo: string;
};

export type ChatRequest = {
  chatId: string;
  messages: Message[];
  model: Models;
  reasoningEffort: ReasoningEfforts | null;
  apiKeys: Record<Providers, string>;
  temporaryChat: boolean;
  customizationSettings: CustomizationSettings | null;
};

export type ProviderConfig = {
  id: Providers;
  name: string;
  placeholder: string;
  url: string;
};
