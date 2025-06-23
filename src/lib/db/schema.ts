import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const chats = pgTable("chats", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});
