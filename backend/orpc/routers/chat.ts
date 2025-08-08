import { ORPCError } from '@orpc/client';
import type { UIMessage } from 'ai';
import { and, asc, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { chats, messages as messagesTable } from '@/backend/db/schema';
import { protectedProcedure } from '../middleware';

export const chatRouter = {
  getChats: protectedProcedure.handler(async ({ context }) => {
    const { user, db } = context;

    return await db
      .select()
      .from(chats)
      .where(eq(chats.userId, user.id))
      .orderBy(desc(chats.updatedAt));
  }),
  getMessages: protectedProcedure
    .input(
      z.object({
        chatId: z.string(),
      })
    )
    .handler(async ({ context, input }) => {
      const { chatId } = input;
      const { user, db } = context;

      const result = await db
        .select({
          messageId: messagesTable.id,
          role: messagesTable.role,
          parts: messagesTable.parts,
          chatId: chats.id,
          chatUserId: chats.userId,
        })
        .from(chats)
        .leftJoin(messagesTable, eq(messagesTable.chatId, chats.id))
        .where(and(eq(chats.id, chatId), eq(chats.userId, user.id)))
        .orderBy(asc(messagesTable.createdAt));

      // If no results at all, chat doesn't exist or doesn't belong to user
      if (result.length === 0) {
        throw new ORPCError(`Chat ${chatId} not found`);
      }

      const messages = result.map((row) => ({
        id: row.messageId,
        role: row.role,
        parts: row.parts,
      }));

      return messages as UIMessage[];
    }),
};
