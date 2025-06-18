"use client";

import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import type {
  Models,
  ReasoningEfforts,
  Providers,
  CustomizationSettings,
} from "@/lib/types";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { useChatContext } from "@/components/providers/ChatProvider";
import { type Message, createIdGenerator } from "ai";
import {
  Preloaded,
  useMutation,
  usePreloadedQuery,
  useQuery,
  useAction,
} from "convex/react";
import { api } from "../../convex/_generated/api";

interface ChatPageProps {
  initialChatId?: string | null;
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
}

export function ChatPage({ initialChatId, preloadedUser }: ChatPageProps) {
  const user = usePreloadedQuery(preloadedUser);
  const chatContext = useChatContext();
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string> | null>(
    null,
  );
  const [customizationSettings, setCustomizationSettings] =
    useState<CustomizationSettings | null>(null);
  const [temporaryChat, setTemporaryChat] = useState<boolean>(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("customization_settings");
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setCustomizationSettings(parsed);
    }
  }, []);

  const shouldFetchMessages = chatId && !chatContext.isNewChat(chatId);

  const threadsData = useQuery(api.chat.fetchThreads);
  const isLoadingThreads = threadsData === undefined;

  const messagesData = useQuery(
    api.chat.fetchMessages,
    shouldFetchMessages && chatId ? { chatId } : "skip",
  );
  const isLoadingMessages = Boolean(
    shouldFetchMessages && messagesData === undefined,
  );

  const initialMessages: Message[] = messagesData
    ? messagesData.map((message) => ({
        id: message.id,
        role: message.role,
        content: message.content,
        createdAt: new Date(message.createdAt),
      }))
    : [];

  const createInitialChat = useMutation(api.chat.createInitialChat);
  const generateThreadTitle = useAction(api.chat.generateThreadTitle);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    status,
    stop,
    reload,
    setMessages,
    append,
  } = useChat({
    id: chatId || undefined,
    initialMessages,
    credentials: "include",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "user",
      size: 16,
    }),
    body: {
      chatId: chatId || undefined,
      model: model,
      reasoningEffort: reasoningEffort,
      apiKeys: apiKeys,
      temporaryChat: temporaryChat,
      customizationSettings: customizationSettings,
    },
    onError: (error) => {
      const errorMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: error.message,
        createdAt: new Date(),
      } as Message;

      setMessages((prev) => {
        // On error an empty assistant message is created, so we replace it with the error message
        const lastMessage = prev[prev.length - 1];
        if (
          lastMessage?.role === "assistant" &&
          (!lastMessage.content || lastMessage.content.trim() === "")
        ) {
          return [...prev.slice(0, -1), errorMessage];
        } else {
          // Fallback
          return [...prev, errorMessage];
        }
      });
    },
  });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    const canSubmit =
      hasApiKeys || model === "google/gemini-2.5-flash-preview-05-20";

    if (!canSubmit || !input.trim()) {
      return;
    }

    if (temporaryChat) {
      if (!chatId) {
        const tempChatId = crypto.randomUUID();
        setChatId(tempChatId);
      }
      handleSubmit(e);
      return;
    }

    if (!chatId) {
      const newChatId = crypto.randomUUID();
      const userMessage = input.trim();

      setChatId(newChatId);
      chatContext.addNewChatId(newChatId);
      await createInitialChat({ chatId: newChatId });

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      // Start both in parallel
      await Promise.all([
        handleSubmit(e),
        (async () => {
          try {
            const title = await generateThreadTitle({
              chatId: newChatId,
              prompt: userMessage,
            });
            return title;
          } catch (error) {
            console.error(error);
            return "New Chat"; // Fallback title
          }
        })(),
      ]);

      chatContext.removeNewChatId(newChatId);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <>
      <Header
        temporaryChat={temporaryChat}
        setTemporaryChat={setTemporaryChat}
        setChatId={setChatId}
      />
      <AppSidebar
        user={user}
        threads={threadsData}
        isLoading={isLoadingThreads}
        newThreads={chatContext.newChatIds}
        chatId={chatId}
        setChatId={setChatId}
      />
      <main className="h-screen flex-1">
        <ChatArea
          user={user}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleChatSubmit}
          setInput={setInput}
          status={status}
          stop={stop}
          reload={reload}
          model={model}
          setModel={setModel}
          reasoningEffort={reasoningEffort}
          setReasoningEffort={setReasoningEffort}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          hasApiKeys={hasApiKeys}
          setHasApiKeys={setHasApiKeys}
          isLoadingChat={isLoadingMessages}
          temporaryChat={temporaryChat}
          append={append}
          setMessages={setMessages}
        />
      </main>
    </>
  );
}
