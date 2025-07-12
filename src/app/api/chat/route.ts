import { NextRequest } from "next/server";
import {
  streamText,
  APICallError,
  InvalidPromptError,
  RetryError,
  ToolExecutionError,
  createIdGenerator,
  smoothStream,
  appendResponseMessages,
  type LanguageModel,
  experimental_generateImage as generateImage,
  type ImageModel,
  tool,
  createDataStreamResponse,
  NoImageGeneratedError,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createFal } from "@ai-sdk/fal";
import type { Models, ChatRequest, Providers } from "@/lib/types";
import {
  AVAILABLE_MODELS,
  hasEffortControl,
  isImageGenerationModel,
  isReasoningModel,
} from "@/lib/ai/models";
import {
  addMemory,
  saveMessages,
  generateChatTitle,
  getMemories,
  uploadBase64Image,
  getUser,
} from "@/lib/actions";
import { z } from "zod";
import { chatPrompt, imageGenerationPrompt } from "@/lib/ai/prompts";
import Exa from "exa-js";
import type { Memory } from "@/lib/db/schema";
import { env } from "@/lib/env";

type DimensionFormat = "size" | "aspectRatio";

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
      isNewChat,
      customization,
      searchEnabled,
      reasoningEnabled,
    } = body;

    const user = await getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    let aiModel: LanguageModel;
    let imageModel: ImageModel;
    let dimensionFormat: DimensionFormat;
    let storedMemories: Memory[] = [];

    const isImageModel = isImageGenerationModel(model);
    const isReasoningModelActive = isReasoningModel(model, reasoningEnabled);

    const noThinkQwen = model.includes("qwen") && !reasoningEnabled;

    const headers =
      env.NODE_ENV === "production" && env.SITE_URL
        ? {
            "HTTP-Referer": env.SITE_URL,
            "X-Title": "Speed Chat",
          }
        : undefined;

    const openrouter = createOpenRouter({
      apiKey: apiKeys.openrouter ?? env.OPENROUTER_API_KEY,
      ...(isReasoningModelActive && {
        extraBody: {
          include_reasoning: true,
        },
      }),
      ...(headers && { headers }),
    });

    if (isImageModel) {
      const modelConfig = AVAILABLE_MODELS.find((m) => m.id === model);
      const provider = modelConfig?.providerId;

      if (provider === "openai") {
        dimensionFormat = "size";
      } else {
        dimensionFormat = "aspectRatio";
      }

      aiModel = openrouter.chat("google/gemini-2.5-flash");
      imageModel = buildImageModel(model, apiKeys, provider!);
    } else {
      if (model.includes("o3")) {
        const openai = createOpenAI({
          apiKey: apiKeys.openai,
        });
        aiModel = openai(model);
      } else {
        aiModel = openrouter.chat(model);
      }

      storedMemories = await getMemories();
    }

    const modelName = AVAILABLE_MODELS.find((m) => m.id === model)?.name;

    const calculateThinkingBudget = () => {
      // choosing 15k max budget for now, but can be changed later
      if (reasoningEffort === "low") return 15000 / 4;
      if (reasoningEffort === "medium") return 15000 / 2;
      if (reasoningEffort === "high") return 15000;
      return 15000 / 4;
    };

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const startTime = Date.now();
        let ttftCalculated = false;
        let ttft = 0;
        let reasoningStartTime: number | null = null;
        let reasoningDuration = 0;

        // Both titlePromise and streamText will run in parallel
        let titlePromise: Promise<string> | undefined;
        if (!temporaryChat && isNewChat) {
          titlePromise = generateChatTitle(
            chatId,
            messages[messages.length - 1],
            openrouter.chat("google/gemini-2.5-flash-lite-preview-06-17")
          );
        }

        const result = streamText({
          model: aiModel,
          system: isImageModel
            ? imageGenerationPrompt(messages[messages.length - 1].content)
            : chatPrompt(
                modelName!,
                customization,
                searchEnabled,
                storedMemories,
                noThinkQwen
              ),
          experimental_transform: [
            smoothStream({
              chunking: "word",
            }),
          ],
          messages,
          ...(isReasoningModelActive && {
            providerOptions: {
              openrouter: {
                reasoning:
                  model.includes("openai") || model.includes("x-ai")
                    ? { effort: reasoningEffort }
                    : { max_tokens: calculateThinkingBudget() },
              },
              openai: {
                reasoningEffort: reasoningEffort,
              },
            },
          }),
          tools: {
            ...(isImageModel && {
              generateImage: tool({
                description: "Generate an image based on the user's prompt",
                parameters: z.object({
                  prompt: z
                    .string()
                    .describe("The prompt to generate an image from"),
                }),
                execute: async ({ prompt }) => {
                  const { image } = await generateImage({
                    model: imageModel,
                    prompt,
                    ...(dimensionFormat === "size"
                      ? { size: "1024x1024" }
                      : { aspectRatio: "1:1" }),
                  });

                  const userMessageId = messages[messages.length - 1].id;
                  const imageName = `image-${userMessageId}.png`;
                  const imageUrl = await uploadBase64Image(
                    imageName,
                    image.base64
                  );

                  return { imageUrl };
                },
              }),
            }),
            ...(searchEnabled && {
              webSearch: tool({
                description:
                  "Search the web for current information to help answer the user's question. Use this when you need up-to-date information or facts not in your training data.",
                parameters: z.object({
                  query: z
                    .string()
                    .describe(
                      "The search query to find information relevant to the user's question."
                    ),
                  resultCategory: z
                    .enum([
                      "auto",
                      "company",
                      "research paper",
                      "news",
                      "pdf",
                      "github",
                      "personal site",
                      "linkedin profile",
                      "financial report",
                    ])
                    .describe("The category of the result to search for."),
                }),
                execute: async ({ query, resultCategory }) => {
                  const exa = new Exa(apiKeys.exa);

                  const result = await exa.searchAndContents(query, {
                    type: "auto",
                    category:
                      resultCategory === "auto" ? undefined : resultCategory,
                    numResults: 8,
                    text: {
                      maxCharacters: 800,
                    },
                  });

                  return {
                    query: query,
                    totalResults: result.results.length,
                    results: result.results.map((item, index) => ({
                      rank: index + 1,
                      title: item.title,
                      url: item.url,
                      content: item.text || "No content available",
                      publishedDate: item.publishedDate || "Date not available",
                    })),
                  };
                },
              }),
            }),
            ...(!isImageModel && {
              addMemory: tool({
                description:
                  "Add a useful detail about the user to remember for future conversations. This helps personalize responses and maintain context across chats.",
                parameters: z.object({
                  memory: z
                    .string()
                    .describe(
                      "A concise, useful detail about the user to remember (e.g., preferences, context, goals, or personal information)"
                    ),
                }),
                execute: async ({ memory }) => {
                  await addMemory(memory);

                  return {
                    success: true,
                    memory: memory,
                  };
                },
              }),
            }),
          },
          ...(isImageModel && { toolChoice: "required" }),
          ...(!isImageModel && { maxSteps: 10 }),
          toolCallStreaming: true,
          onChunk: (event) => {
            if (
              !ttftCalculated &&
              (event.chunk.type === "text-delta" ||
                event.chunk.type === "reasoning")
            ) {
              // Time to first token (in seconds) the moment text delta or reasoning starts
              ttft = (Date.now() - startTime) / 1000;
              ttftCalculated = true;
            }

            // Track reasoning duration
            if (event.chunk.type === "reasoning") {
              if (reasoningStartTime === null) {
                reasoningStartTime = Date.now();
              }
            } else if (
              reasoningStartTime !== null &&
              event.chunk.type === "text-delta"
            ) {
              // Reasoning ended when we start getting text
              reasoningDuration = Math.round(
                (Date.now() - reasoningStartTime) / 1000
              );
              reasoningStartTime = null;
            }
          },
          onFinish: async ({ response, usage }) => {
            const endTime = Date.now();
            const elapsedTime = endTime - startTime;
            // Tokens per second
            const tps = usage.totalTokens / (elapsedTime / 1000);

            const metadata = {
              ...usage,
              elapsedTime,
              tps,
              ttft,
              modelName: modelName!.concat(
                isReasoningModelActive && hasEffortControl(model)
                  ? ` (${reasoningEffort.charAt(0).toUpperCase() + reasoningEffort.slice(1)})`
                  : ""
              ),
              ...(reasoningDuration > 0 && { reasoningDuration }),
            };

            dataStream.writeMessageAnnotation({
              metadata,
            });

            try {
              if (temporaryChat) {
                return;
              }

              const messageIds = messages.slice(0, -1).map((m) => m.id);
              const latestUserMessage = messages[messages.length - 1];

              const newMessages = appendResponseMessages({
                messages: [latestUserMessage],
                responseMessages: response.messages,
              });

              // Add annotations to the assistant messages after appendResponseMessages
              const messagesWithAnnotations = newMessages.map((message) => {
                if (message.role === "assistant") {
                  return {
                    ...message,
                    annotations: [{ metadata }],
                  };
                }
                return message;
              });

              await saveMessages(chatId, messageIds, messagesWithAnnotations);
            } catch (error) {
              console.error("[Chat API] Database save failed:", error);
            }
          },
        });

        if (titlePromise) {
          titlePromise.then((title) => {
            if (title !== "New Chat") {
              dataStream.writeData({
                type: "title",
                payload: title,
              });
            }
          });
        }

        result.mergeIntoDataStream(dataStream, {
          sendReasoning: true,
        });
      },
      onError: (error) => {
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
        } else if (ToolExecutionError.isInstance(error)) {
          errorContent = `There was a problem executing the tool: ${error.toolName}. Please try again.`;
        } else if (NoImageGeneratedError.isInstance(error)) {
          errorContent =
            "There was a problem generating the image. Please try again.";
        } else {
          errorContent = "An unknown error occurred. Please try again.";
        }

        // Save error in db to not keep the user message hanging on refresh
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
          };

          const newMessages = [latestUserMessage, errorMessage];
          saveMessages(chatId, messageIds, newMessages);
        } catch (dbError) {
          console.error(
            "[Chat API] Failed to save error message to database:",
            dbError
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

function buildImageModel(
  model: Models,
  apiKeys: Record<Providers, string>,
  provider: Providers
): ImageModel {
  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: apiKeys.openai,
    });
    return openai.image(model);
  } else if (provider === "falai") {
    const fal = createFal({
      apiKey: apiKeys.falai,
    });
    return fal.image(model);
  }

  throw new Error("Invalid model");
}
