import { FunctionReturnType } from "convex/server";
import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

export type SearchResult = FunctionReturnType<typeof api.search.searchAll>;

// Combined search for both chats and messages
export const searchAll = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (identity === null) {
      throw new Error("Not authenticated");
    }

    const userId = identity.tokenIdentifier;
    const limit = 20;
    const query = args.query.trim();

    // Search chats by title
    const chatResults = await ctx.db
      .query("chats")
      .withSearchIndex("by_title", (q) =>
        q.search("title", query).eq("userId", userId)
      )
      .take(limit);

    // We need to search messages for all chats for the user
    // So first collect all chatIds of the user to query the messages search index
    const allChatsForUser = await ctx.db
      .query("chats")
      .withIndex("by_user_id_and_updated_at", (q) => q.eq("userId", userId))
      .collect();

    const chatIdsNeeded = allChatsForUser.map((chat) => chat._id);

    const messageResults: Doc<"messages">[] = [];

    for (const chatId of chatIdsNeeded) {
      const messages = await ctx.db
        .query("messages")
        .withSearchIndex("by_text_part", (q) =>
          q.search("text_part", query).eq("chatId", chatId)
        )
        .take(limit * 2);

      messageResults.push(...messages);
    }

    // Create a map for quick chat lookups
    const chatMap = new Map();
    allChatsForUser.forEach((chat) => {
      chatMap.set(chat._id, chat);
    });

    // Process messages
    const userMessages = messageResults.slice(0, limit).map((message) => {
      const { snippet, isHighlighted } = getHighlightContext(
        message.text_part,
        query
      );
      const chat = chatMap.get(message.chatId);
      return {
        type: "message" as const,
        ...message,
        chatTitle: chat.title,
        chatId: chat.id,
        highlightSnippet: snippet,
        isHighlighted,
      };
    });

    // Combine and sort results by creation time (most recent first)
    const combinedResults = [
      ...chatResults.map((chat) => ({ type: "chat" as const, ...chat })),
      ...userMessages,
    ].sort((a, b) => b._creationTime - a._creationTime);

    return combinedResults.slice(0, limit);
  },
});

// Helper function to extract highlight context around query match
const getHighlightContext = (
  text: string,
  query: string
): { snippet: string; isHighlighted: boolean } => {
  const lowerText = text.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const index = lowerText.indexOf(lowerQuery);

  if (index === -1) {
    return {
      snippet: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
      isHighlighted: false,
    };
  }

  const contextLength = 60; // Characters to show on each side
  const start = Math.max(0, index - contextLength);
  const end = Math.min(text.length, index + query.length + contextLength);

  let snippet = text.slice(start, end);

  // Add ellipsis if we truncated
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return { snippet, isHighlighted: true };
};
