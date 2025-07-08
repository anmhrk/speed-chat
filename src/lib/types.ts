import type { Message, ToolInvocation } from "ai";
import type { LucideIcon } from "lucide-react";

type BasicModels =
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-flash-lite-preview-06-17"
  | "openai/gpt-4.1"
  | "openai/gpt-4.1-mini"
  | "openai/gpt-4.1-nano"
  | "anthropic/claude-sonnet-4"
  | "anthropic/claude-opus-4"
  | "deepseek/deepseek-chat-v3-0324"
  | "meta-llama/llama-4-maverick"
  | "meta-llama/llama-4-scout"
  | "x-ai/grok-3";

type ReasoningModels =
  | "google/gemini-2.5-pro"
  | "anthropic/claude-sonnet-4-thinking" // not valid id, just placeholder to identify thinking version
  | "anthropic/claude-opus-4-thinking" // same as above
  | "openai/o4-mini"
  | "o3" // using openai provider for o3 because of additional integration requirement in openrouter, just verify org and it works. same with gpt image 1
  | "deepseek/deepseek-r1-0528"
  | "x-ai/grok-3-mini";

type ImageModels = "gpt-image-1" | "fal-ai/flux-pro/v1.1-ultra";

export type Models = BasicModels | ReasoningModels | ImageModels;

export type Providers = "openrouter" | "openai" | "falai";

export type ReasoningEfforts = "low" | "medium" | "high";

export type APIKeys = Record<Providers | "exa", string>;

export type ModelConfig = {
  id: Models;
  name: string;
  icon: React.ReactNode;
  providerId: Providers;
  providerName: string;
  default?: boolean;
  reasoning?: boolean;
  imageInput?: boolean;
  pdfInput?: boolean;
  search?: boolean;
  imageGeneration?: boolean;
};

export type ReasoningEffortConfig = {
  id: ReasoningEfforts;
  icon: LucideIcon;
};

export type ProviderConfig = {
  id: Providers | "exa";
  name: string;
  placeholder: string;
  url: string;
};

export type Customization = {
  name: string;
  whatYouDo: string;
  traits: string[];
  additionalInfo: string;
};

export type ChatRequest = {
  messages: Message[];
  chatId: string;
  model: Models;
  reasoningEffort: ReasoningEfforts;
  apiKeys: APIKeys;
  temporaryChat: boolean;
  customization: Customization;
  searchEnabled: boolean;
};

export type TitleRequest = {
  chatId: string;
  prompt: string;
  apiKeys: APIKeys;
};

export type FileMetadata = {
  type: "image" | "pdf";
  name: string;
  url: string;
  extension: string;
};

export type MessageAnnotation = {
  metadata: {
    modelName: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    tps: number;
    ttft: number;
    elapsedTime: number;
  };
};

export type StreamData<T> = {
  type: string;
  payload: T;
};

export type WebSearchResult = {
  url: string;
  title: string;
  content: string;
  rank: number;
  publishedDate?: string;
};

export type WebSearchToolInvocation = ToolInvocation & {
  toolName: "webSearch";
  result?: {
    query: string;
    results: WebSearchResult[];
    totalResults: number;
  };
};

export type ImageGenerationToolInvocation = ToolInvocation & {
  toolName: "imageGeneration";
  result?: {
    imageUrl: string;
  };
};

export type MemoryToolInvocation = ToolInvocation & {
  toolName: "memory";
  result?: {
    memory: string;
  };
};
