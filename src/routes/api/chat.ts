import { createAPIFileRoute } from "@tanstack/react-start/api";
import { generateText, streamText, createDataStreamResponse } from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/components/ChatInput";
import { env } from "@/env";
import { setResponseStatus } from "@tanstack/react-start/server";
import { authGuard } from "@/backend/auth/auth-guard";
import { db } from "@/backend/db";
import { chat } from "@/backend/db/schema/chat.schema";
import { eq } from "drizzle-orm";
import type { Message } from "ai";

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

      const isNewChat = messages.length === 1 && messages[0].role === "user";

      // Start title generation in parallel for new chats
      let titlePromise: Promise<{ text: string }> | null = null;
      if (isNewChat) {
        titlePromise = generateText({
          model: openai("gpt-4.1-nano"),
          prompt: `Generate a concise title (max 6 words) for this chat based on the user's message.
            User message: ${messages[0].content}
            
            Return only the title, no quotes or extra text.`,
        });
      }

      return createDataStreamResponse({
        execute: async (dataStream) => {
          const chatStream = streamText({
            model: aiModel,
            messages,
            onError: async ({ error }) => {
              console.error("[Chat API] Error:", error);

              try {
                const errorMessage: Message = {
                  id: `error-${Date.now()}`,
                  role: "assistant",
                  content: `Error: ${error instanceof Error ? error.message : String(error)}`,
                  createdAt: new Date(),
                };

                const messagesWithError: Message[] = [
                  ...messages,
                  errorMessage,
                ];

                if (isNewChat) {
                  const chatTitle = "New Chat";

                  await db.insert(chat).values({
                    id: chatId,
                    title: chatTitle,
                    messages: messagesWithError,
                    userId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                } else {
                  const existingChat = await db
                    .select()
                    .from(chat)
                    .where(eq(chat.id, chatId))
                    .limit(1);

                  if (existingChat.length > 0) {
                    await db
                      .update(chat)
                      .set({
                        messages: messagesWithError,
                        updatedAt: new Date(),
                      })
                      .where(eq(chat.id, chatId));
                  } else {
                    // TODO: improve this
                    throw new Error("Chat not found");
                  }
                }
              } catch (dbError) {
                console.error(
                  "[Chat API] Failed to save error message to database:",
                  dbError,
                );
              }
            },
            onFinish: async ({ response }) => {
              try {
                // Convert response messages to the format expected by our database
                const responseMessages: Message[] = response.messages
                  .filter((msg) => msg.role !== "tool") // Filter out tool messages
                  .map((msg) => ({
                    id: msg.id,
                    role: msg.role as "assistant", // Cast to assistant since we filtered out tool
                    content:
                      typeof msg.content === "string"
                        ? msg.content
                        : Array.isArray(msg.content)
                          ? msg.content
                              .map((part) =>
                                part.type === "text"
                                  ? part.text
                                  : part.type === "tool-call"
                                    ? `Tool call: ${part.toolName}`
                                    : "Non-text content",
                              )
                              .join(" ")
                          : String(msg.content),
                  }));

                const allMessages: Message[] = [
                  ...messages,
                  ...responseMessages,
                ];

                // Get the title if this is a new chat
                let chatTitle = "New Chat"; // Default title
                if (titlePromise) {
                  try {
                    const titleResult = await titlePromise;
                    chatTitle = titleResult.text.trim();

                    // Send the title to the client
                    dataStream.writeData({
                      type: "title",
                      chatId: chatId,
                      title: chatTitle,
                    });
                  } catch (error) {
                    console.error("[Chat API] Title generation failed:", error);
                    // Keep default title if generation fails
                  }
                }

                const existingChat = await db
                  .select()
                  .from(chat)
                  .where(eq(chat.id, chatId))
                  .limit(1);

                if (existingChat.length > 0) {
                  await db
                    .update(chat)
                    .set({
                      messages: allMessages,
                      updatedAt: new Date(),
                    })
                    .where(eq(chat.id, chatId));
                } else {
                  await db.insert(chat).values({
                    id: chatId,
                    title: chatTitle,
                    messages: allMessages,
                    userId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                }
              } catch (error) {
                console.error("[Chat API] Database save failed:", error);
                // Don't throw here to avoid breaking the stream response
              }
            },
          });

          chatStream.mergeIntoDataStream(dataStream);
        },
      });
    } catch (error) {
      console.log("[Chat API] Error:", error);
      setResponseStatus(500);
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
