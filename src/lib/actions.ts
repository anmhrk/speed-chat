"use server";

import { generateText, type Message } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { asc, desc, eq } from "drizzle-orm";
import { chat, message, usage } from "./db/schema";
import { db } from "./db";

export async function fetchMessages(chatId: string) {
  try {
    const messages = await db.query.message.findMany({
      where: eq(message.chatId, chatId),
      orderBy: [asc(message.createdAt)],
    });

    return messages;
  } catch (error) {
    console.error("Error fetching messages", error);
    throw error;
  }
}

export async function fetchChats(userId: string) {
  try {
    const chats = await db.query.chat.findMany({
      where: eq(chat.userId, userId),
      orderBy: [desc(chat.updatedAt)],
    });

    return chats;
  } catch (error) {
    console.error("Error fetching chats", error);
    throw error;
  }
}

export async function createChat(chatId: string, userId: string) {
  try {
    await db.transaction(async (tx) => {
      await tx.insert(chat).values({
        id: chatId,
        userId,
        title: "New Chat",
      });

      const usageData = await tx.query.usage.findFirst({
        where: eq(usage.userId, userId),
      });

      if (!usageData) {
        await tx.insert(usage).values({
          userId,
          chatsCreated: 1,
        });
      } else {
        await tx
          .update(usage)
          .set({
            chatsCreated: usageData.chatsCreated + 1,
          })
          .where(eq(usage.userId, userId));
      }
    });
  } catch (error) {
    console.error("Error creating chat", error);
    throw error;
  }
}

export async function generateChatTitle(chatId: string, prompt: string) {
  try {
    const openrouter = createOpenRouter({
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const response = await generateText({
      model: openrouter("google/gemini-2.5-flash-preview-05-20"),
      prompt: `
        Your job is to create concise, descriptive titles for chat conversations based on the user's first message. 
        
        <rules>
        - Generate titles that are 5-6 words maximum
        - Make titles descriptive and specific to the topic
        - Use clear, professional language
        - Avoid generic titles like "Chat" or "Conversation"
        - Focus on the main subject or task being discussed
        - Use title case formatting
        - Do not include quotation marks or special formatting
        </rules>

        <examples>
        - "React Component State Management Help"
        - "Python Data Analysis Tutorial"
        - "Database Schema Design Discussion"
        - "API Integration Troubleshooting"
        </examples>

        <user_message>
        ${prompt}
        </user_message>

        Generate and return only the title text, nothing else.
        `,
    });

    await db
      .update(chat)
      .set({
        title: response.text,
        updatedAt: new Date(),
      })
      .where(eq(chat.id, chatId));

    return response.text;
  } catch (error) {
    console.error("Error generating chat title", error);
    throw error;
  }
}

export async function updateChatMessages(
  chatId: string,
  messageIds: string[],
  newMessages: Message[],
) {
  try {
    await db.transaction(async (tx) => {
      const desiredIds = new Set<string>([
        ...messageIds,
        ...newMessages.map((m) => m.id),
      ]);

      const existingMessages = await tx.query.message.findMany({
        where: eq(message.chatId, chatId),
      });

      // Delete messages that exist in the DB but are no longer present on the client
      // Need to keep client and db in sync
      for (const existingMessage of existingMessages) {
        if (!desiredIds.has(existingMessage.id)) {
          await tx.delete(message).where(eq(message.id, existingMessage.id));
        }
      }

      // Insert the new / edited messages coming from the client
      for (const newMessage of newMessages) {
        const existing = existingMessages.find((m) => m.id === newMessage.id);

        if (existing) {
          await tx
            .update(message)
            .set({
              content: newMessage.content,
              parts: newMessage.parts,
            })
            .where(eq(message.id, newMessage.id));
        } else {
          await tx.insert(message).values({
            id: newMessage.id,
            chatId,
            role: newMessage.role,
            content: newMessage.content,
            parts: newMessage.parts,
          });
        }
      }
    });
  } catch (error) {
    console.error("Error updating chat messages", error);
    throw error;
  }
}

export async function fetchUsage(userId: string) {
  try {
    const usageData = await db.query.usage.findFirst({
      where: eq(usage.userId, userId),
    });

    return usageData;
  } catch (error) {
    console.error("Error fetching usage", error);
    throw error;
  }
}

export async function updateUsage(
  userId: string,
  promptTokens: number,
  completionTokens: number,
) {
  try {
    const usageData = await db.query.usage.findFirst({
      where: eq(usage.userId, userId),
    });

    if (!usageData) {
      throw new Error("Usage data not found");
    }

    await db
      .update(usage)
      .set({
        promptTokens: usageData.promptTokens + promptTokens,
        completionTokens: usageData.completionTokens + completionTokens,
        messagesSent: usageData.messagesSent + 1,
      })
      .where(eq(usage.userId, userId));
  } catch (error) {
    console.error("Error updating usage", error);
    throw error;
  }
}

export async function resetUsage(userId: string) {
  try {
    await db
      .update(usage)
      .set({
        promptTokens: 0,
        completionTokens: 0,
        messagesSent: 0,
        chatsCreated: 0,
      })
      .where(eq(usage.userId, userId));
  } catch (error) {
    console.error("Error resetting usage", error);
    throw error;
  }
}

export async function deleteChat(chatId: string) {
  try {
    await db.delete(chat).where(eq(chat.id, chatId));
    // Messages are deleted automatically by cascade
  } catch (error) {
    console.error("Error deleting chat", error);
    throw error;
  }
}

export async function deleteAllChats(userId: string) {
  try {
    await db.delete(chat).where(eq(chat.userId, userId));
    // Messages are deleted automatically by cascade
  } catch (error) {
    console.error("Error deleting all chats", error);
    throw error;
  }
}

export async function pinChat(chatId: string) {
  try {
    await db
      .update(chat)
      .set({
        isPinned: true,
      })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.error("Error pinning chat", error);
    throw error;
  }
}

export async function unpinChat(chatId: string) {
  try {
    await db
      .update(chat)
      .set({
        isPinned: false,
      })
      .where(eq(chat.id, chatId));
  } catch (error) {
    console.error("Error unpinning chat", error);
    throw error;
  }
}
