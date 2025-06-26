import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";

export default async function Home() {
  const user = await getUser();

  return <ChatPage user={user} initialChatId="" />;
}
