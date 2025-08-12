import { ChatPage } from "@/components/chat-page";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";

export default async function Home() {
  const user = await fetchQuery(
    api.user.currentUser,
    {},
    {
      token: await convexAuthNextjsToken(),
    }
  );

  const initialMessages = await fetchQuery(
    api.chat.getMessages,
    {
      chatId: "",
    },
    {
      token: await convexAuthNextjsToken(),
    }
  );

  return <ChatPage user={user} initialMessages={initialMessages ?? []} />;
}
