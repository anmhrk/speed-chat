"use server";

import { getUser } from "./auth/get-user";
import { db } from "./db";
import { chats, messages, user as userTable } from "./db/schema";
import type { Message } from "ai";
import { and, asc, desc, eq } from "drizzle-orm";

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

export async function getMessages(chatId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, chatId), eq(chats.userId, user.id)),
  });

  if (!chat) {
    throw new Error(`Chat ${chatId} not found`);
  }

  const allMessages = (await db.query.messages.findMany({
    where: eq(messages.chatId, chatId),
    orderBy: [asc(messages.createdAt)],
  })) as Message[];

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

export async function saveMessages(
  chatId: string,
  messageIds: string[],
  newMessages: Message[]
) {
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
          id: newMessage.id,
          content: newMessage.content,
          role: newMessage.role,
          parts: newMessage.parts,
          createdAt: newMessage.createdAt
            ? new Date(newMessage.createdAt)
            : new Date(),
        });
      }
    }

    await tx
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId));
  });
}

export async function deleteAllChats() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.delete(chats).where(eq(chats.userId, user.id));
}

export async function deleteChat(chatId: string) {
  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function renameChatTitle(chatId: string, newTitle: string) {
  await db.update(chats).set({ title: newTitle }).where(eq(chats.id, chatId));
}

export async function handlePinChat(chatId: string, isPinned: boolean) {
  await db
    .update(chats)
    .set({ isPinned: !isPinned })
    .where(eq(chats.id, chatId));
}

export async function deleteUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.delete(userTable).where(eq(userTable.id, user.id));
  // Everything else is deleted automatically due to cascade
}
