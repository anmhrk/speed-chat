import { Sparkle, Sparkles, WandSparkles } from "lucide-react";
import { ModelConfig, ReasoningEffortConfig, Models } from "../types";
import {
  OpenAI,
  Anthropic,
  DeepSeek,
  Meta,
  Grok,
  FalAi,
  Gemini,
  Qwen,
  Moonshot,
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
    icon: <Gemini />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    default: true,
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "google/gemini-2.5-flash-lite-preview-06-17",
    name: "Gemini 2.5 Flash Lite",
    icon: <Gemini />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "google/gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    icon: <Gemini />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: false, supportsEffort: true },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "openai/gpt-4.1",
    name: "GPT-4.1",
    icon: <OpenAI />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "openai/gpt-4.1-mini",
    name: "GPT-4.1 Mini",
    icon: <OpenAI />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "openai/gpt-4.1-nano",
    name: "GPT-4.1 Nano",
    icon: <OpenAI />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "openai/o4-mini",
    name: "o4-mini",
    icon: <OpenAI />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: false, supportsEffort: true },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "o3",
    name: "o3",
    icon: <OpenAI />,
    providerId: "openai",
    providerName: "OpenAI",
    features: {
      reasoning: { available: true, toggleable: false, supportsEffort: true },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "anthropic/claude-sonnet-4",
    name: "Claude 4 Sonnet",
    icon: <Anthropic />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: true, supportsEffort: true },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "anthropic/claude-opus-4",
    name: "Claude 4 Opus",
    icon: <Anthropic />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: true, supportsEffort: true },
      input: { images: true, pdfs: true },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "deepseek/deepseek-chat-v3-0324",
    name: "DeepSeek v3 0324",
    icon: <DeepSeek />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "deepseek/deepseek-r1-0528",
    name: "DeepSeek R1 0528",
    icon: <DeepSeek />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: false, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "meta-llama/llama-4-maverick",
    name: "Llama 4 Maverick",
    icon: <Meta />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "meta-llama/llama-4-scout",
    name: "Llama 4 Scout",
    icon: <Meta />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "x-ai/grok-3",
    name: "Grok 3",
    icon: <Grok />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "x-ai/grok-3-mini",
    name: "Grok 3 Mini",
    icon: <Grok />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: false, supportsEffort: true },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "x-ai/grok-4",
    name: "Grok 4",
    icon: <Grok />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: false, supportsEffort: false },
      input: { images: true, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "qwen/qwen3-235b-a22b",
    name: "Qwen 3 235B",
    icon: <Qwen />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: true, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "qwen/qwen3-32b",
    name: "Qwen 3 32B",
    icon: <Qwen />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: true, toggleable: true, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
  {
    id: "gpt-image-1",
    name: "GPT ImageGen",
    icon: <OpenAI />,
    providerId: "openai",
    providerName: "OpenAI",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: false,
      imageGeneration: true,
    },
  },
  {
    id: "fal-ai/flux-pro/v1.1-ultra",
    name: "FLUX Pro v1.1 Ultra",
    icon: <FalAi />,
    providerId: "falai",
    providerName: "FalAI",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: false,
      imageGeneration: true,
    },
  },
  {
    id: "moonshotai/kimi-k2",
    name: "Kimi K2",
    icon: <Moonshot />,
    providerId: "openrouter",
    providerName: "OpenRouter",
    features: {
      reasoning: { available: false, toggleable: false, supportsEffort: false },
      input: { images: false, pdfs: false },
      webSearch: true,
      imageGeneration: false,
    },
  },
];

// Utility functions for model capabilities
export const getModelById = (modelId: Models) =>
  AVAILABLE_MODELS.find((m) => m.id === modelId);

export const hasReasoningCapability = (modelId: Models) =>
  getModelById(modelId)?.features.reasoning.available ?? false;

export const hasEffortControl = (modelId: Models) =>
  getModelById(modelId)?.features.reasoning.supportsEffort ?? false;

export const hasToggleableReasoning = (modelId: Models) =>
  getModelById(modelId)?.features.reasoning.toggleable ?? false;

export const supportsImageInput = (modelId: Models) =>
  getModelById(modelId)?.features.input.images ?? false;

export const supportsPdfInput = (modelId: Models) =>
  getModelById(modelId)?.features.input.pdfs ?? false;

export const supportsWebSearch = (modelId: Models) =>
  getModelById(modelId)?.features.webSearch ?? false;

export const isImageGenerationModel = (modelId: Models) =>
  getModelById(modelId)?.features.imageGeneration ?? false;

export const shouldShowReasoningPill = (
  modelId: Models,
  reasoningEnabled: boolean
) => {
  const model = getModelById(modelId);
  if (!model?.features.reasoning.available) return false;
  if (!model.features.reasoning.supportsEffort) return false;
  if (model.features.reasoning.toggleable && !reasoningEnabled) return false;
  return true;
};

export const shouldShowReasoningControls = (modelId: Models) => {
  const model = getModelById(modelId);
  return (
    model?.features.reasoning.available &&
    (model.features.reasoning.supportsEffort ||
      model.features.reasoning.toggleable)
  );
};

export const isReasoningModel = (
  modelId: Models,
  reasoningEnabled: boolean
) => {
  const model = getModelById(modelId);
  if (!model?.features.reasoning.available) return false;

  // For toggleable models, check if reasoning is enabled
  if (model.features.reasoning.toggleable) {
    return reasoningEnabled;
  }

  // For non-toggleable models, reasoning is always active
  return true;
};
