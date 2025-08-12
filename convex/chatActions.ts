import { mutation } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import { nanoid } from "nanoid";
import { Id } from "./_generated/dataModel";

export const branchOffFromMessage = mutation({
  args: {
    parentChatId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError("User not authenticated");
    }

    const branchChatId = nanoid();

    const parentChat = await ctx.db
      .query("chats")
      .withIndex("by_chat_id", (q) => q.eq("id", args.parentChatId))
      .first();

    if (!parentChat) {
      throw new ConvexError(`Chat ${args.parentChatId} not found`);
    }

    const parentMessages = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", parentChat._id))
      .collect();

    const messagesUntilMessageToBranch = parentMessages.slice(
      0,
      parentMessages.findIndex((m) => m.id === args.messageId) + 1
    );

    const branchChatConvexId = await ctx.db.insert("chats", {
      id: branchChatId,
      title: parentChat.title,
      userId: parentChat.userId,
      isBranch: true,
      isPinned: false,
      parentChatId: parentChat.id,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    });

    for (const message of messagesUntilMessageToBranch) {
      await ctx.db.insert("messages", {
        id: `${message.id}-branch-${branchChatId}`,
        chatId: branchChatConvexId,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
      });
    }

    return branchChatId;
  },
});

export const deleteMessages = mutation({
  args: {
    messageIdsToDelete: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const convexIdsToDelete: Id<"messages">[] = [];

    for (const messageId of args.messageIdsToDelete) {
      const message = await ctx.db
        .query("messages")
        .withIndex("by_message_id", (q) => q.eq("id", messageId))
        .first();

      if (message) {
        convexIdsToDelete.push(message._id);
      } else {
        throw new ConvexError(`Message ${messageId} not found`);
      }
    }

    for (const convexId of convexIdsToDelete) {
      await ctx.db.delete(convexId);
    }
  },
});

export const renameChatTitle = mutation({
  args: {
    chatId: v.string(),
    newTitle: v.string(),
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
      title: args.newTitle,
    });
  },
});

export const pinChat = mutation({
  args: {
    chatId: v.string(),
    isPinned: v.boolean(),
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
      isPinned: args.isPinned,
    });
  },
});

export const deleteChat = mutation({
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

    await ctx.db.delete(chat._id);

    const messagesToDelete = await ctx.db
      .query("messages")
      .withIndex("by_chat_id", (q) => q.eq("chatId", chat._id))
      .collect();

    for (const message of messagesToDelete) {
      await ctx.db.delete(message._id);
    }
  },
});
