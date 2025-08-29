import { ChatWrapper } from '@/components/chat-wrapper';
import { MessagesContainer } from '@/components/messages-container';

export default function Home() {
  return (
    <ChatWrapper>
      <MessagesContainer initialMessagesPromise={Promise.resolve([])} />
    </ChatWrapper>
  );
}
