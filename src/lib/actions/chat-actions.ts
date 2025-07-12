"use server";

import { db } from "../db";
import { chats, messages } from "../db/schema";
import { eq } from "drizzle-orm";
import { getUser, deleteAllAttachments } from ".";

export async function deleteChat(chatId: string) {
  await deleteAllAttachments("single", undefined, chatId);
  await db.delete(chats).where(eq(chats.id, chatId));
}

export async function renameChatTitle(chatId: string, newTitle: string) {
  await db.update(chats).set({ title: newTitle }).where(eq(chats.id, chatId));
}

export async function pinChat(chatId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  await db
    .update(chats)
    .set({ isPinned: !chat.isPinned })
    .where(eq(chats.id, chatId));
}

export async function branchOffChat(parentChatId: string, newChatId: string) {
  const [parentChat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, parentChatId))
    .limit(1);

  const parentChatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, parentChatId));

  await db.insert(chats).values({
    id: newChatId,
    title: parentChat.title,
    userId: parentChat.userId,
    isBranched: true,
    parentChatId,
  });

  await db.insert(messages).values(
    parentChatMessages.map((message) => ({
      ...message,
      id: `${message.id}-branch-${crypto.randomUUID()}`,
      chatId: newChatId,
    }))
  );
}

// Just like branchOffChat but the new chatId's userId is the current user's id instead of the prev chat's userId
export async function forkChat(sharedChatId: string, newChatId: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, sharedChatId))
    .limit(1);

  const chatMessages = await db
    .select()
    .from(messages)
    .where(eq(messages.chatId, sharedChatId));

  await db.insert(chats).values({
    id: newChatId,
    title: chat.title,
    userId: user.id,
  });

  await db.insert(messages).values(
    chatMessages.map((message) => ({
      ...message,
      id: `${message.id}-fork-${crypto.randomUUID()}`,
      chatId: newChatId,
    }))
  );
}

export async function shareChat(chatId: string) {
  const [chat] = await db
    .select()
    .from(chats)
    .where(eq(chats.id, chatId))
    .limit(1);

  await db
    .update(chats)
    .set({ isShared: !chat.isShared })
    .where(eq(chats.id, chatId));
}
