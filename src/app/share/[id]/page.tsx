import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";
import { verifySharedChat } from "@/lib/db/actions";
import { redirect } from "next/navigation";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  const { success, didUserCreate } = await verifySharedChat(id, user?.id ?? "");

  if (!success) {
    redirect("/");
  }

  return (
    <ChatPage
      user={user}
      initialChatId={id}
      isOnSharedPage={true}
      didUserCreate={didUserCreate}
    />
  );
}
