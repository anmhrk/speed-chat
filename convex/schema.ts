import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const schema = defineSchema({
  chats: defineTable({
    id: v.string(),
    title: v.string(),
    userId: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    isBranch: v.boolean(),
    isPinned: v.boolean(),
    parentChatId: v.optional(v.string()),
  })
    .index("by_chat_id", ["id"])
    .index("by_chat_id_and_user_id", ["id", "userId"])
    .index("by_user_id_and_updated_at", ["userId", "updatedAt"]),

  messages: defineTable({
    id: v.string(),
    chatId: v.id("chats"),
    metadata: v.optional(
      v.object({
        modelName: v.string(),
        tps: v.number(),
        ttft: v.number(),
        elapsedTime: v.number(),
        completionTokens: v.number(),
        reasoningDuration: v.optional(v.number()),
      })
    ),
    role: v.union(
      v.literal("system"),
      v.literal("user"),
      v.literal("assistant")
    ),
    parts: v.array(v.any()), // typing this as any array, will type it when fetching messages instead using MyUIMessage
  })
    .index("by_chat_id", ["chatId"])
    .index("by_message_id", ["id"]),

  attachments: defineTable({
    id: v.id("_storage"),
    url: v.string(),
  }).index("by_url", ["url"]),
});

export default schema;
