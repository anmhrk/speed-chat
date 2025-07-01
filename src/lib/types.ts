import type { Message } from "ai";
import type { LucideIcon } from "lucide-react";

export type BasicModels =
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite-preview-06-17"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "claude-4-sonnet-20250514"
  | "claude-4-opus-20250514"
  | "deepseek/deepseek-chat-v3-0324"
  | "meta-llama/llama-4-maverick"
  | "meta-llama/llama-4-scout";

export type ReasoningModels =
  | "google/gemini-2.5-pro"
  | "claude-4-sonnet-20250514-thinking"
  | "claude-4-opus-20250514-thinking"
  | "o4-mini"
  | "o3"
  | "deepseek/deepseek-r1-0528";

export type ImageModels = "gpt-image-1";

export type Models = BasicModels | ReasoningModels | ImageModels;

export type Providers = "openrouter" | "openai" | "anthropic";

export type ReasoningEfforts = "low" | "medium" | "high";

export type ModelConfig = {
  id: Models;
  name: string;
  icon: React.ReactNode;
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

export type ChatRequest = {
  messages: Message[];
  chatId: string;
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: Record<Providers, string>;
  temporaryChat: boolean;
  customPrompt: string;
};

export type TitleRequest = {
  chatId: string;
  prompt: string;
  apiKeys: Record<Providers, string>;
};

export type FileMetadata = {
  name: string;
  url: string;
  extension: string;
};
