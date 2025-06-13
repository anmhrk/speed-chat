import type { Message } from "ai";
import type { LucideIcon } from "lucide-react";

export type Providers = "openai" | "anthropic" | "openrouter";
export type ReasoningEfforts = "low" | "medium" | "high";
export type Models =
  | "google/gemini-2.5-flash-preview-05-20"
  | "google/gemini-2.5-pro-preview"
  | "gpt-4.1"
  | "o3"
  | "o4-mini"
  | "gpt-image-1"
  | "claude-sonnet-4"
  | "claude-opus-4";

export type ReasoningEffortConfig = {
  id: ReasoningEfforts;
  icon: LucideIcon;
};

export type ModelConfig = {
  id: Models;
  name: string;
  logo: React.ReactNode;
  default?: boolean;
  provider: Providers;
  reasoning?: boolean;
  images?: boolean;
  attachments?: boolean;
  search?: boolean;
};

export type CustomizationSettings = {
  name: string;
  whatYouDo: string;
  howToRespond: string;
  additionalInfo: string;
};

export type ProviderConfig = {
  id: Providers;
  name: string;
  placeholder: string;
  url: string;
};

export type RateLimitInfo = {
  remaining: number;
  reset: number;
  limit: number;
};

export type ChatRequest = {
  chatId: string;
  messages: Message[];
  model: Models;
  reasoningEffort: ReasoningEfforts | null;
  apiKeys: Record<Providers, string>;
  userId: string;
  // temporaryChat: boolean;
};

export type Thread = {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatData = {
  id: string;
  title: string;
  messages: Message[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ThreadsResponse = {
  threads: Thread[];
};

export type ChatResponse = {
  chat: ChatData;
};
