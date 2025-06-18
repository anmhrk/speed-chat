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
  }),

  chats: defineTable({
    chatId: v.string(),
    title: v.string(),
    userId: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        createdAt: v.number(),
      }),
    ),
  })
    .index("by_user_id", ["userId"])
    .index("by_chat_id", ["chatId"]),
});

export default schema;
