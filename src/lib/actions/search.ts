"use server";

import { db } from "../db";
import { chats, messages } from "../db/schema";
import { getUser } from ".";
import { and, inArray, ilike, desc, eq } from "drizzle-orm";

export async function searchChats(query: string) {
  const user = await getUser();
  if (!user) {
    throw new Error("Unauthorized");
  }

  const userChats = await db
    .select()
    .from(chats)
    .where(eq(chats.userId, user.id))
    .orderBy(desc(chats.updatedAt));

  const chatIds = userChats.map((chat) => chat.id);
  const pattern = `%${query}%`;

  const matchedMessages = await db
    .select({
      id: messages.id,
      chatId: messages.chatId,
      content: messages.content,
      role: messages.role,
      createdAt: messages.createdAt,
    })
    .from(messages)
    .where(
      and(inArray(messages.chatId, chatIds), ilike(messages.content, pattern))
    )
    .orderBy(desc(messages.createdAt));

  // Group messages by chat for quick lookup
  const messagesByChat = matchedMessages.reduce(
    (acc, message) => {
      if (!acc[message.chatId]) {
        acc[message.chatId] = [];
      }
      acc[message.chatId].push(message);
      return acc;
    },
    {} as Record<string, typeof matchedMessages>
  );

  const searchResults = [];
  const lowerQuery = query.toLowerCase();

  for (const chat of userChats) {
    // Only consider messages that already matched in SQL
    const chatMessages = messagesByChat[chat.id] || [];

    // Check if chat title matches
    const titleMatch = chat.title.toLowerCase().includes(lowerQuery);

    // chatMessages are already matching, we just need the newest three
    const matchingMessages = chatMessages.slice(0, 3);

    if (titleMatch || matchingMessages.length > 0) {
      searchResults.push({
        chat,
        matchingMessages: matchingMessages,
        titleMatch,
      });
    }
  }

  return searchResults;
}
