import { Sparkle, Sparkles, WandSparkles } from "lucide-react";
import { ModelConfig, ReasoningEffortConfig } from "./types";
import {
  Google,
  OpenAI,
  Anthropic,
  DeepSeek,
  Meta,
} from "@/components/provider-icons";

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
    id: "google/gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    icon: <Google />,
    provider: "openrouter",
    default: true,
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    icon: <Google />,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    icon: <OpenAI />,
    provider: "openai",
  },
  {
    id: "gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    icon: <OpenAI />,
    provider: "openai",
  },
  {
    id: "gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    icon: <OpenAI />,
    provider: "openai",
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    icon: <OpenAI />,
    provider: "openai",
    reasoning: true,
  },
  {
    id: "o3",
    name: "o3",
    icon: <OpenAI />,
    provider: "openai",
    reasoning: true,
  },
  {
    id: "claude-4-sonnet-20250514",
    name: "Claude 4 Sonnet",
    icon: <Anthropic />,
    provider: "anthropic",
  },
  {
    id: "claude-4-sonnet-20250514-thinking",
    name: "Claude 4 Sonnet (Thinking)",
    icon: <Anthropic />,
    provider: "anthropic",
    reasoning: true,
  },
  {
    id: "claude-4-opus-20250514",
    name: "Claude 4 Opus",
    icon: <Anthropic />,
    provider: "anthropic",
  },
  {
    id: "claude-4-opus-20250514-thinking",
    name: "Claude 4 Opus (Thinking)",
    icon: <Anthropic />,
    provider: "anthropic",
    reasoning: true,
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek v3 0324",
    icon: <DeepSeek />,
    provider: "openrouter",
  },
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek R1 0528",
    icon: <DeepSeek />,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    icon: <Meta />,
    provider: "openrouter",
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    icon: <Meta />,
    provider: "openrouter",
  },
];
