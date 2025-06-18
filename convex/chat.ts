import { v, ConvexError } from "convex/values";
import { query, mutation, action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

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

    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .first();

    if (!chat) {
      return [];
    }

    if (chat.userId !== userId) {
      throw new ConvexError("Unauthorized");
    }

    return chat.messages;
  },
});

export const fetchThreads = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }

    const chats = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    return chats;
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

    const now = Date.now();
    await ctx.db.insert("chats", {
      chatId: args.chatId,
      title: "New Chat",
      userId: userId,
      createdAt: now,
      updatedAt: now,
      messages: [],
    });

    const usage = await ctx.db
      .query("usage")
      .filter((q) => q.eq(q.field("userId"), userId))
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
      const openrouter = createOpenAI({
        baseURL: "https://openrouter.ai/api/v1",
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
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
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
    messages: v.array(
      v.object({
        id: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        content: v.string(),
        reasoning: v.optional(v.string()),
        createdAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError("Chat not found");
    }

    await ctx.db.patch(chat._id, {
      messages: args.messages,
      updatedAt: Date.now(),
    });
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
      .filter((q) => q.eq(q.field("userId"), userId))
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
      .filter((q) => q.eq(q.field("userId"), userId))
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
      .filter((q) => q.eq(q.field("userId"), userId))
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
