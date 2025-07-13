"use server";

import { db } from "../db";
import { chats, messages } from "../db/schema";
import { getUser } from ".";
import { eq, inArray } from "drizzle-orm";
import { generateText, type LanguageModel, type Message } from "ai";
import { titleGenerationPrompt } from "../ai/prompts";
import { deleteFiles } from "./uploadthing";

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

export async function saveMessages(
  chatId: string,
  messageIds: string[],
  newMessages: Message[]
) {
  const desiredIds = new Set<string>([
    ...messageIds,
    ...newMessages.map((m) => m.id),
  ]);

  const existingMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, chatId));

  // Delete messages that exist in the DB but are no longer present on the client
  // Need to keep client and db in sync
  for (const existingMessage of existingMessages) {
    if (!desiredIds.has(existingMessage.id)) {
      await db.delete(messages).where(eq(messages.id, existingMessage.id));
    }
  }

  // Insert the new / edited messages coming from the client
  for (const newMessage of newMessages) {
    const existing = existingMessages.find((m) => m.id === newMessage.id);

    if (existing) {
      await db
        .update(messages)
        .set({
          content: newMessage.content,
          parts: newMessage.parts,
          experimental_attachments: newMessage.experimental_attachments,
          annotations: newMessage.annotations,
        })
        .where(eq(messages.id, newMessage.id));
    } else {
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
