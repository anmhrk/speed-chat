"use server";

import { getUser } from "./auth/get-user";
import { db } from "./db";
import { chats, messages } from "./db/schema";
import { generateText, type Message } from "ai";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { eq } from "drizzle-orm";

export async function createChat(chatId: string) {
  const user = await getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  try {
    await db.insert(chats).values({
      id: chatId,
      title: "New Chat",
      userId: user.id,
    });
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to create chat: ${error}`);
  }
}

export async function generateChatTitle(chatId: string, prompt: string) {
  try {
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
      .update(chats)
      .set({
        title: response.text,
      })
      .where(eq(chats.id, chatId));

    return response.text;
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to generate chat title: ${error}`);
  }
}

export async function saveMessages(
  chatId: string,
  messageIds: string[],
  newMessages: Message[]
) {
  try {
    await db.transaction(async (tx) => {
      const desiredIds = new Set<string>([
        ...messageIds,
        ...newMessages.map((m) => m.id),
      ]);

      const existingMessages = await tx.query.messages.findMany({
        where: eq(messages.chatId, chatId),
      });

      // Delete messages that exist in the DB but are no longer present on the client
      // Need to keep client and db in sync
      for (const existingMessage of existingMessages) {
        if (!desiredIds.has(existingMessage.id)) {
          await tx.delete(messages).where(eq(messages.id, existingMessage.id));
        }
      }

      // Insert the new / edited messages coming from the client
      for (const newMessage of newMessages) {
        const existing = existingMessages.find((m) => m.id === newMessage.id);

        if (existing) {
          await tx
            .update(messages)
            .set({ content: newMessage.content, parts: newMessage.parts })
            .where(eq(messages.id, newMessage.id));
        } else {
          await tx.insert(messages).values({
            chatId,
            ...newMessage,
          });
        }
      }
    });
  } catch (error) {
    console.error(error);
    throw new Error(`Failed to save messages: ${error}`);
  }
}
