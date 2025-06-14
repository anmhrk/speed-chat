import { createAPIFileRoute } from "@tanstack/react-start/api";
import {
  generateText,
  streamText,
  createDataStreamResponse,
  APICallError,
  InvalidPromptError,
  RetryError,
} from "ai";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/components/ChatInput";
import { env } from "@/env";
import { setResponseStatus } from "@tanstack/react-start/server";
import { authGuard } from "@/lib/auth/auth-guard";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema/chat.schema";
import { eq } from "drizzle-orm";
import type { Message } from "ai";
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

      let freeGeminiFlash = false;
      if (
        model === "google/gemini-2.5-flash-preview-05-20" &&
        !apiKeys?.openrouter
      ) {
        // TODO: check rate limit here and return error if exceeded
        freeGeminiFlash = true;
      }

      const aiModel = createAIProvider(model, freeGeminiFlash, apiKeys);

      let isNewChat = false;
      let requestMessages: Message[] = []; // Using this to ensure all messages have ids. Cannot trust client

      const existingChat = await db
        .select()
        .from(chat)
        .where(eq(chat.id, chatId))
        .limit(1);

      const latestUserMessage = messages[messages.length - 1];
      const latestUserMessageWithId = {
        ...latestUserMessage,
        id: `user-${nanoid()}`,
        createdAt: new Date(),
      };

      if (existingChat.length === 0) {
        isNewChat = true;
        requestMessages = [latestUserMessageWithId];
      } else {
        // Db messages will already have ids
        requestMessages = existingChat[0].messages;

        // Add the latest user message to the request messages
        requestMessages.push(latestUserMessageWithId);
      }

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
            messages: requestMessages,
            onError: async ({ error }) => {
              console.error("[Chat API] Error:", error);

              let errorContent = "";
              if (
                APICallError.isInstance(error) ||
                InvalidPromptError.isInstance(error)
              ) {
                errorContent = `Error: ${error.message}`;
              } else if (RetryError.isInstance(error)) {
                // Extract the actual error message from the lastError property
                if (
                  error.lastError &&
                  APICallError.isInstance(error.lastError)
                ) {
                  errorContent = `Error: ${error.lastError.message}`;
                } else {
                  // Fallback to parsing the message string
                  const lastErrorMatch =
                    error.message.match(/Last error: (.+)$/);
                  errorContent = lastErrorMatch
                    ? `Error: ${lastErrorMatch[1].trim()}`
                    : `Error: ${error.message}`;
                }
              } else {
                errorContent = "An unknown error occurred. Please try again.";
              }

              try {
                const errorMessage: Message = {
                  id: `error-${nanoid()}`,
                  role: "assistant",
                  content: errorContent,
                  createdAt: new Date(),
                };

                // Send complete error message object to client via data stream
                dataStream.writeData({
                  type: "error",
                  error: {
                    id: errorMessage.id,
                    role: errorMessage.role,
                    content: errorMessage.content,
                  },
                });

                const messagesWithError: Message[] = [
                  ...requestMessages,
                  errorMessage,
                ];

                if (isNewChat) {
                  // Keep default title for new chats erroring on first message (change later?)
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
                  await db
                    .update(chat)
                    .set({
                      messages: messagesWithError,
                      updatedAt: new Date(),
                    })
                    .where(eq(chat.id, chatId));
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
                const responseMessages: Message[] = response.messages
                  .filter((msg) => msg.role !== "tool") // Filter out tool messages
                  .map((msg) => ({
                    id: `assistant-${nanoid()}`,
                    role: msg.role as "assistant",
                    createdAt: new Date(),
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
                  ...requestMessages,
                  ...responseMessages,
                ];

                // Get the title if this is a new chat
                let chatTitle = "New Chat";
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

                if (isNewChat) {
                  await db.insert(chat).values({
                    id: chatId,
                    title: chatTitle,
                    messages: allMessages,
                    userId: userId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  });
                } else {
                  await db
                    .update(chat)
                    .set({
                      messages: allMessages,
                      updatedAt: new Date(),
                    })
                    .where(eq(chat.id, chatId));
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
