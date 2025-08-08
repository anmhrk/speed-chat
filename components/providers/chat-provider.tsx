'use client';

import { type UIMessage, type UseChatHelpers, useChat } from '@ai-sdk/react';
import { eventIteratorToStream } from '@orpc/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createIdGenerator } from 'ai';
import type { User } from 'better-auth';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import type { DbChat } from '@/backend/db/schema';
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
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  chats: DbChat[] | undefined;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
  isStreaming: boolean;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const qc = useQueryClient();
  const router = useRouter();
  const chatIdParams = usePathname().split('/c/')[1] ?? '';
  const [chatId, setChatId] = useState(chatIdParams);
  const isNewChat = !chatIdParams;
  const { model, reasoningEffort, shouldUseReasoning, searchWeb, apiKeys } =
    useChatConfig();

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const {
    data: chats,
    isLoading: isLoadingChats,
    isError: isErrorChats,
    error: errorChats,
  } = useQuery(
    orpc.chatRouter.getChats.queryOptions({
      enabled: !!user,
      queryKey: ['chats'],
    })
  );

  const {
    data: initialMessages,
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
    error: errorMessages,
  } = useQuery(
    orpc.chatRouter.getMessages.queryOptions({
      input: { chatId },
      enabled: !!chatId,
      queryKey: ['messages', chatId],
    })
  );

  useEffect(() => {
    if (isErrorChats) {
      toast.error('Error loading chats', {
        description: errorChats?.message,
      });
      router.push('/');
    }

    if (isErrorMessages) {
      toast.error(`Error loading messages for chat ${chatId}`, {
        description: errorMessages?.message,
      });
      router.push('/');
    }
  }, [
    isErrorChats,
    router,
    errorChats,
    isErrorMessages,
    errorMessages,
    chatId,
  ]);

  const { messages, sendMessage, setMessages, stop, status, regenerate } =
    useChat({
      id: chatId,
      messages: initialMessages,
      generateId: createIdGenerator({
        prefix: 'user',
        size: 16,
      }),
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
      onData: (dataPart) => {
        if (dataPart.type === 'data-title') {
          qc.setQueryData(['chats'], (oldData: DbChat[] | undefined) => {
            if (!oldData) {
              return oldData;
            }

            return oldData.map((chat) =>
              chat.id === chatId
                ? { ...chat, title: dataPart.data as string }
                : chat
            );
          });
        }
      },
    });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please sign in to chat');
      return;
    }

    if (!input.trim() || status === 'streaming' || status === 'submitted') {
      return;
    }

    if (chatId) {
      // put chat at the top of the chats list
      qc.setQueryData(['chats'], (oldData: DbChat[] | undefined) => {
        if (!oldData) {
          return oldData;
        }

        const currentChat = oldData.find((chat) => chat.id === chatId);

        if (!currentChat) {
          return oldData;
        }

        return [currentChat, ...oldData.filter((chat) => chat.id !== chatId)];
      });
    } else {
      const newChatId = crypto.randomUUID();
      setChatId(newChatId);
      qc.setQueryData(['messages', newChatId], []); // set query cache for new chat to prevent fetch on route change

      qc.setQueryData(['chats'], (oldData: DbChat[] | undefined) => {
        const newChat: DbChat = {
          id: newChatId,
          title: 'New Chat',
          createdAt: new Date(),
          updatedAt: new Date(),
          userId: user.id,
          isPinned: false,
          isBranch: false,
          parentChatId: null,
        };

        return oldData ? [newChat, ...oldData] : [newChat];
      });

      window.history.replaceState({}, '', `/c/${newChatId}`);
    }

    sendMessage({
      text: input,
    });
    setInput('');
  };

  const isStreaming = status === 'submitted' || status === 'streaming';

  const value: ChatContextType = {
    messages,
    sendMessage,
    setMessages,
    stop,
    status,
    regenerate,
    input,
    setInput,
    inputRef,
    handleInputChange,
    handleSubmit,
    chats,
    isLoadingChats,
    isLoadingMessages,
    isStreaming,
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
