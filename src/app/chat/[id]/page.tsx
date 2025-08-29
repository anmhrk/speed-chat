import { fetchQuery } from 'convex/nextjs';
import { Suspense } from 'react';
import { ChatPage } from '@/components/chat-page';
import { api } from '@/convex/_generated/api';
import { getAuthToken } from '@/lib/auth/token';

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const token = await getAuthToken();

  const initialMessagesPromise = fetchQuery(
    api.chat.getMessages,
    {
      chatId: id,
    },
    {
      token,
    }
  );
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPage initialMessagesPromise={initialMessagesPromise} />
    </Suspense>
  );
}
