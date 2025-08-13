import { ChatPage } from "@/components/chat-page";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return <ChatPage userId={userId} />;
}
