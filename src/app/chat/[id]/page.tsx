import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ChatPage } from "@/components/chat-page";
import { redirect } from "next/navigation";
import { MyUIMessage } from "@/lib/types";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await fetchQuery(
    api.user.currentUser,
    {},
    {
      token: await convexAuthNextjsToken(),
    }
  );

  let initialMessages: MyUIMessage[] = [];

  try {
    initialMessages = await fetchQuery(
      api.chat.getMessages,
      {
        chatId: id,
      },
      {
        token: await convexAuthNextjsToken(),
      }
    );
  } catch (error) {
    console.error(error);
    redirect("/");
  }

  return <ChatPage user={user} initialMessages={initialMessages} />;
}
