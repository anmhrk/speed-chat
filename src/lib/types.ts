import { InferToolOutput, UIMessage } from "ai";
import { searchWebTool } from "@/app/api/chat/route";

export type ReasoningEffort = "low" | "medium" | "high";

export type Provider = "aiGateway" | "openai";

export type ModelId =
  | "anthropic/claude-sonnet-4"
  | "anthropic/claude-opus-4.1"
  | "openai/gpt-5"
  | "openai/gpt-5-mini"
  | "google/gemini-2.5-flash"
  | "google/gemini-2.5-pro";

export type ChatModel = {
  default: boolean;
  name: string;
  id: ModelId;
  reasoning: "none" | "always" | "hybrid";
};

export type ChatRequest = {
  messages: UIMessage[];
  chatId: string;
  modelId: ModelId;
  reasoningEffort: ReasoningEffort;
  shouldUseReasoning: boolean;
  shouldSearchWeb: boolean;
  isNewChat: boolean;
};

export type MessageMetadata = {
  modelName: string;
  tps: number; // tokens per second
  ttft: number; // time to first token
  elapsedTime: number;
  completionTokens: number;
  reasoningDuration: number | undefined;
};

export type MyUIMessage = UIMessage<MessageMetadata>;

export type searchWebToolOutput = InferToolOutput<typeof searchWebTool>;
