import Dexie, { type EntityTable } from "dexie";
import type { Chat, Message } from "../drizzle/schema";

const localDb = new Dexie("ChatDB") as Dexie & {
  chats: EntityTable<Chat, "id">;
  messages: EntityTable<Message, "id">;
};

localDb.version(1).stores({
  chats: "id, title, createdAt, updatedAt, userId, isPinned",
  messages: "id, chatId, content, createdAt, role, parts",
});

export { localDb };
