"use server";

import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { promptEnhancementSystemPrompt } from "../ai/prompts";
import { env } from "../env";
import removeMarkdown from "remove-markdown";

export async function enhancePrompt(
  prompt: string,
  apiKey: string,
  isImageGenerationModel: boolean
) {
  const openrouter = createOpenRouter({
    apiKey: apiKey ?? env.OPENROUTER_API_KEY,
  });

  const response = await generateText({
    model: openrouter("google/gemini-2.5-flash"),
    system: promptEnhancementSystemPrompt(isImageGenerationModel),
    prompt,
  });

  return removeMarkdown(response.text);
}
