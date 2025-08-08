import { redirect } from 'next/navigation';
import { getUser } from '@/backend/auth/get-user';
import { ChatWrapper } from '@/components/chat-wrapper';
import { Messages } from '@/components/messages';

export default async function ChatPage() {
  const user = await getUser();

  if (!user) {
    redirect('/');
  }

  return (
    <ChatWrapper user={user}>
      <Messages />
    </ChatWrapper>
  );
}
