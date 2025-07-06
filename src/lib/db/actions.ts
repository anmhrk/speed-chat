"use server";

import { getUser } from "../auth/get-user";
import { db } from ".";
import { chats, messages, memories, user as userTable } from "./schema";
import type { Message } from "ai";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { deleteFiles } from "../uploadthing";

// CHATS
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

  const chat = await db
    .select()
    .from(chats)
    .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
    .limit(1);

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
        })
        .where(eq(messages.id, newMessage.id));
    } else {
      await db.insert(messages).values({
        chatId,
        id: newMessage.id,
        content: newMessage.content,
        role: newMessage.role,
        parts: newMessage.parts,
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

async function deleteAllAttachments(
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

  const toolInvocationUrls = messagesToCheck.flatMap((message) =>
    message.parts?.map((part) =>
      part.type === "tool-invocation"
        ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (part.toolInvocation as any).result.imageUrl
        : null
    )
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

// CHAT ACTIONS
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
      id: `${message.id}-branch`,
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

// MEMORIES
export async function getMemories() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  return await db.select().from(memories).where(eq(memories.userId, user.id));
}

export async function addMemory(memory: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await db.insert(memories).values({
    id: crypto.randomUUID(),
    createdAt: new Date(),
    userId: user.id,
    memory,
  });
}

export async function deleteMemory(memoryId: string) {
  await db.delete(memories).where(eq(memories.id, memoryId));
}

// USER
export async function deleteUser() {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  await deleteAllAttachments("all", user.id);
  await db.delete(userTable).where(eq(userTable.id, user.id));
  // Everything else is deleted automatically due to cascade
}
