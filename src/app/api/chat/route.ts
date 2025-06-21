import { NextRequest } from "next/server";
import {
  streamText,
  APICallError,
  InvalidPromptError,
  RetryError,
  createIdGenerator,
  smoothStream,
  appendResponseMessages,
  type Message,
} from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import {
  createAnthropic,
  type AnthropicProviderOptions,
} from "@ai-sdk/anthropic";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { ChatRequest, Models, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import { format } from "date-fns";
import { getUser } from "@/lib/auth/get-user";
import { updateChatMessages, updateUsage } from "@/lib/actions";

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

    const user = await getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    let modelId = model;
    if (model.includes("thinking")) {
      modelId = model.replace("-thinking", "") as Models;
    }

    const aiModel = createAIProvider(modelId, apiKeys);

    const modelName = AVAILABLE_MODELS.find((m) => m.id === model)?.name;

    const isReasoningModel =
      AVAILABLE_MODELS.find((m) => m.id === model)?.reasoning === true;

    const calculateThinkingBudget = () => {
      if (reasoningEffort === "low") return 15000 / 4;
      if (reasoningEffort === "medium") return 15000 / 2;
      if (reasoningEffort === "high") return 15000;
      return 15000 / 4;
    };

    const chatStream = streamText({
      model: aiModel,
      system: `
        You are Speed Chat, an AI assistant powered by the ${modelName} model. Your role is to assist and engage in conversation while being helpful, respectful, and engaging.
        If you are specifically asked about the model you are using, you may mention that you use the ${modelName} model. If you are not asked specifically about the model you are using, you do not need to mention it.
        The current date and time is ${format(new Date(), "yyyy-MM-dd HH:mm:ss")}.

        *Instructions for when generating mathematical expressions:*
        - Always use LaTeX
        - Inline math should be wrapped in single dollar signs: $content$
        - Display math should be wrapped in double dollar signs: $$content$$
        - Use proper LaTeX syntax within the delimiters.
        - DO NOT output LaTeX as a code block.
          
        *Instructions for when generating code:*
        - Ensure it is properly formatted using Prettier with a print width of 80 characters
        - Inline code should be wrapped in backticks: \`content\`
        - Block code should be wrapped in triple backticks: \`\`\`content\`\`\` with the language extension indicated

        ${
          customizationSettings &&
          `
            This is some extra customization settings set by the user:
            ${customizationSettings.name && `- Name of the user: ${customizationSettings.name}`}
            ${customizationSettings.whatYouDo && `- Profession of the user: ${customizationSettings.whatYouDo}`}
            ${customizationSettings.howToRespond && `- Specifics on how to respond to the user: ${customizationSettings.howToRespond}`}
            ${customizationSettings.additionalInfo && `- Some additional information about the user: ${customizationSettings.additionalInfo}`}
            `
        }
        `,
      experimental_transform: [
        smoothStream({
          chunking: "word",
        }),
      ],
      messages,
      ...(isReasoningModel && {
        providerOptions: {
          openai: {
            reasoningEffort: reasoningEffort || "low",
          },
          openrouter: {
            reasoning: {
              max_tokens: calculateThinkingBudget(),
            },
          },
          anthropic: {
            thinking: {
              type: "enabled",
              budgetTokens: calculateThinkingBudget(),
            },
          } satisfies AnthropicProviderOptions,
        },
      }),
      onFinish: async ({ text, usage, response }) => {
        try {
          if (temporaryChat) {
            return;
          }

          const messageIds = messages.slice(0, -1).map((m) => m.id);
          const latestUserMessage = messages[messages.length - 1];

          const newMessages = appendResponseMessages({
            messages: [latestUserMessage],
            responseMessages: response.messages,
          }).map((m) => ({
            ...m,
            // Override id if for consistency because different providers send different id formats
            id:
              m.role === "assistant"
                ? createIdGenerator({
                    prefix: "assistant",
                    size: 16,
                  })()
                : m.id,
          }));

          await updateChatMessages(chatId, messageIds, newMessages);

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

          const approximateCompletionTokens = Math.ceil(text.length / 4);

          // Use actual usage if available, otherwise use approximations
          const finalPromptTokens =
            !isNaN(usage.promptTokens) && usage.promptTokens > 0
              ? usage.promptTokens
              : approximatePromptTokens;

          const finalCompletionTokens =
            !isNaN(usage.completionTokens) && usage.completionTokens > 0
              ? usage.completionTokens
              : approximateCompletionTokens;

          await updateUsage(user.id, finalPromptTokens, finalCompletionTokens);
        } catch (error) {
          console.error("[Chat API] Database save failed:", error);
        }
      },
    });

    // chatStream.consumeStream();

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
          const messageIds = messages.slice(0, -1).map((m) => m.id);
          const latestUserMessage = messages[messages.length - 1];
          const errorMessage = {
            id: createIdGenerator({
              prefix: "error",
              size: 16,
            })(),
            role: "assistant" as const,
            content: errorContent,
            createdAt: new Date(),
            parts: [{ type: "text" as const, text: errorContent }],
          } as Message;

          const newMessages = [latestUserMessage, errorMessage];
          updateChatMessages(chatId, messageIds, newMessages);
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
  const isReasoningModel = modelConfig?.reasoning === true;

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

      const openrouter = createOpenRouter({
        apiKey: apiKeys.openrouter,
        ...(isReasoningModel && {
          extraBody: {
            include_reasoning: true,
          },
        }),
        ...(headers && { headers }),
      });
      return openrouter.chat(modelConfig.id);

    default:
      throw new Error(`Unsupported provider: ${modelConfig?.provider}`);
  }
}
