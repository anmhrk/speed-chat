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
      <Image src="/logos/OpenAI-dark.svg" alt="OpenAI" width={16} height={16} />
    ),
    provider: "openai",
    attachments: true,
  },
  {
    id: "claude-sonnet-4",
    name: "Claude Sonnet 4",
    logo: (
      <Image
        src="/logos/Anthropic-dark.svg"
        alt="Anthropic"
        width={16}
        height={16}
      />
    ),
    provider: "anthropic",
    attachments: true,
    search: true,
  },
  {
    id: "claude-opus-4",
    name: "Claude Opus 4",
    logo: (
      <Image
        src="/logos/Anthropic-dark.svg"
        alt="Anthropic"
        width={16}
        height={16}
      />
    ),
    provider: "anthropic",
    attachments: true,
  },
  {
    id: "google/gemini-2.5-flash-preview-05-20",
    name: "Gemini 2.5 Flash",
    logo: <Image src="/logos/Google.svg" alt="Google" width={16} height={16} />,
    provider: "openrouter",
    default: true,
    attachments: true,
  },
  {
    id: "google/gemini-2.5-pro-preview",
    name: "Gemini 2.5 Pro",
    logo: <Image src="/logos/Google.svg" alt="Google" width={16} height={16} />,
    provider: "openrouter",
    reasoning: true,
    attachments: true,
  },
  {
    id: "o4-mini",
    name: "o4 Mini",
    logo: (
      <Image src="/logos/OpenAI-dark.svg" alt="OpenAI" width={16} height={16} />
    ),
    provider: "openai",
    attachments: true,
    reasoning: true,
  },
  {
    id: "o3",
    name: "o3",
    logo: (
      <Image src="/logos/OpenAI-dark.svg" alt="OpenAI" width={16} height={16} />
    ),
    provider: "openai",
    attachments: true,
    reasoning: true,
  },
];
