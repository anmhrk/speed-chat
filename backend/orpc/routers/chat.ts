import type { UIMessage } from 'ai';
import { asc, desc, eq } from 'drizzle-orm';
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
      const { db } = context;

      return (await db
        .select({
          id: messagesTable.id,
          role: messagesTable.role,
          parts: messagesTable.parts,
        })
        .from(messagesTable)
        .where(eq(messagesTable.chatId, chatId))
        .orderBy(asc(messagesTable.createdAt))) satisfies UIMessage[];
    }),
};
