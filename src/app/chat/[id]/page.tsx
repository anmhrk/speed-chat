import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";
import { ChatPage } from "@/components/chat-page";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { chats, messages } from "@/lib/db/schema";
import type { Message } from "ai";
import { Suspense } from "react";
import type { User } from "better-auth";

async function ChatWithMessages({ id, user }: { id: string; user: User }) {
  const chat = await db.query.chats.findFirst({
    where: and(eq(chats.id, id), eq(chats.userId, user.id)),
  });

  let error = "";
  let initialMessages: Message[] = [];

  if (!chat) {
    error = `Chat ${id} not found`;
  } else {
    initialMessages = (await db.query.messages.findMany({
      where: eq(messages.chatId, id),
      orderBy: [asc(messages.createdAt)],
    })) as Message[];
  }

  return (
    <ChatPage user={user} initialMessages={initialMessages} error={error} />
  );
}

function ChatPageFallback({ user }: { user: User }) {
  return <ChatPage user={user} isLoading={true} />;
}

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <Suspense fallback={<ChatPageFallback user={user} />}>
      <ChatWithMessages id={id} user={user} />
    </Suspense>
  );
}
