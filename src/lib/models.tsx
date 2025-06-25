import { Sparkle, Sparkles, WandSparkles } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { SiOpenai, SiAnthropic } from "react-icons/si";
import { ModelConfig, ReasoningEffortConfig } from "./types";

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
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    icon: FcGoogle,
    provider: "openrouter",
    default: true,
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    icon: FcGoogle,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    icon: SiOpenai,
    provider: "openai",
  },
  {
    id: "o4-mini",
    name: "o4-mini",
    icon: SiOpenai,
    provider: "openai",
    reasoning: true,
  },
  {
    id: "claude-4-sonnet-20250514",
    name: "Claude 4 Sonnet",
    icon: SiAnthropic,
    provider: "anthropic",
  },
  {
    id: "claude-4-sonnet-20250514-thinking",
    name: "Claude 4 Sonnet (Thinking)",
    icon: SiAnthropic,
    provider: "anthropic",
    reasoning: true,
  },
  {
    id: "claude-4-opus-20250514",
    name: "Claude 4 Opus",
    icon: SiAnthropic,
    provider: "anthropic",
  },
];
