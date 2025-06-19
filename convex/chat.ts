import { v, ConvexError } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText } from "ai";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";

export const fetchMessages = query({
  args: { chatId: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    if (!args.chatId || args.chatId.trim() === "") {
      return [];
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();

    return messages;
  },
});

export const fetchThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const threads = await ctx.db
      .query("chats")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .order("desc")
      .collect();

    return threads;
  },
});

export const createInitialChat = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    await ctx.db.insert("chats", {
      chatId: args.chatId,
      title: "New Chat",
      userId: userId,
      updatedAt: Date.now(),
    });

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!usage) {
      await ctx.db.insert("usage", {
        userId: userId,
        promptTokens: 0,
        completionTokens: 0,
        chatsCreated: 1,
        messagesSent: 0,
      });
    } else {
      await ctx.db.patch(usage._id, {
        chatsCreated: usage.chatsCreated + 1,
      });
    }
  },
});

export const generateThreadTitle = action({
  args: {
    chatId: v.string(),
    prompt: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    try {
      const openrouter = createOpenRouter({
        apiKey: process.env.OPENROUTER_API_KEY,
      });

      const response = await generateText({
        model: openrouter("google/gemini-2.5-flash-preview-05-20"),
        prompt: `
        Your job is to create concise, descriptive titles for chat conversations based on the user's first message. 
        
        <rules>
        - Generate titles that are 5-6 words maximum
        - Make titles descriptive and specific to the topic
        - Use clear, professional language
        - Avoid generic titles like "Chat" or "Conversation"
        - Focus on the main subject or task being discussed
        - Use title case formatting
        - Do not include quotation marks or special formatting
        </rules>

        <examples>
        - "React Component State Management Help"
        - "Python Data Analysis Tutorial"
        - "Database Schema Design Discussion"
        - "API Integration Troubleshooting"
        </examples>

        <user_message>
        ${args.prompt}
        </user_message>

        Generate and return only the title text, nothing else.
        `,
      });

      await ctx.runMutation(internal.chat.updateChatTitle, {
        chatId: args.chatId,
        title: response.text,
      });

      return response.text;
    } catch (error) {
      console.error("[Generate Thread Title] Error:", error);
      throw error;
    }
  },
});

export const updateChatTitle = internalMutation({
  args: {
    chatId: v.string(),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError("Chat not found");
    }

    await ctx.db.patch(chat._id, {
      title: args.title,
      updatedAt: Date.now(),
    });
  },
});

export const updateChatMessages = mutation({
  args: {
    chatId: v.string(),
    messageIds: v.array(v.string()),
    newMessages: v.array(
      v.object({
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
      }),
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", args.chatId))
      .collect();

    const desiredIds = new Set<string>([
      ...args.messageIds,
      ...args.newMessages.map((m) => m.id),
    ]);

    // Delete messages that exist in the DB but are no longer present on the client
    // Need to keep client and db in sync
    for (const dbMsg of messages) {
      if (!desiredIds.has(dbMsg.id)) {
        await ctx.db.delete(dbMsg._id);
      }
    }

    // Upsert the new / edited messages coming from the client
    for (const newMsg of args.newMessages) {
      const existing = messages.find((m) => m.id === newMsg.id);

      if (existing) {
        // Update message if content or reasoning changed
        await ctx.db.patch(existing._id, {
          content: newMsg.content,
          parts: newMsg.parts,
          createdAt: newMsg.createdAt,
          role: newMsg.role,
        });
      } else {
        // Insert brand-new message
        await ctx.db.insert("messages", {
          chatId: args.chatId,
          ...newMsg,
        });
      }
    }
  },
});

export const updateUsage = mutation({
  args: {
    promptTokens: v.number(),
    completionTokens: v.number(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!usage) {
      throw new ConvexError("Usage not found");
    }

    await ctx.db.patch(usage._id, {
      promptTokens: usage.promptTokens + args.promptTokens,
      completionTokens: usage.completionTokens + args.completionTokens,
      messagesSent: usage.messagesSent + 1,
    });
  },
});

export const fetchUsage = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    return usage;
  },
});

export const resetUsage = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new ConvexError("Not authenticated");
    }

    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_id", (q) => q.eq("userId", userId))
      .first();

    if (!usage) {
      throw new ConvexError("Usage not found");
    }

    await ctx.db.patch(usage._id, {
      promptTokens: 0,
      completionTokens: 0,
      chatsCreated: 0,
      messagesSent: 0,
    });
  },
});
