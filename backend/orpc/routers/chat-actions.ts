import { desc, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import type { DbMessage } from '../../db/schema';
import { chats, messages } from '../../db/schema';
import { protectedProcedure } from '../middleware';

export const chatActionsRouter = {
  branchOffFromMessage: protectedProcedure
    .input(
      z.object({
        parentChatId: z.string(),
        messageId: z.string(),
      })
    )
    .handler(async ({ context, input }) => {
      const { parentChatId, messageId } = input;
      const { db } = context;

      const branchChatId = crypto.randomUUID();

      const joinedRows = await db
        .select()
        .from(chats)
        .leftJoin(messages, eq(messages.chatId, chats.id))
        .where(eq(chats.id, parentChatId))
        .orderBy(desc(messages.createdAt));

      const parentChat = joinedRows[0]?.chats;
      if (!parentChat) {
        throw new Error('Parent chat not found');
      }

      const parentChatMessages = joinedRows
        .map((row) => row.messages)
        .filter((m): m is DbMessage => Boolean(m));

      const messagesUntilMessageToBranch = parentChatMessages.slice(
        parentChatMessages.findIndex((m) => m.id === messageId)
      );

      await db.insert(chats).values({
        ...parentChat,
        id: branchChatId,
        isBranch: true,
        parentChatId,
      });

      await db.insert(messages).values(
        messagesUntilMessageToBranch.map((message) => ({
          ...message,
          id: `${message.id}-branch-${branchChatId}`,
          chatId: branchChatId,
        }))
      );

      return branchChatId;
    }),

  deleteMessages: protectedProcedure
    .input(
      z.object({
        messageIdsToDelete: z.array(z.string()),
      })
    )
    .handler(async ({ context, input }) => {
      const { messageIdsToDelete } = input;
      const { db } = context;

      await db.delete(messages).where(inArray(messages.id, messageIdsToDelete));
    }),
};
