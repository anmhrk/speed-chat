'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './ai-elements/conversation';
import { Message, MessageContent } from './ai-elements/message';
import { useCustomChat } from './providers/chat-provider';

export function Messages() {
  const { messages } = useCustomChat();
  console.log('messages', messages);

  return (
    <Conversation className="mx-auto h-full w-full max-w-3xl">
      <ConversationContent>
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {message.parts.map((part, i) => {
                switch (part.type) {
                  case 'text':
                    return <p key={`${message.id}-${i}`}>{part.text}</p>;
                  default:
                    return null;
                }
              })}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
