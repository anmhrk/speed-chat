import { createGateway } from '@ai-sdk/gateway';
import { convertToModelMessages, generateText } from 'ai';
import { ConvexError, v } from 'convex/values';
import { titleGenPrompt } from '@/lib/prompts';
import type { MyUIMessage } from '@/lib/types';
import { internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { action, internalMutation, mutation, query } from './_generated/server';
import { betterAuthComponent } from './auth';

export const getChats = query({
  handler: async (ctx) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query('chats')
      .withIndex('by_user_id_and_updated_at', (q) =>
        q.eq('userId', userId as Id<'users'>)
      )
      .order('desc')
      .collect();
  },
});

export const getChatById = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    return await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) =>
        q.eq('id', args.chatId).eq('userId', userId as Id<'users'>)
      )
      .first();
  },
});

export const updateChatActiveStreamId = mutation({
  args: {
    chatId: v.string(),
    activeStreamId: v.string(),
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
      activeStreamId: args.activeStreamId,
    });
  },
});

export const getMessages = query({
  args: {
    chatId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      return [];
    }

    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id_and_user_id', (q) =>
        q.eq('id', args.chatId).eq('userId', userId as Id<'users'>)
      )
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat_id', (q) => q.eq('chatId', chat._id))
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
    userMessage: v.any(),
  },
  handler: async (ctx, args) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);
    if (!userId) {
      return null;
    }

    const userMessage = args.userMessage as MyUIMessage;

    const chatId = await ctx.db.insert('chats', {
      id: args.chatId,
      userId: userId as Id<'users'>,
      title: 'New Chat',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isBranch: false,
      isPinned: false,
    });

    await ctx.runMutation(internal.chat.upsertMessage, {
      chatId,
      message: userMessage,
    });
  },
});

export const generateChatTitle = action({
  args: {
    chatId: v.string(),
    apiKey: v.string(),
    userMessage: v.any(),
  },
  handler: async (ctx, args) => {
    const gateway = createGateway({
      apiKey: args.apiKey,
    });

    const response = await generateText({
      model: gateway('openai/gpt-oss-120b'),
      system: titleGenPrompt,
      providerOptions: {
        gateway: {
          only: ['cerebras'],
        },
      },
      messages: convertToModelMessages([args.userMessage as MyUIMessage]),
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
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    await ctx.db.patch(chat._id, {
      title: args.title,
    });
  },
});

export const upsertMessageWrapper = mutation({
  args: {
    chatId: v.string(),
    message: v.any(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    await ctx.runMutation(internal.chat.upsertMessage, {
      chatId: chat._id,
      message: args.message,
    });

    // Reset the active stream ID just in case, it already gets reset in updateChatUpdatedAt at the start of the stream
    await ctx.db.patch(chat._id, {
      activeStreamId: undefined,
    });
  },
});

export const upsertMessage = internalMutation({
  args: {
    chatId: v.id('chats'),
    message: v.any(),
  },
  handler: async (ctx, args) => {
    const message = args.message as MyUIMessage;

    const existingMessage = await ctx.db
      .query('messages')
      .withIndex('by_message_id', (q) => q.eq('id', message.id))
      .first();

    if (existingMessage) {
      await ctx.db.patch(existingMessage._id, {
        ...message,
      });
    } else {
      await ctx.db.insert('messages', {
        ...message,
        text_part: message.parts
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join(' '),
        chatId: args.chatId,
      });
    }
  },
});

export const updateChat = mutation({
  args: {
    chatId: v.string(),
    userMessage: v.any(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db
      .query('chats')
      .withIndex('by_chat_id', (q) => q.eq('id', args.chatId))
      .first();

    if (!chat) {
      throw new ConvexError(`Chat ${args.chatId} not found`);
    }

    const userMessage = args.userMessage as MyUIMessage;

    await ctx.runMutation(internal.chat.upsertMessage, {
      chatId: chat._id,
      message: userMessage,
    });

    await ctx.db.patch(chat._id, {
      updatedAt: Date.now(),
      // Reset the active stream ID when the chat is updated
      activeStreamId: undefined,
    });
  },
});
