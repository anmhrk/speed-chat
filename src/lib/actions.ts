"use server";

import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { chat } from "./db/schema";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

export async function fetchMessages(chatId: string, userId: string) {
  try {
    const chatData = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, userId)))
      .limit(1);

    if (chatData.length === 0) {
      throw new Error("Chat not found");
    }

    return chatData[0].messages;
  } catch (error) {
    console.error("[Fetch Messages] Error:", error);
    throw error;
  }
}

export async function fetchThreads(userId: string) {
  try {
    const threads = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })
      .from(chat)
      .where(eq(chat.userId, userId))
      .orderBy(desc(chat.updatedAt));

    return threads;
  } catch (error) {
    console.error("[Fetch Threads] Error:", error);
    throw error;
  }
}

export async function createInitialChat(chatId: string, userId: string) {
  try {
    await db.insert(chat).values({
      id: chatId,
      userId: userId,
      title: "New Chat",
      messages: [],
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("[Create Initial Chat] Error:", error);
    throw error;
  }
}

export async function generateThreadTitle(chatId: string, prompt: string) {
  try {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const response = await generateText({
      model: openrouter("google/gemini-2.5-flash-preview-05-20"),
      prompt: `Generate a concise and descriptive title (max 6 words) for this chat based on the user's message.
            User message: ${prompt}
            
            Return only the title, no quotes or extra text.`,
    });

    await db
      .update(chat)
      .set({ title: response.text })
      .where(eq(chat.id, chatId));

    return response.text;
  } catch (error) {
    console.error("[Generate Thread Title] Error:", error);
    throw error;
  }
}
