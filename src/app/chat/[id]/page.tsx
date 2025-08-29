import { fetchQuery } from 'convex/nextjs';
import { Suspense } from 'react';
import { ChatWrapper } from '@/components/chat-wrapper';
import { MessagesContainer } from '@/components/messages-container';
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
    <ChatWrapper>
      <Suspense
        fallback={
          <div className="mx-auto my-auto flex text-muted-foreground text-sm">
            Loading...
          </div>
        }
      >
        <MessagesContainer initialMessagesPromise={initialMessagesPromise} />
      </Suspense>
    </ChatWrapper>
  );
}
