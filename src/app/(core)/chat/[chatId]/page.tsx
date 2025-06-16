import { ChatPage } from "@/components/ChatPage";
import { getUser } from "@/lib/auth/get-user";
import { redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ chatId: string }>;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const { chatId } = await params;

  return <ChatPage initialChatId={chatId} user={user} />;
}
