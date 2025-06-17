import { ChatPage } from "@/components/ChatPage";
import { api } from "../../../../../convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const preloadedUser = await preloadQuery(
    api.auth.getCurrentUser,
    {},
    { token: await convexAuthNextjsToken() },
  );

  const { chatId } = await params;

  return <ChatPage initialChatId={chatId} preloadedUser={preloadedUser} />;
}
