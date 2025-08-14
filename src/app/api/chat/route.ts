import {
  convertToModelMessages,
  createIdGenerator,
  smoothStream,
  stepCountIs,
  streamText,
  tool,
} from "ai";
import { createGateway } from "@ai-sdk/gateway";
import type { ChatRequest, MessageMetadata } from "@/lib/types";
import { generalChatPrompt } from "@/lib/prompts";
import { CHAT_MODELS } from "@/lib/models";
import { z } from "zod";
import Exa from "exa-js";
import { NextRequest } from "next/server";
import { fetchAction, fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { getAuthToken } from "@/lib/auth/token";

export const searchWebTool = tool({
  description: "Search the web for up-to-date information",
  inputSchema: z.object({
    query: z.string().min(1).max(100).describe("The search query"),
    category: z
      .enum([
        "company",
        "financial report",
        "github",
        "linkedin profile",
        "news",
        "pdf",
        "personal site",
        "research paper",
      ])
      .optional()
      .describe(
        "The category of the search query. Optional. Dont provide if not relevant."
      ),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string(),
      url: z.url(),
      publishedDate: z.string(),
    })
  ),
  execute: async ({ query, category }) => {
    try {
      const exa = new Exa(process.env.EXA_API_KEY);
      const { results } = await exa.searchAndContents(query, {
        type: "auto",
        livecrawl: "always",
        numResults: 10,
        text: true,
        category: category ?? undefined,
      });

      return results.map((result) => ({
        title: result.title,
        url: result.url,
        publishedDate: result.publishedDate,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },
});

export async function POST(request: NextRequest) {
  const token = await getAuthToken();
  const user = await fetchQuery(api.auth.getCurrentUser, {}, { token });

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body: ChatRequest = await request.json();
  const {
    messages,
    chatId,
    modelId,
    reasoningEffort,
    shouldUseReasoning,
    shouldSearchWeb,
    isNewChat,
  } = body;

  const headers = request.headers;
  const apiKey = headers.get("x-ai-gateway-api-key");

  if (!apiKey) {
    return new Response("Missing API key", { status: 400 });
  }

  const gateway = createGateway({
    apiKey,
  });

  const calculateThinkingBudget = () => {
    // choosing 15k max budget for now, but can be changed later
    switch (reasoningEffort) {
      case "low":
        return 15_000 / 4;
      case "medium":
        return 15_000 / 2;
      case "high":
        return 15_000;
      default:
        return 15_000 / 4;
    }
  };

  const thinkingBudget = calculateThinkingBudget();

  const isReasoningModel =
    CHAT_MODELS.find((m) => m.id === modelId)?.reasoning === "hybrid" ||
    CHAT_MODELS.find((m) => m.id === modelId)?.reasoning === "always";

  const isHybridReasoningModel =
    CHAT_MODELS.find((m) => m.id === modelId)?.reasoning === "hybrid";

  const modelName =
    CHAT_MODELS.find((m) => m.id === modelId)?.name ?? "Unknown Model";

  const startTime = Date.now();
  let ttftCalculated = false;
  let ttft = 0;

  // Create chat immediately and generate title if it's a new chat
  if (isNewChat) {
    await fetchMutation(
      api.chat.createChat,
      {
        chatId,
      },
      {
        token,
      }
    );

    try {
      fetchAction(
        api.chat.generateChatTitle,
        {
          chatId,
          apiKey,
          messages,
        },
        {
          token,
        }
      );
    } catch (error) {
      console.error("Failed to generate chat title:", error);
      // Title generation failure shouldn't affect the main chat flow in case api key is invalid
    }
  } else {
    fetchMutation(
      api.chat.updateChatUpdatedAt,
      {
        chatId,
      },
      {
        token,
      }
    );
  }

  try {
    const result = streamText({
      model: gateway(modelId),
      ...(isReasoningModel && {
        providerOptions: {
          ...(shouldUseReasoning && {
            anthropic: {
              thinking: {
                type: "enabled",
                budgetTokens: thinkingBudget,
              },
            },
          }),
          openai: {
            reasoningEffort,
            reasoningSummary: "detailed",
          },
          // Have to use this for gemini models, because flash is hybrid and pro isn't
          ...((shouldUseReasoning || !isHybridReasoningModel) && {
            google: {
              thinkingConfig: {
                thinkingBudget,
                includeThoughts: true,
              },
            },
          }),
        },
      }),
      system: generalChatPrompt(modelName, shouldSearchWeb),
      messages: convertToModelMessages(messages),
      tools: {
        searchWebTool,
      },
      experimental_transform: smoothStream({
        delayInMs: 20,
        chunking: "word",
      }),
      stopWhen: stepCountIs(10),
      toolChoice: shouldSearchWeb ? "required" : "auto",
      onChunk: (event) => {
        if (
          !ttftCalculated &&
          (event.chunk.type === "text-delta" ||
            event.chunk.type === "reasoning-delta" ||
            event.chunk.type === "tool-call")
        ) {
          // Time to first token (in seconds) the moment text delta or reasoning or tool call starts
          ttft = (Date.now() - startTime) / 1000;
          ttftCalculated = true;
        }
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () =>
        createIdGenerator({
          prefix: "assistant",
          size: 16,
        })(),
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
          const usage = part.totalUsage;
          const endTime = Date.now();
          const elapsedTime = endTime - startTime;
          const outputTokens =
            (usage?.outputTokens ?? 0) + (usage?.reasoningTokens ?? 0); // total tokens includes input + system prompt too so using this instead
          const tps = outputTokens ? outputTokens / (elapsedTime / 1000) : 0;

          const metadata: MessageMetadata = {
            modelName,
            tps,
            ttft,
            elapsedTime,
            completionTokens: outputTokens,
          };

          return metadata;
        }
      },
      onFinish: async ({ messages: allMessages, responseMessage }) => {
        // allMessages is the full list of messages, including the latest response message
        const latestMessages = allMessages.slice(-2); // last 2 messages are the user message and the assistant response

        if (responseMessage.parts?.length === 0) {
          // If the response message has no parts, it means the model returned an error
          // This should actually not be happening, why is onFinish being called if there's an error?
          // But it is being hit for some reason, so just doing an early return for now to prevent db save
          return;
        }

        await fetchMutation(
          api.chat.upsertMessages,
          {
            chatId,
            messages: latestMessages.map((message) => ({
              id: message.id,
              role: message.role,
              parts: message.parts,
              metadata: message.metadata as MessageMetadata,
            })),
          },
          {
            token,
          }
        );
      },
    });
  } catch (error) {
    // Throw any errors outside of streaming
    console.error("Chat route error:", error);
    throw error;
  }
}
