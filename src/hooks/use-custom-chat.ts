'use client';

import { useChat } from '@ai-sdk/react';
import { createIdGenerator, type FileUIPart } from 'ai';
import { useQuery } from 'convex-helpers/react/cache/hooks';
import { nanoid } from 'nanoid';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { CHAT_MODELS } from '@/lib/models';
import type { MyUIMessage } from '@/lib/types';
import { useChatConfig } from '@/providers/chat-config-provider';

type CustomChatProps = {
  isAuthenticated: boolean;
  setIsApiKeysOpen: (open: boolean) => void;
};

export function useCustomChat({
  isAuthenticated,
  setIsApiKeysOpen,
}: CustomChatProps) {
  const { model, reasoningEffort, shouldUseReasoning, searchWeb, apiKey } =
    useChatConfig();
  const pathname = usePathname();
  const urlChatId = pathname.split('/chat/')[1] ?? '';
  const [chatId, setChatId] = useState<string>(() => urlChatId || nanoid());
  const [isNewChat, setIsNewChat] = useState<boolean>(() => !urlChatId);
  const [newlyCreatedChatId, setNewlyCreatedChatId] = useState<string | null>(
    null
  );

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
      setNewlyCreatedChatId(null);
    }
  }, [urlChatId]);

  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  const [filesToSend, setFilesToSend] = useState<FileUIPart[]>([]);

  const initialMessages = useQuery(
    api.chat.getMessages,
    !!urlChatId && isAuthenticated && !newlyCreatedChatId ? { chatId } : 'skip'
  );

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

  // initialMessages is undefined on first render, ai sdk doesn't update messages once initialMessages is populated
  useEffect(() => {
    if (initialMessages && initialMessages.length > 0) {
      setMessages(initialMessages);
    }
  }, [initialMessages, setMessages]);

  const loadingMessages =
    !!urlChatId &&
    !newlyCreatedChatId &&
    (initialMessages === undefined ||
      (initialMessages && initialMessages.length > 0 && messages.length === 0));

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

  useEffect(() => {
    if (chatId !== newlyCreatedChatId) {
      setNewlyCreatedChatId(null);
    }
  }, [chatId, newlyCreatedChatId]);

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
      setNewlyCreatedChatId(chatId);
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

  return {
    messages,
    loadingMessages,
    sendMessage,
    setMessages,
    stop,
    regenerate,
    chatId,
    input,
    setInput,
    inputRef,
    handleInputChange,
    isStreaming,
    handleSubmit,
    filesToSend,
    setFilesToSend,
    buildBodyAndHeaders,
    status,
    error,
  };
}
