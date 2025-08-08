import type { UIMessage } from 'ai';
import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { user } from './auth';

export const chats = pgTable(
  'chats',
  {
    id: text('id').primaryKey(),
    title: text('title').notNull(),
    userId: text('user_id')
      .references(() => user.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [
    index('idx_chats_user_id').on(t.userId),
    index('idx_chats_updated_at').on(t.updatedAt),
  ]
);

export type DbChat = typeof chats.$inferSelect;

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    chatId: text('chat_id')
      .references(() => chats.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    role: varchar().$type<UIMessage['role']>().notNull(),
    parts: jsonb().$type<UIMessage['parts']>().notNull(),
  },
  (t) => [
    index('idx_messages_chat_id').on(t.chatId),
    index('idx_messages_created_at').on(t.createdAt),
  ]
);

export type DbMessage = typeof messages.$inferSelect;

// TODO: Potentially add a separate table for parts instead of dumping everything into a jsonb
// https://github.com/vercel-labs/ai-sdk-persistence-db/blob/main/lib/db/schema.ts
