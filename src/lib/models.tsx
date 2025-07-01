import { Sparkle, Sparkles, WandSparkles } from "lucide-react";
import { ModelConfig, ReasoningEffortConfig } from "./types";
import {
  Google,
  OpenAI,
  Anthropic,
  DeepSeek,
  Meta,
  Grok,
  FalAi,
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
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    icon: <OpenAI />,
    provider: "openrouter",
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    icon: <OpenAI />,
    provider: "openrouter",
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    icon: <OpenAI />,
    provider: "openrouter",
  },
  {
    id: "openai/o4-mini",
    name: "o4-mini",
    icon: <OpenAI />,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude 4 Sonnet",
    icon: <Anthropic />,
    provider: "openrouter",
  },
  {
    id: "anthropic/claude-sonnet-4-thinking",
    name: "Claude 4 Sonnet (Thinking)",
    icon: <Anthropic />,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude 4 Opus",
    icon: <Anthropic />,
    provider: "openrouter",
  },
  {
    id: "anthropic/claude-opus-4-thinking",
    name: "Claude 4 Opus (Thinking)",
    icon: <Anthropic />,
    provider: "openrouter",
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
  {
    id: "x-ai/grok-3",
    name: "Grok 3",
    icon: <Grok />,
    provider: "openrouter",
  },
  {
    id: "x-ai/grok-3-mini",
    name: "Grok 3 Mini",
    icon: <Grok />,
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "gpt-image-1",
    name: "GPT ImageGen",
    icon: <OpenAI />,
    provider: "openai",
    imageGeneration: true,
  },
  {
    id: "fal-ai/flux-pro/v1.1-ultra",
    name: "FLUX Pro v1.1 Ultra",
    icon: <FalAi />,
    provider: "falai",
    imageGeneration: true,
  },
  {
    id: "fal-ai/flux-pro/kontext/max",
    name: "FLUX Pro Kontext Max",
    icon: <FalAi />,
    provider: "falai",
    imageGeneration: true,
  },
  {
    id: "fal-ai/flux-pro/kontext/max/text-to-image",
    name: "FLUX Pro Kontext Max Text to Image",
    icon: <FalAi />,
    provider: "falai",
    imageGeneration: true,
  },
  {
    id: "imagen-4.0-generate-preview-06-06",
    name: "Imagen 4",
    icon: <Google />,
    provider: "vertex",
    imageGeneration: true,
  },
  {
    id: "imagen-4.0-fast-generate-preview-06-06",
    name: "Imagen 4 Fast",
    icon: <Google />,
    provider: "vertex",
    imageGeneration: true,
  },
  {
    id: "imagen-4.0-ultra-generate-preview-06-06",
    name: "Imagen 4 Ultra",
    icon: <Google />,
    provider: "vertex",
    imageGeneration: true,
  },
];
