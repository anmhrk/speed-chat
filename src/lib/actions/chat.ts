"use server";

import { db } from "../db";
import { chats, messages } from "../db/schema";
import { getUser } from ".";
import { eq, desc, and, asc, inArray } from "drizzle-orm";
import { generateText, type LanguageModel, type Message } from "ai";
import { titleGenerationPrompt } from "../ai/prompts";
import { deleteFiles } from ".";

export async function getChats() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const allChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, user.id))
    .orderBy(desc(chats.updatedAt));

  return allChats;
}

export async function getMessages(chatId: string, sharedRequest: boolean) {
  const user = await getUser();
  if (!user && !sharedRequest) {
    throw new Error("Unauthorized");
  }

  const whereClause = sharedRequest
    ? eq(chats.id, chatId)
    : and(eq(chats.id, chatId), eq(chats.userId, user?.id ?? ""));

  const chat = await db.select().from(chats).where(whereClause).limit(1);

  if (!chat) {
    throw new Error(`Chat ${chatId} not found`);
  }

  const allMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId))
    .orderBy(asc(messages.createdAt));

  return allMessages;
}

export async function createChat(chatId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.insert(chats).values({
    id: chatId,
    title: "New Chat",
    userId: user.id,
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

    return response.text;
  } catch (error) {
    console.error("[Generate Chat Title] Error:", error);
    return "New Chat"; // Don't throw error to not break stream. Just return default title.
  }
}

export async function saveMessages(chatId: string, newMessages: Message[]) {
  for (const newMessage of newMessages) {
    await db.insert(messages).values({
      chatId,
      id: newMessage.id,
      content: newMessage.content,
      role: newMessage.role,
      parts: newMessage.parts,
      annotations: newMessage.annotations,
      experimental_attachments: newMessage.experimental_attachments,
      createdAt: newMessage.createdAt
        ? new Date(newMessage.createdAt)
        : new Date(),
    });
  }

  await db
    .update(chats)
    .set({ updatedAt: new Date() })
    .where(eq(chats.id, chatId));
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

export async function deleteMessages(messageIds: string[]) {
  await db.delete(messages).where(inArray(messages.id, messageIds));
}
