import { ConvexError, v } from 'convex/values';
import { nanoid } from 'nanoid';
import type { MyUIMessage } from '@/lib/types';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { internalMutation, mutation } from './_generated/server';
import { betterAuthComponent } from './auth';

export const branchOffFromMessage = mutation({
  args: {
    parentChatId: v.string(),
    messageId: v.string(),
  },
  handler: async (ctx, args) => {
    const branchChatId = nanoid();

    const parentChat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.parentChatId))
      .first();

    if (!parentChat) {
      throw new ConvexError(`Chat ${args.parentChatId} not found`);
    }

    const parentMessages = await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', parentChat._id))
      .collect();

    const messagesUntilMessageToBranch = parentMessages.slice(
      0,
      parentMessages.findIndex((m) => m.id === args.messageId) + 1
    );

    const branchChatConvexId = await ctx.db.insert('chats', {
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
      await ctx.db.insert('messages', {
        id: `${message.id}-branch-${branchChatId}`,
        chatId: branchChatConvexId,
        text_part: message.text_part,
        role: message.role,
        parts: message.parts,
        metadata: message.metadata,
      });
    }

    return branchChatId;
  },
});

export const renameChatTitle = mutation({
  args: {
    chatId: v.string(),
    newTitle: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
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
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    await ctx.db.patch(chat._id, {
      isPinned: args.isPinned,
    });
  },
});

/**
 * DELETE ACTIONS
 */

export const deleteMessages = mutation({
  args: {
    messageIdsToDelete: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const convexIdsToDelete: Id<'messages'>[] = [];

    for (const messageId of args.messageIdsToDelete) {
      const message = await ctx.db
        .query('messages')
        .withIndex('by_message_id', (q) => q.eq('id', messageId))
        .first();

      if (message) {
        convexIdsToDelete.push(message._id);

        await ctx.runMutation(
          internal.chatActions.deleteAttachmentsFromMessage,
          {
            messageParts: message.parts,
          }
        );
      } else {
        throw new ConvexError(`Message ${messageId} not found`);
      }
    }

    for (const convexId of convexIdsToDelete) {
      await ctx.db.delete(convexId);
    }
  },
});

export const deleteAttachmentsFromMessage = internalMutation({
  args: {
    messageParts: v.array(v.any()),
  },
  handler: async (ctx, args) => {
    const parts = args.messageParts as MyUIMessage['parts'];
    const attachmentUrls = parts.flatMap((p) => {
      if (p.type === 'file' && p.url) {
        return [p.url];
      }
      return [];
    });

    for (const attachmentUrl of attachmentUrls) {
      const attachment = await ctx.db
        .query('attachments')
        .withIndex('by_url', (q) => q.eq('url', attachmentUrl))
        .first();

      if (attachment) {
        await ctx.db.delete(attachment._id);
        await ctx.storage.delete(attachment.id);
      }
    }
  },
});

export const deleteChat = mutation({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    await ctx.db.delete(chat._id);

    const messagesToDelete = await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', chat._id))
      .collect();

    for (const message of messagesToDelete) {
      await ctx.runMutation(internal.chatActions.deleteAttachmentsFromMessage, {
        messageParts: message.parts,
      });
      await ctx.db.delete(message._id);
    }
  },
});

export const deleteUserData = mutation({
  handler: async (ctx) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);

    if (!userId) {
      throw new ConvexError('User not authenticated');
    }

    const chats = await ctx.db
      .query('chats')
      .withIndex('by_user_id_and_updated_at', (q) =>
        q.eq('userId', userId as Id<'users'>)
      )
      .collect();

    for (const chat of chats) {
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_chat_id', (q) => q.eq('chatId', chat._id))
        .collect();

      for (const message of messages) {
        await ctx.db.delete(message._id);
      }

      await ctx.db.delete(chat._id);
    }

    const attachments = await ctx.db
      .query('attachments')
      .withIndex('by_user_id', (q) => q.eq('userId', userId as Id<'users'>))
      .collect();

    for (const attachment of attachments) {
      await ctx.db.delete(attachment._id);
      await ctx.storage.delete(attachment.id);
    }
  },
});
