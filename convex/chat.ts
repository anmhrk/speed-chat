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

    const chat = await ctx.db
      .query("chats")
      .filter((q) => q.eq(q.field("chatId"), args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError("Chat not found");
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
        prompt: `Generate a concise and descriptive title (max 6 words) for this chat based on the user's message.
              User message: ${args.prompt}
              
              Return only the title, no quotes or extra text.`,
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
