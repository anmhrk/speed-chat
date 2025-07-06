import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";
import { getRandomGreeting } from "@/lib/utils";

export default async function Home() {
  const user = await getUser();
  const name = user?.name.split(" ")[0];

  const randomGreeting = getRandomGreeting(name ?? "");

  return <ChatPage user={user} initialChatId="" greeting={randomGreeting} />;
}
