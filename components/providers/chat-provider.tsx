import { type UIMessage, type UseChatHelpers, useChat } from '@ai-sdk/react';
import { eventIteratorToStream } from '@orpc/client';
import type { User } from 'better-auth';
import { usePathname } from 'next/navigation';
import { createContext, useContext, useState } from 'react';
import { toast } from 'sonner';
import { orpc } from '@/backend/orpc';
import { CHAT_MODELS } from '@/lib/models';
import { useChatConfig } from './chat-config-provider';

type ChatContextType = {
  messages: UIMessage[];
  sendMessage: UseChatHelpers<UIMessage>['sendMessage'];
  setMessages: UseChatHelpers<UIMessage>['setMessages'];
  stop: UseChatHelpers<UIMessage>['stop'];
  status: UseChatHelpers<UIMessage>['status'];
  regenerate: UseChatHelpers<UIMessage>['regenerate'];
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const chatId = usePathname().split('/c/')[1] ?? '';
  const isNewChat = !!chatId;
  const { model, reasoningEffort, shouldUseReasoning, searchWeb, apiKeys } =
    useChatConfig();

  const [input, setInput] = useState('');
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const { messages, sendMessage, setMessages, stop, status, regenerate } =
    useChat({
      id: chatId,
      transport: {
        async sendMessages(options) {
          return eventIteratorToStream(
            await orpc.chatStreamRouter.stream.call(
              {
                chatId,
                messages: options.messages,
                modelId:
                  CHAT_MODELS.find((m) => m.id === model)?.id ??
                  'anthropic/claude-sonnet-4', // Default so that typescript is happy
                apiKey: apiKeys.aiGateway,
                reasoningEffort,
                shouldUseReasoning,
                shouldSearchWeb: searchWeb,
                isNewChat,
              },
              { signal: options.abortSignal }
            )
          );
        },
        reconnectToStream() {
          throw new Error('Not supported');
        },
      },
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to chat');
      return;
    }

    if (!input.trim()) {
      return;
    }

    sendMessage({
      text: input,
    });
    setInput('');
  };

  const value: ChatContextType = {
    messages,
    sendMessage,
    setMessages,
    stop,
    status,
    regenerate,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
  };

  return <ChatContext value={value}>{children}</ChatContext>;
}

export function useCustomChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useCustomChat must be used within a ChatProvider');
  }
  return context;
}
