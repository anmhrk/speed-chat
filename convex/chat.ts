import { ConvexError, v } from "convex/values";
import { action, internalMutation, mutation, query } from "./_generated/server";
import { MyUIMessage } from "@/lib/types";
import { createGateway } from "@ai-sdk/gateway";
import { convertToModelMessages, generateText } from "ai";
import { titleGenPrompt } from "@/lib/prompts";
import { internal } from "./_generated/api";

export const getChats = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("chats")
      .withIndex("by_user_id_and_updated_at", (q) =>
        q.eq("userId", identity.tokenIdentifier)
      )
      .order("desc")
      .collect();
  },
});

export const getMessages = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chat_id_and_user_id", (q) =>
        q.eq("id", args.chatId).eq("userId", identity.tokenIdentifier)
      )
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chat._id))
      .collect();

    return messages.map((message) => {
      return {
        id: message.id,
        role: message.role,
        metadata: message.metadata,
        parts: message.parts,
      };
    }) as MyUIMessage[];
  },
});

export const createChat = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }

    await ctx.db.insert("chats", {
      id: args.chatId,
      userId: identity.tokenIdentifier,
      title: "New Chat",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBranch: false,
      isPinned: false,
    });
  },
});

export const generateChatTitle = action({
  args: {
    chatId: v.string(),
    apiKey: v.string(),
    messages: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const gateway = createGateway({
      apiKey: args.apiKey,
    });

    const response = await generateText({
      model: gateway("openai/gpt-oss-120b"),
      system: titleGenPrompt,
      providerOptions: {
        gateway: {
          only: ["cerebras"],
        },
      },
      messages: convertToModelMessages(args.messages as MyUIMessage[]),
    });

    if (response.text) {
      await ctx.runMutation(internal.chat.updateChatTitle, {
        chatId: args.chatId,
        title: response.text,
      });
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
      .withIndex("by_chat_id", (q) => q.eq("id", args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    await ctx.db.patch(chat._id, {
      title: args.title,
    });
  },
});

export const upsertMessages = mutation({
  args: {
    chatId: v.string(),
    messages: v.array(
      v.object({
        id: v.string(),
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
        parts: v.array(v.any()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chat_id", (q) => q.eq("id", args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    for (const message of args.messages as MyUIMessage[]) {
      const existingMessage = await ctx.db
        .query("messages")
        .withIndex("by_message_id", (q) => q.eq("id", message.id))
        .first();

      if (existingMessage) {
        await ctx.db.patch(existingMessage._id, {
          ...message,
        });
      } else {
        await ctx.db.insert("messages", {
          ...message,
          text_part: message.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(" "),
          chatId: chat._id,
        });
      }
    }
  },
});

// Could put this in upsertMessages but it would be too late for the UI update if it was in onFinish
// So now we can call this right at the start for sub instant update
export const updateChatUpdatedAt = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query("chats")
      .withIndex("by_chat_id", (q) => q.eq("id", args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    await ctx.db.patch(chat._id, {
      updatedAt: Date.now(),
    });
  },
});
