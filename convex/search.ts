import type { FunctionReturnType } from 'convex/server';
import { v } from 'convex/values';
import type { api } from './_generated/api';
import type { Doc, Id } from './_generated/dataModel';
import { query } from './_generated/server';
import { betterAuthComponent } from './auth';

export type SearchResult = FunctionReturnType<typeof api.search.searchAll>;

// Combined search for both chats and messages
export const searchAll = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await betterAuthComponent.getAuthUserId(ctx);

    if (!userId) {
      return null;
    }

    const limit = 20;
    const queryString = args.query.trim();

    // Search chats by title
    const chatResults = await ctx.db
      .query('chats')
      .withSearchIndex('by_title', (q) =>
        q.search('title', queryString).eq('userId', userId as Id<'users'>)
      )
      .take(limit);

    // We need to search messages for all chats for the user
    // So first collect all chatIds of the user to query the messages search index
    const allChatsForUser = await ctx.db
      .query('chats')
      .withIndex('by_user_id_and_updated_at', (q) =>
        q.eq('userId', userId as Id<'users'>)
      )
      .collect();

    const chatIdsNeeded = allChatsForUser.map((chat) => chat._id);

    const messageResults: Doc<'messages'>[] = [];

    for (const chatId of chatIdsNeeded) {
      const messages = await ctx.db
        .query('messages')
        .withSearchIndex('by_text_part', (q) =>
          q.search('text_part', queryString).eq('chatId', chatId)
        )
        .take(limit * 2);

      messageResults.push(...messages);
    }

    // Create a map for quick chat lookups
    const chatMap = new Map();
    for (const chat of allChatsForUser) {
      chatMap.set(chat._id, chat);
    }

    // Process messages
    const userMessages = messageResults.slice(0, limit).map((message) => {
      const { snippet, isHighlighted } = getHighlightContext(
        message.text_part,
        queryString
      );
      const chat = chatMap.get(message.chatId);
      return {
        type: 'message' as const,
        ...message,
        chatTitle: chat.title,
        chatId: chat.id,
        highlightSnippet: snippet,
        isHighlighted,
      };
    });

    // Combine and sort results by creation time (most recent first)
    const combinedResults = [
      ...chatResults.map((chat) => ({ type: 'chat' as const, ...chat })),
      ...userMessages,
    ].sort((a, b) => b._creationTime - a._creationTime);

    return combinedResults.slice(0, limit);
  },
});

// Helper function to extract highlight context around query match
const getHighlightContext = (
  text: string,
  queryString: string
): { snippet: string; isHighlighted: boolean } => {
  const lowerText = text.toLowerCase();
  const lowerQuery = queryString.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return {
      snippet: text.slice(0, 100) + (text.length > 100 ? '...' : ''),
      isHighlighted: false,
    };
  }

  const contextLength = 60; // Characters to show on each side
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + queryString.length + contextLength);

  let snippet = text.slice(start, end);

  // Add ellipsis if we truncated
  if (start > 0) snippet = `...${snippet}`;
  if (end < text.length) snippet += '...';

  return { snippet, isHighlighted: true };
};
