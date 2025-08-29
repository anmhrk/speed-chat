'use client';

import { type UseChatHelpers, useChat } from '@ai-sdk/react';
import { createIdGenerator, type FileUIPart } from 'ai';
import { useConvexAuth } from 'convex/react';
import { nanoid } from 'nanoid';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { CHAT_MODELS } from '@/lib/models';
import type { MyUIMessage } from '@/lib/types';
import { useChatConfig } from './chat-config-provider';
import { useDialogs } from './dialogs-provider';

type ChatProviderProps = {
  children: React.ReactNode;
};

type ChatContextType = {
  messages: MyUIMessage[];
  sendMessage: UseChatHelpers<MyUIMessage>['sendMessage'];
  setMessages: UseChatHelpers<MyUIMessage>['setMessages'];
  stop: UseChatHelpers<MyUIMessage>['stop'];
  status: UseChatHelpers<MyUIMessage>['status'];
  regenerate: UseChatHelpers<MyUIMessage>['regenerate'];
  chatId: string;
  input: string;
  setInput: React.Dispatch<React.SetStateAction<string>>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  isStreaming: boolean;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  filesToSend: FileUIPart[];
  setFilesToSend: React.Dispatch<React.SetStateAction<FileUIPart[]>>;
  error: UseChatHelpers<MyUIMessage>['error'];
  buildBodyAndHeaders: () => {
    body: Record<string, unknown>;
    headers: Record<string, string>;
  };
  setInitialMessages: (messages: MyUIMessage[]) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: ChatProviderProps) {
  const { model, reasoningEffort, shouldUseReasoning, searchWeb, apiKey } =
    useChatConfig();
  const { isAuthenticated } = useConvexAuth();
  const { setIsApiKeysOpen } = useDialogs();
  const pathname = usePathname();
  const urlChatId = pathname.split('/chat/')[1] ?? '';
  const [chatId, setChatId] = useState<string>(() => urlChatId || nanoid());
  const [isNewChat, setIsNewChat] = useState<boolean>(() => !urlChatId);

  // Update chatId when URL changes
  useEffect(() => {
    if (urlChatId) {
      // Navigating to an existing chat
      setChatId(urlChatId);
      setIsNewChat(false);
    } else {
      // Navigating to home
      const newId = nanoid();
      setChatId(newId);
      setIsNewChat(true);
    }
  }, [urlChatId]);

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  const [filesToSend, setFilesToSend] = useState<FileUIPart[]>([]);

  const {
    messages,
    sendMessage,
    setMessages,
    stop,
    status,
    regenerate,
    error,
  } = useChat<MyUIMessage>({
    id: chatId,
    resume: !!urlChatId,
    generateId: createIdGenerator({
      prefix: 'user',
      size: 16,
    }),
    onError: (error) => {
      toast.error(
        error.message || 'An error occurred while generating the response'
      );
    },
  });

  const setInitialMessages = useCallback(
    (messages: MyUIMessage[]) => {
      setMessages(messages);
    },
    [setMessages]
  );

  const buildBodyAndHeaders = useCallback(() => {
    return {
      body: {
        chatId,
        modelId:
          CHAT_MODELS.find((m) => m.name === model)?.id ??
          'anthropic/claude-sonnet-4',
        reasoningEffort,
        shouldUseReasoning,
        shouldSearchWeb: searchWeb,
        isNewChat,
      },
      headers: {
        'x-ai-gateway-api-key': apiKey,
      },
    };
  }, [
    chatId,
    model,
    apiKey,
    reasoningEffort,
    shouldUseReasoning,
    searchWeb,
    isNewChat,
  ]);

  const isStreaming = status === 'streaming' || status === 'submitted';

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Please sign in to chat');
      return;
    }

    if (!input.trim() || isStreaming) {
      return;
    }

    if (!apiKey || apiKey.trim().length === 0) {
      toast.error('Please set your AI Gateway API key', {
        action: {
          label: 'Set API key',
          onClick: () => setIsApiKeysOpen(true),
        },
      });
      return;
    }

    if (isNewChat) {
      window.history.replaceState({}, '', `/chat/${chatId}`);
      setIsNewChat(false);
    }

    const { body, headers } = buildBodyAndHeaders();

    sendMessage(
      {
        text: input,
        files: filesToSend,
      },
      {
        body,
        headers,
      }
    );

    setInput('');
    setFilesToSend([]);
  };

  const contextValue: ChatContextType = {
    messages,
    sendMessage,
    setMessages,
    stop,
    status,
    regenerate,
    chatId,
    input,
    setInput,
    error,
    handleSubmit,
    inputRef,
    handleInputChange,
    isStreaming,
    filesToSend,
    setFilesToSend,
    buildBodyAndHeaders,
    setInitialMessages,
  };

  return <ChatContext value={contextValue}>{children}</ChatContext>;
}

export function useCustomChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatProvider must be used within a ChatProvider');
  }
  return context;
}
