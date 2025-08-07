import type { ToolUIPart, UIMessage } from 'ai';
import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import type {
  MessageMetadata,
  searchWebToolInput,
  searchWebToolOutput,
} from '@/backend/orpc/routers/chat-stream';
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

export const messages = pgTable(
  'messages',
  {
    id: text('id').primaryKey(),
    chatId: text('chat_id')
      .references(() => chats.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    role: varchar().$type<UIMessage['role']>().notNull(),
  },
  (t) => [
    index('idx_messages_chat_id').on(t.chatId),
    index('idx_messages_created_at').on(t.createdAt),
  ]
);

export const parts = pgTable(
  'parts',
  {
    id: text('id')
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    messageId: text('message_id')
      .references(() => messages.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp().defaultNow().notNull(),
    order: integer().notNull().default(0),
    text_text: text(),
    reasoning_text: text(),
    file_mediaType: varchar(),
    file_url: varchar(),
    tool_toolCallId: varchar(),
    tool_state: varchar().$type<ToolUIPart['state']>(),
    tool_errorText: text(),
    tool_searchWeb_input: jsonb().$type<searchWebToolInput>(),
    tool_searchWeb_output: jsonb().$type<searchWebToolOutput>(),
    data_messageMetadata: jsonb().$type<MessageMetadata>(),
  },
  (t) => [
    index('idx_parts_message_id').on(t.messageId),
    index('idx_parts_created_at').on(t.createdAt),
  ]
);
