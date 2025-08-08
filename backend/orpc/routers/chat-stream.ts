import { createGateway } from '@ai-sdk/gateway';
import { streamToEventIterator, type } from '@orpc/server';
import {
  APICallError,
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  generateText,
  type InferToolOutput,
  stepCountIs,
  streamText,
  tool,
  type UIMessage,
} from 'ai';
import { eq } from 'drizzle-orm';
import Exa from 'exa-js';
import { z } from 'zod';
import { chats, messages as messagesTable } from '@/backend/db/schema';
import { CHAT_MODELS, type ModelId, type ReasoningEffort } from '@/lib/models';
import { generalChatPrompt, titleGenPrompt } from '@/lib/prompts';
import { protectedProcedure } from '../middleware';

const searchWebTool = tool({
  name: 'searchWeb',
  description: 'Search the web for up-to-date information',
  inputSchema: z.object({
    query: z.string().min(1).max(100).describe('The search query'),
  }),
  outputSchema: z.array(
    z.object({
      title: z.string(),
      url: z.url(),
      content: z.string(),
      publishedDate: z.string(),
    })
  ),
  execute: async ({ query }) => {
    try {
      const exa = new Exa();
      const { results } = await exa.searchAndContents(query, {
        livecrawl: 'always',
        numResults: 8,
      });

      return results.map((result) => ({
        title: result.title,
        url: result.url,
        content: result.text.slice(0, 1000),
        publishedDate: result.publishedDate,
      }));
    } catch (error) {
      console.error(error);
      return [];
    }
  },
});

export type searchWebToolOutput = InferToolOutput<typeof searchWebTool>;

const messageMetadataSchema = z.object({
  modelName: z.string(),
  tps: z.number(), // tokens per second
  ttft: z.number(), // time to first token
  elapsedTime: z.number(),
  totalTokens: z.number(),
  reasoningDuration: z.number().optional(),
});

export type MessageMetadata = z.infer<typeof messageMetadataSchema>;

export const chatStreamRouter = {
  stream: protectedProcedure
    .input(
      type<{
        chatId: string;
        messages: UIMessage[];
        modelId: ModelId;
        apiKey: string;
        reasoningEffort: ReasoningEffort;
        shouldUseReasoning: boolean;
        shouldSearchWeb: boolean;
        isNewChat: boolean;
      }>()
    )
    .handler(({ context, input }) => {
      const {
        chatId,
        messages,
        modelId,
        apiKey,
        reasoningEffort,
        shouldUseReasoning,
        shouldSearchWeb,
        isNewChat,
      } = input;

      const { user, db } = context;

      const gateway = createGateway({
        apiKey,
      });

      const calculateThinkingBudget = () => {
        // choosing 15k max budget for now, but can be changed later
        switch (reasoningEffort) {
          case 'low':
            return 15_000 / 4;
          case 'medium':
            return 15_000 / 2;
          case 'high':
            return 15_000;
          default:
            return 15_000 / 4;
        }
      };

      const thinkingBudget = calculateThinkingBudget();

      const isReasoningModel =
        CHAT_MODELS.find((m) => m.id === modelId)?.reasoning === 'hybrid' ||
        CHAT_MODELS.find((m) => m.id === modelId)?.reasoning === 'always';

      const isHybridReasoningModel =
        CHAT_MODELS.find((m) => m.id === modelId)?.reasoning === 'hybrid';

      const modelName =
        CHAT_MODELS.find((m) => m.id === modelId)?.name ?? 'Unknown Model';

      const stream = createUIMessageStream({
        execute: ({ writer }) => {
          const startTime = Date.now();
          let ttftCalculated = false;
          let ttft = 0;
          let reasoningStartTime: number | null = null;
          let reasoningDuration = 0;

          let titlePromise: Promise<string> | undefined;
          let generatedTitle = 'New Chat';

          if (isNewChat) {
            titlePromise = (async () => {
              try {
                const response = await generateText({
                  model: gateway('openai/gpt-5-nano'),
                  system: titleGenPrompt,
                  messages: convertToModelMessages(messages),
                });

                if (response.text) {
                  generatedTitle = response.text;
                  await db
                    .insert(chats)
                    .values({
                      id: chatId,
                      userId: user.id,
                      title: response.text,
                    })
                    .onConflictDoUpdate({
                      target: [chats.id],
                      set: {
                        title: response.text,
                      },
                    });
                }

                return generatedTitle;
              } catch (error) {
                console.error(error);
                return generatedTitle;
              }
            })();
          }

          const result = streamText({
            model: gateway(modelId),
            ...(isReasoningModel && {
              providerOptions: {
                ...(shouldUseReasoning && {
                  anthropic: {
                    thinking: {
                      type: 'enabled',
                      budgetTokens: thinkingBudget,
                    },
                  },
                }),
                openai: {
                  reasoningEffort,
                  reasoningSummary: 'detailed',
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
            stopWhen: stepCountIs(10),
            toolChoice: shouldSearchWeb ? 'required' : 'auto',
            onChunk: (event) => {
              if (
                !ttftCalculated &&
                (event.chunk.type === 'text-delta' ||
                  event.chunk.type === 'reasoning-delta' ||
                  event.chunk.type === 'tool-call')
              ) {
                // Time to first token (in seconds) the moment text delta or reasoning or tool call starts
                ttft = (Date.now() - startTime) / 1000;
                ttftCalculated = true;
              }

              if (event.chunk.type === 'reasoning-delta') {
                // Track reasoning duration
                if (reasoningStartTime === null) {
                  reasoningStartTime = Date.now();
                }
              } else if (
                reasoningStartTime !== null &&
                event.chunk.type === 'text-delta'
              ) {
                // Reasoning ended when we start getting text
                reasoningDuration = Math.round(
                  (Date.now() - reasoningStartTime) / 1000
                );
                reasoningStartTime = null;
              }
            },
            onFinish: ({ usage }) => {
              const endTime = Date.now();
              const elapsedTime = endTime - startTime;
              const tps = usage?.totalTokens
                ? usage.totalTokens / (elapsedTime / 1000)
                : 0;

              const metadata: MessageMetadata = {
                modelName,
                tps,
                ttft,
                elapsedTime,
                totalTokens: usage?.totalTokens ?? 0,
                ...(reasoningDuration > 0 && { reasoningDuration }),
              };

              writer.write({
                type: 'data-message-metadata',
                data: metadata,
              });
            },
          });

          if (titlePromise) {
            titlePromise.then((title) => {
              if (title !== 'New Chat') {
                writer.write({
                  type: 'data-title',
                  data: title,
                  // transient because don't want to persist the title in the message part
                  transient: true,
                });
              }
            });
          }

          writer.merge(
            result.toUIMessageStream({
              originalMessages: messages,
              generateMessageId: () =>
                createIdGenerator({
                  prefix: 'assistant',
                  size: 16,
                })(),
              onFinish: async ({ messages: allMessages }) => {
                // allMessages is the full list of messages, including the latest response message
                const latestMessages = allMessages.slice(-2); // last 2 messages are the user message and the assistant response

                await db.transaction(async (tx) => {
                  if (isNewChat) {
                    await tx
                      .insert(chats)
                      .values({
                        id: chatId,
                        userId: user.id,
                        title: generatedTitle,
                      })
                      .onConflictDoNothing();
                  }

                  await tx.insert(messagesTable).values(
                    latestMessages.map((message) => ({
                      id: message.id,
                      chatId,
                      role: message.role,
                      parts: message.parts,
                    }))
                  );

                  await tx
                    .update(chats)
                    .set({
                      updatedAt: new Date(),
                    })
                    .where(eq(chats.id, chatId));
                });
              },
            })
          );
        },
        onError: (error) => {
          console.error(error);
          let errorMessage = 'An error occurred while generating the response';

          // Usually this is the error type
          if (APICallError.isInstance(error)) {
            errorMessage = error.message;
          }

          return errorMessage;
        },
      });

      return streamToEventIterator(stream);
    }),
};
