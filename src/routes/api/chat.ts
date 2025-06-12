import { createAPIFileRoute } from "@tanstack/react-start/api";
import { generateText, streamText } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/components/ChatInput";
import { env } from "@/env";
import { authGuard } from "@/backend/auth/auth-guard";
import { setResponseStatus } from "@tanstack/react-start/server";
import { nanoid } from "nanoid";

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

      console.log("userId", userId);
      if (!chatId) {
        const newChatId = nanoid();
        console.log("newChatId", newChatId);
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
        maxTokens: 100,
      });

      const stream = new ReadableStream({
        async start(controller) {
          // Handle title async
          titlePromise
            .then((title) => {
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: "title",
                  content: title.text,
                })}\n\n`,
              );
            })
            .catch(console.error);

          // Stream chat tokens
          try {
            for await (const chunk of chatStream.textStream) {
              controller.enqueue(
                `data: ${JSON.stringify({
                  type: "text-delta",
                  content: chunk,
                })}\n\n`,
              );
            }
            controller.enqueue(`data: [DONE]\n\n`);
          } finally {
            controller.close();
          }
        },
      });

      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    } catch (error) {
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
