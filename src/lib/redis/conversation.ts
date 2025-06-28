"use server";

import { set, get, del } from "./index";
import type { Message } from "ai";

// Store conversation state temporarily in Redis during streaming
export async function setConversationState(
  chatId: string,
  messages: Message[]
) {
  const key = `conversation:${chatId}`;
  const data = JSON.stringify({
    messages,
    timestamp: Date.now(),
  });

  console.log(
    `[Redis Conversation] Storing conversation state for chat: ${chatId}`
  );
  await set(key, data);

  // Set expiration for 1 hour (3600 seconds) in case of cleanup
  // Note: Our mock Redis doesn't support expiration, but real Redis would
}

export async function getConversationState(
  chatId: string
): Promise<Message[] | null> {
  const key = `conversation:${chatId}`;
  const data = await get(key);

  if (!data) {
    console.log(
      `[Redis Conversation] No conversation state found for chat: ${chatId}`
    );
    return null;
  }

  try {
    const parsed = JSON.parse(data);
    console.log(
      `[Redis Conversation] Retrieved conversation state for chat: ${chatId}`,
      {
        messageCount: parsed.messages.length,
        age: Date.now() - parsed.timestamp,
      }
    );
    return parsed.messages;
  } catch (error) {
    console.error(
      `[Redis Conversation] Failed to parse conversation state:`,
      error
    );
    return null;
  }
}

export async function clearConversationState(chatId: string) {
  const key = `conversation:${chatId}`;
  console.log(
    `[Redis Conversation] Clearing conversation state for chat: ${chatId}`
  );
  await del(key);
}
