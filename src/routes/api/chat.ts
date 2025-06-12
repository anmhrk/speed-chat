import { createAPIFileRoute } from "@tanstack/react-start/api";
import { generateText, streamText } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/components/ChatInput";
import { env } from "@/env";
import { setResponseStatus } from "@tanstack/react-start/server";
import { authGuard } from "@/backend/auth/auth-guard";
// import { db } from "@/backend/db";
// import { chat } from "@/backend/db/schema/chat.schema";

export const APIRoute = createAPIFileRoute("/api/chat")({
  POST: async ({ request }) => {
    try {
      const body: ChatRequest = await request.json();
      const { messages, model, apiKeys, userId, chatId } = body;

      const isAuthenticated = await authGuard();
      if (!isAuthenticated) {
        setResponseStatus(401);
        throw new Error("Unauthorized");
      }

      let freeGeminiFlash = false;
      if (
        model === "google/gemini-2.5-flash-preview-05-20" &&
        !apiKeys?.openrouter
      ) {
        // TODO: check rate limit here and return error if exceeded
        freeGeminiFlash = true;
      }

      const aiModel = createAIProvider(model, freeGeminiFlash, apiKeys);

      const chatStream = streamText({
        model: aiModel,
        messages,
      });

      const titlePromise = generateText({
        model: openai("gpt-4.1-nano"), // TODO: experiment with gemini 2.5 flash later
        prompt: `Generate a title for the chat based on the first user message.
          User message: ${messages[0].content}
          `,
      });

      const title = await titlePromise;
      console.log("title", title.text);

      return chatStream.toDataStreamResponse();
    } catch (error) {
      console.log("[Chat API] Error:", error);
      throw error;
    }
  },
});

function createAIProvider(
  model: Models,
  freeGeminiFlash: boolean,
  apiKeys: Record<Providers, string>,
) {
  const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model);

  switch (modelConfig?.provider) {
    case "openai":
      const openaiProvider = createOpenAI({ apiKey: apiKeys.openai });
      return openaiProvider(modelConfig.id);
    case "anthropic":
      const anthropicProvider = createAnthropic({ apiKey: apiKeys.anthropic });
      return anthropicProvider(modelConfig.id);
    case "openrouter":
      const headers = import.meta.env.PROD
        ? {
            "HTTP-Referer": env.VITE_SITE_URL,
            "X-Title": "Speed Chat",
          }
        : undefined;

      const openrouterProvider = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: freeGeminiFlash ? env.OPENROUTER_API_KEY : apiKeys.openrouter,
        ...(headers && { headers }),
      });
      return openrouterProvider(modelConfig.id);

    default:
      throw new Error(`Unsupported provider: ${modelConfig?.provider}`);
  }
}
