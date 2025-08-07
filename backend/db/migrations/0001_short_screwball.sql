CREATE TABLE "chats" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" text PRIMARY KEY NOT NULL,
	"chat_id" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"role" varchar NOT NULL,
	"parts" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "parts" (
	"id" text PRIMARY KEY NOT NULL,
	"message_id" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"order" integer DEFAULT 0 NOT NULL,
	"text_text" text,
	"reasoning_text" text,
	"file_mediaType" varchar,
	"file_url" varchar,
	"tool_toolCallId" varchar,
	"tool_state" varchar,
	"tool_errorText" varchar,
	"tool_searchWeb_input" jsonb,
	"tool_searchWeb_output" jsonb,
	"data_messageMetadata" jsonb,
	"providerMetadata" jsonb
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "parts" ADD CONSTRAINT "parts_message_id_messages_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_chats_user_id" ON "chats" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_chats_updated_at" ON "chats" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "idx_messages_chat_id" ON "messages" USING btree ("chat_id");--> statement-breakpoint
CREATE INDEX "idx_messages_created_at" ON "messages" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_parts_message_id" ON "parts" USING btree ("message_id");--> statement-breakpoint
CREATE INDEX "idx_parts_created_at" ON "parts" USING btree ("createdAt");