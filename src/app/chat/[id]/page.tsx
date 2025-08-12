import { getAuthToken } from "@/lib/token";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { ChatPage } from "@/components/chat-page";
import { redirect } from "next/navigation";
import { MyUIMessage } from "@/lib/types";
import { Suspense } from "react";
import { Loader } from "@/components/loader";
import { auth } from "@clerk/nextjs/server";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  let initialMessages: Promise<MyUIMessage[]>;

  try {
    initialMessages = fetchQuery(
      api.chat.getMessages,
      {
        chatId: id,
      },
      {
        token: await getAuthToken(),
      }
    );
  } catch (error) {
    console.error(error);
    redirect("/");
  }

  return (
    <Suspense fallback={<Loader userId={userId} chatId={id} />}>
      <ChatPage userId={userId} initialMessagesPromise={initialMessages} />
    </Suspense>
  );
}
