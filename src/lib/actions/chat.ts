"use server";

import { db } from "../db";
import { chats, messages } from "../db/schema";
import { getUser } from ".";
import { eq, inArray, and } from "drizzle-orm";
import { generateText, type LanguageModel, type Message } from "ai";
import { titleGenerationPrompt } from "../ai/prompts";
import { deleteFiles } from "./uploadthing";
import { cache } from "react";

export async function createChat(chatId: string, userMessage: Message) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.insert(chats).values({
    id: chatId,
    title: "New Chat",
    userId: user.id,
  });

  await insertUserMessageToDb(userMessage, chatId);
}

export async function insertUserMessageToDb(
  userMessage: Message,
  chatId: string
) {
  await db.insert(messages).values({
    id: userMessage.id,
    chatId,
    content: userMessage.content,
    role: "user",
    createdAt: userMessage.createdAt ?? new Date(),
    parts: [{ type: "text", text: userMessage.content }],
    experimental_attachments: userMessage.experimental_attachments ?? undefined,
  });
}

export async function generateChatTitle(
  chatId: string,
  userMessage: Message,
  model: LanguageModel
) {
  try {
    const response = await generateText({
      model,
      system: titleGenerationPrompt,
      messages: [userMessage],
    });

    if (response.text) {
      await db
        .update(chats)
        .set({
          title: response.text,
        })
        .where(eq(chats.id, chatId));
    }
  } catch (error) {
    console.error("[Generate Chat Title] Error:", error);
  }
}

export async function deleteAllChats() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await deleteAllAttachments("all", user.id);
  await db.delete(chats).where(eq(chats.userId, user.id));
}

export async function deleteAllAttachments(
  type: "all" | "single",
  userId?: string,
  chatId?: string
) {
  let messagesToCheck: Message[] = [];

  if (type === "single" && chatId) {
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.chatId, chatId));

    messagesToCheck = chatMessages as Message[];
  } else if (type === "all" && userId) {
    const allChats = await db
      .select()
      .from(chats)
      .where(eq(chats.userId, userId));

    const allMessages = await db
      .select()
      .from(messages)
      .where(
        inArray(
          messages.chatId,
          allChats.map((chat) => chat.id)
        )
      );

    messagesToCheck = allMessages as Message[];
  }

  if (messagesToCheck.length === 0) {
    return;
  }

  const attachmentUrls = messagesToCheck.flatMap((message) =>
    message.experimental_attachments?.map((attachment) => attachment.url)
  );

  const toolInvocationUrls = messagesToCheck.flatMap(
    (message) =>
      message.parts?.map((part) => {
        if (part.type === "tool-invocation") {
          const invocation = part.toolInvocation as any;
          return invocation.result?.imageUrl ?? null;
        }
        return null;
      }) ?? []
  );

  await deleteFiles([
    ...attachmentUrls.filter((url): url is string => Boolean(url)),
    ...toolInvocationUrls.filter((url): url is string => Boolean(url)),
  ]);
}

export async function verifySharedChat(
  chatId: string,
  userId: string
): Promise<{ success: boolean; didUserCreate: boolean }> {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  if (!chat.isShared) {
    return {
      success: false,
      didUserCreate: false,
    };
  }

  if (chat.userId !== userId) {
    return {
      success: true,
      didUserCreate: false,
    };
  }

  return {
    success: true,
    didUserCreate: true,
  };
}

export const validateChatAccess = cache(
  async (chatId: string): Promise<boolean> => {
    const user = await getUser();
    if (!user) {
      return false;
    }

    const [chat] = await db
      .select()
      .from(chats)
      .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
      .limit(1);

    return Boolean(chat);
  }
);
