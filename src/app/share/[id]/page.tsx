import { ChatPage } from "@/components/chat-page";
import { getUser } from "@/lib/auth/get-user";
import { verifySharedChat } from "@/lib/db/actions";
import { redirect } from "next/navigation";
import { Suspense } from "react";

export default async function SharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUser();

  if (!user) {
    redirect("/");
  }

  const { success, didUserCreate } = await verifySharedChat(id, user.id);

  if (!success) {
    redirect("/");
  }

  return (
    <ChatPage
      user={user}
      initialChatId={id}
      isShared={true}
      didUserCreate={didUserCreate}
    />
  );
}
