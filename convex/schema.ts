import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  usage: defineTable({
    userId: v.id("users"),
    promptTokens: v.number(),
    completionTokens: v.number(),
    chatsCreated: v.number(),
    messagesSent: v.number(),
  }).index("by_user_id", ["userId"]),

  chats: defineTable({
    chatId: v.string(),
    title: v.string(),
    userId: v.id("users"),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_chat_id", ["chatId"]),

  messages: defineTable({
    chatId: v.string(),
    id: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    createdAt: v.number(),
    parts: v.array(
      v.union(
        v.object({
          type: v.literal("text"),
          text: v.string(),
        }),
        v.object({
          type: v.literal("reasoning"),
          reasoning: v.string(),
        }),
      ),
    ),
  }).index("by_chat_id", ["chatId"]),
});

export default schema;
