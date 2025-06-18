import { NextRequest } from "next/server";
import {
  streamText,
  APICallError,
  InvalidPromptError,
  RetryError,
  createIdGenerator,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import type { Message } from "ai";
import { format } from "date-fns";
import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "../../../../convex/_generated/api";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const {
      messages,
      chatId,
      model,
      reasoningEffort,
      apiKeys,
      temporaryChat,
      customizationSettings,
    } = body;

    const token = await convexAuthNextjsToken();
    const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });

    if (!user) {
      return new Response("Unauthorized", { status: 401 });
    }

    const aiModel = createAIProvider(model, apiKeys);

    const modelName = AVAILABLE_MODELS.find((m) => m.id === model)?.name;

    const chatStream = streamText({
      model: aiModel,
      system: `
        You are Speed Chat, an AI assistant powered by the ${modelName} model. Your role is to assist and engage in conversation while being helpful, respectful, and engaging.
        - If you are specifically asked about the model you are using, you may mention that you use the ${modelName} model. If you are not asked specifically about the model you are using, you do not need to mention it.
        - The current date and time is ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}.

        - Always use LaTeX for mathematical expressions:
          - Inline math should be wrapped in single dollar signs: $content$
          - Display math should be wrapped in double dollar signs: $$content$$
          - Use proper LaTeX syntax within the delimiters.
          - DO NOT output LaTeX as a code block.
          
        - When generating code:
          - Ensure it is properly formatted using Prettier with a print width of 80 characters
          - Inline code should be wrapped in backticks: \`content\`
          - Block code should be wrapped in triple backticks: \`\`\`content\`\`\` with the language extension indicated

        ${
          customizationSettings
            ? `
            This is some extra settings set by the user:
            - Name of the user: ${customizationSettings.name}
            - Profession of the user: ${customizationSettings.whatYouDo}
            - Specifics on how to respond to the user: ${customizationSettings.howToRespond}
            - Some additional information about the user: ${customizationSettings.additionalInfo}
            `
            : ""
        }
        `,
      experimental_generateMessageId: createIdGenerator({
        prefix: "assistant",
        size: 16,
      }),
      messages,
      // providerOptions: {
      //   openai: {
      //     reasoningEffort,
      //   },
      //   anthropic: {
      //     thinking: { type: "enabled", budgetTokens: 1000 },
      //   },
      // },
      onFinish: async ({ response, usage }) => {
        try {
          if (temporaryChat) {
            return;
          }

          const responseMessages: Message[] = response.messages
            .filter((msg) => msg.role !== "tool")
            .map((msg) => ({
              id: msg.id,
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

          const allMessages = [...messages, ...responseMessages].map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: msg.createdAt
              ? msg.createdAt instanceof Date
                ? msg.createdAt.getTime()
                : typeof msg.createdAt === "number"
                  ? msg.createdAt
                  : Date.now()
              : Date.now(),
          }));

          await fetchMutation(
            api.chat.updateChatMessages,
            {
              chatId,
              messages: allMessages,
            },
            { token },
          );

          // Prompt tokens counts system prompt tokens too!!
          // Also mesages are always incremented by 1 onFinish, even if
          // edited message is sent which may or may not have wiped some user messages
          // TODO: Fix this

          // Calculate token approximations since OpenAI doesn't return usage
          // Rough approximation: 1 token ≈ 4 characters for English text
          // Probably move to js-tiktoken later?
          const approximatePromptTokens = Math.ceil(
            (JSON.stringify(messages).length +
              (modelName ? modelName.length * 10 : 100)) /
              4,
          );

          const completionContent = responseMessages
            .map((msg) => msg.content)
            .join(" ");
          const approximateCompletionTokens = Math.ceil(
            completionContent.length / 4,
          );

          // Use actual usage if available, otherwise use approximations
          const finalPromptTokens =
            !isNaN(usage.promptTokens) && usage.promptTokens > 0
              ? usage.promptTokens
              : approximatePromptTokens;

          const finalCompletionTokens =
            !isNaN(usage.completionTokens) && usage.completionTokens > 0
              ? usage.completionTokens
              : approximateCompletionTokens;

          await fetchMutation(
            api.chat.updateUsage,
            {
              promptTokens: finalPromptTokens,
              completionTokens: finalCompletionTokens,
            },
            { token },
          );
        } catch (error) {
          console.error("[Chat API] Database save failed:", error);
        }
      },
    });

    return chatStream.toDataStreamResponse({
      sendReasoning: true,
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
          const errorMessage = {
            id: `error-${crypto.randomUUID()}`,
            role: "assistant" as const,
            content: errorContent,
            createdAt: Date.now(),
          };

          const messagesWithError = [...messages, errorMessage].map((msg) => ({
            id: msg.id,
            role: msg.role as "user" | "assistant",
            content: msg.content,
            createdAt: msg.createdAt
              ? msg.createdAt instanceof Date
                ? msg.createdAt.getTime()
                : typeof msg.createdAt === "number"
                  ? msg.createdAt
                  : Date.now()
              : Date.now(),
          }));

          fetchMutation(
            api.chat.updateChatMessages,
            {
              chatId,
              messages: messagesWithError,
            },
            { token },
          );
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

function createAIProvider(model: Models, apiKeys: Record<Providers, string>) {
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
        apiKey: apiKeys.openrouter,
        ...(headers && { headers }),
      });
      return openrouter(modelConfig.id);

    default:
      throw new Error(`Unsupported provider: ${modelConfig?.provider}`);
  }
}
