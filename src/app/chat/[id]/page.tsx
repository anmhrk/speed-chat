import { getUser } from "@/lib/actions";
import { redirect } from "next/navigation";
import { ChatPage } from "@/components/chat-page";

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

  return <ChatPage user={user} initialChatId={id} />;
}
