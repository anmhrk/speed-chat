'use client';

import { use, useEffect } from 'react';
import type { MyUIMessage } from '@/lib/types';
import { useCustomChat } from '@/providers/chat-provider';
import { Messages } from './messages';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const PROMPT_SUGGESTIONS = [
  'Explain how AI works in a way a 5 year old can understand',
  'How do I survive a long flight without losing my mind?',
  'What are the best sources of protein?',
  'Help me plan my summer vacation in Europe',
];

export function MessagesContainer({
  initialMessagesPromise,
}: {
  initialMessagesPromise: Promise<MyUIMessage[]>;
}) {
  const {
    messages,
    buildBodyAndHeaders,
    chatId,
    error,
    regenerate,
    sendMessage,
    setMessages,
    status,
    setInput,
    inputRef,
    setInitialMessages,
  } = useCustomChat();

  const initialMessages = use(initialMessagesPromise);

  useEffect(() => {
    setInitialMessages(initialMessages);
  }, [initialMessages, setInitialMessages]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {messages.length > 0 ? (
        <Messages
          buildBodyAndHeaders={buildBodyAndHeaders}
          currentChatId={chatId}
          error={error}
          messages={messages}
          regenerate={regenerate}
          sendMessage={sendMessage}
          setMessages={setMessages}
          status={status}
        />
      ) : (
        <div className="flex h-full flex-col items-center justify-center space-y-10 text-center">
          <h1 className="font-medium text-3xl sm:text-4xl">
            How can I help you today?
          </h1>
          <div className="w-full max-w-3xl px-2">
            {PROMPT_SUGGESTIONS.map((suggestion, index) => (
              <div key={suggestion}>
                <Button
                  className="h-auto w-full justify-start p-3 font-normal text-muted-foreground text-sm hover:text-foreground"
                  onClick={() => {
                    setInput(suggestion);
                    inputRef.current?.focus();
                  }}
                  variant="ghost"
                >
                  {suggestion}
                </Button>
                {index < PROMPT_SUGGESTIONS.length - 1 && (
                  <div className="px-3">
                    <Separator />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
