import type { ModelConfig, ReasoningEffortConfig } from "@/lib/types";
import Image from "next/image";
import { Sparkle, Sparkles, WandSparkles } from "lucide-react";

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
    id: "gpt-4.1",
    name: "GPT 4.1",
    logo: (
      <Image
        src="/OpenAI.svg"
        alt="OpenAI"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "openai",
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    logo: (
      <Image
        src="/OpenAI.svg"
        alt="OpenAI"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "openai",
    reasoning: true,
  },
  {
    id: "o3",
    name: "o3",
    logo: (
      <Image
        src="/OpenAI.svg"
        alt="OpenAI"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "openai",
    reasoning: true,
  },
  {
    id: "claude-4-sonnet-20250514",
    name: "Claude Sonnet 4",
    logo: (
      <Image
        src="/Anthropic.svg"
        alt="Anthropic"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "anthropic",
  },
  {
    id: "claude-4-opus-20250514",
    name: "Claude Opus 4",
    logo: (
      <Image
        src="/Anthropic.svg"
        alt="Anthropic"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "anthropic",
  },
  {
    id: "claude-4-sonnet-20250514-thinking",
    name: "Claude Sonnet 4 (Thinking)",
    logo: (
      <Image
        src="/Anthropic.svg"
        alt="Anthropic"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "anthropic",
    reasoning: true,
  },
  {
    id: "claude-4-opus-20250514-thinking",
    name: "Claude Opus 4 (Thinking)",
    logo: (
      <Image
        src="/Anthropic.svg"
        alt="Anthropic"
        width={16}
        height={16}
        className="dark:invert"
        unoptimized
      />
    ),
    provider: "anthropic",
    reasoning: true,
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    logo: (
      <Image
        src="/Google.svg"
        alt="Google"
        width={16}
        height={16}
        unoptimized
      />
    ),
    provider: "openrouter",
    default: true,
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    logo: (
      <Image
        src="/Google.svg"
        alt="Google"
        width={16}
        height={16}
        unoptimized
      />
    ),
    provider: "openrouter",
    reasoning: true,
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    logo: (
      <Image src="/Meta.svg" alt="Meta" width={16} height={16} unoptimized />
    ),
    provider: "openrouter",
  },
];
