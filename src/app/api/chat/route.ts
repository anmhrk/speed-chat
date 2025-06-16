import { NextRequest } from "next/server";
import { streamText, APICallError, InvalidPromptError, RetryError } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { Message } from "ai";
import { format } from "date-fns";
import { getUser } from "@/lib/auth/get-user";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, model, apiKeys, chatId, temporaryChat } = body;

    const user = await getUser();
    if (!user) {
      throw new Error("Unauthorized");
    }

    let freeGeminiFlash = false;
    if (
      model === "google/gemini-2.5-flash-preview-05-20" &&
      !apiKeys.openrouter
    ) {
      // TODO: check rate limit here and return error if exceeded
      freeGeminiFlash = true;
    }

    const aiModel = createAIProvider(model, apiKeys, freeGeminiFlash);

    const modelName = AVAILABLE_MODELS.find((m) => m.id === model)?.name;

    let requestMessages: Message[] = [];

    const existingChat = await db
      .select()
      .from(chat)
      .where(eq(chat.id, chatId))
      .limit(1);

    const latestUserMessage = messages[messages.length - 1];
    const latestUserMessageWithId = {
      ...latestUserMessage,
      id: `user-${crypto.randomUUID()}`,
      createdAt: new Date(),
    };

    if (existingChat.length === 0) {
      requestMessages = [latestUserMessageWithId];
    } else {
      // Db messages will already have ids
      requestMessages = existingChat[0].messages;

      // Add the latest user message to the request messages
      requestMessages.push(latestUserMessageWithId);
    }

    const chatStream = streamText({
      model: aiModel,
      system: `
        You are Speed Chat, an AI assistant powered by the ${modelName} model. Your role is to assist and engage in conversation while being helpful, respectful, and engaging.
        - If you are specifically asked about the model you are using, you may mention that you use the ${modelName} model. If you are not asked specifically about the model you are using, you do not need to mention it.
        - The current date and time is ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}.
        `,
      messages: requestMessages,
      onFinish: async ({ response }) => {
        try {
          if (temporaryChat) {
            return;
          }

          const responseMessages: Message[] = response.messages
            .filter((msg) => msg.role !== "tool") // Filter out tool messages
            .map((msg) => ({
              id: `assistant-${crypto.randomUUID()}`,
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

          await db
            .update(chat)
            .set({
              messages: allMessages,
              updatedAt: new Date(),
            })
            .where(eq(chat.id, chatId));
        } catch (error) {
          console.error("[Chat API] Database save failed:", error);
        }
      },
    });

    return chatStream.toDataStreamResponse({
      getErrorMessage: (error) => {
        console.error("[Chat API] Error:", error);

        let errorContent = "";
        if (
          APICallError.isInstance(error) ||
          InvalidPromptError.isInstance(error)
        ) {
          errorContent = `Error: ${error.message}`;
        } else if (RetryError.isInstance(error)) {
          // Extract the actual error message from the lastError property
          if (error.lastError && APICallError.isInstance(error.lastError)) {
            errorContent = `Error: ${error.lastError.message}`;
          } else {
            // Fallback to parsing the message string
            const lastErrorMatch = error.message.match(/Last error: (.+)$/);
            errorContent = lastErrorMatch
              ? `Error: ${lastErrorMatch[1].trim()}`
              : `Error: ${error.message}`;
          }
        } else {
          errorContent = "An unknown error occurred. Please try again.";
        }

        try {
          const errorMessage: Message = {
            id: `error-${crypto.randomUUID()}`,
            role: "assistant",
            content: errorContent,
            createdAt: new Date(),
          };

          const messagesWithError: Message[] = [
            ...requestMessages,
            errorMessage,
          ];

          db.update(chat)
            .set({
              messages: messagesWithError,
              updatedAt: new Date(),
            })
            .where(eq(chat.id, chatId));
        } catch (dbError) {
          console.error(
            "[Chat API] Failed to save error message to database:",
            dbError,
          );
        }

        return errorContent;
      },
    });
  } catch (error) {
    console.log("[Chat API] Error:", error);
    throw error;
  }
}

function createAIProvider(
  model: Models,
  apiKeys: Record<Providers, string>,
  freeGeminiFlash: boolean,
) {
  const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model);

  switch (modelConfig?.provider) {
    case "openai":
      const openai = createOpenAI({ apiKey: apiKeys.openai });
      return openai(modelConfig.id);
    case "anthropic":
      const anthropic = createAnthropic({ apiKey: apiKeys.anthropic });
      return anthropic(modelConfig.id);
    case "openrouter":
      const headers =
        process.env.NODE_ENV === "production" &&
        process.env.NEXT_PUBLIC_SITE_URL
          ? {
              "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL,
              "X-Title": "Speed Chat",
            }
          : undefined;

      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
        apiKey: freeGeminiFlash
          ? process.env.OPENROUTER_API_KEY
          : apiKeys.openrouter,
        ...(headers && { headers }),
      });
      return openrouter(modelConfig.id);

    default:
      throw new Error(`Unsupported provider: ${modelConfig?.provider}`);
  }
}
