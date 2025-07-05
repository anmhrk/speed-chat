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
  type LanguageModelV1,
  experimental_generateImage as generateImage,
  type ImageModel,
  tool,
} from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { createOpenAI } from "@ai-sdk/openai";
import { createFal } from "@ai-sdk/fal";
import type { Models, ChatRequest, Providers } from "@/lib/types";
import { AVAILABLE_MODELS } from "@/lib/models";
import { getUser } from "@/lib/auth/get-user";
import { saveMessages } from "@/lib/db/actions";
import { uploadBase64Image } from "@/lib/uploadthing";
import { z } from "zod";
import { chatPrompt, imageGenerationPrompt } from "@/lib/prompts";
import Exa from "exa-js";

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
      customization,
      searchEnabled,
    } = body;

    const user = await getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    let aiModel: LanguageModelV1;
    let imageModel: ImageModel;
    let modelId = model;
    let dimensionFormat: DimensionFormat;

    const isImageModel =
      AVAILABLE_MODELS.find((m) => m.id === modelId)?.imageGeneration === true;

    const isReasoningModel =
      AVAILABLE_MODELS.find((m) => m.id === modelId)?.reasoning === true;

    const headers =
      process.env.NODE_ENV === "production"
        ? {
            "HTTP-Referer": process.env.SITE_URL!,
            "X-Title": "Speed Chat",
          }
        : undefined;

    const openrouter = createOpenRouter({
      apiKey: apiKeys.openrouter ?? process.env.OPENROUTER_API_KEY,
      ...(isReasoningModel && {
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
      if (model.includes("thinking")) {
        modelId = model.replace("-thinking", "") as Models;
      }

      if (modelId.includes("o3")) {
        const openai = createOpenAI({
          apiKey: apiKeys.openai,
        });
        aiModel = openai(modelId);
      } else {
        aiModel = openrouter.chat(modelId);
      }
    }

    const modelName = AVAILABLE_MODELS.find((m) => m.id === model)?.name;

    const calculateThinkingBudget = () => {
      if (reasoningEffort === "low") return 15000 / 4;
      if (reasoningEffort === "medium") return 15000 / 2;
      if (reasoningEffort === "high") return 15000;
      return 15000 / 4;
    };

    const chatStream = streamText({
      model: aiModel,
      system: isImageModel
        ? imageGenerationPrompt(messages[messages.length - 1].content)
        : chatPrompt(modelName!, customization, searchEnabled),
      experimental_transform: [
        smoothStream({
          chunking: "word",
        }),
      ],
      messages,
      ...(isReasoningModel && {
        providerOptions: {
          openrouter: {
            reasoning:
              modelId.includes("openai") || modelId.includes("x-ai")
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
              const imageUrl = await uploadBase64Image(imageName, image.base64);

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
      },
      ...(isImageModel && {
        toolChoice: "required",
      }),
      maxSteps: 5,
      toolCallStreaming: true,
      onFinish: async ({ response }) => {
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

          await saveMessages(chatId, messageIds, newMessages);
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
        } else if (ToolExecutionError.isInstance(error)) {
          errorContent = `${error.message}`;
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
