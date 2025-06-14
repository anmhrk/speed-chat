import { AppSidebar } from "./AppSidebar";
import { ChatArea } from "./ChatArea";
import { Header } from "./Header";
import { SidebarProvider } from "./ui/sidebar";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { useState, useEffect } from "react";
import type { Models, ReasoningEfforts, Providers } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { customAlphabet } from "nanoid";
import { useThreads } from "@/hooks/useThreads";
import { useMessages } from "@/hooks/useMessages";
import type { Message } from "ai";

interface ChatPageProps {
  chatIdParams?: string;
  user: User | null | undefined;
  defaultOpen: boolean;
}

export function ChatPage({ chatIdParams, user, defaultOpen }: ChatPageProps) {
  const router = useRouter();
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
  });
  const [pendingTitleUpdate, setPendingTitleUpdate] = useState<string | null>(
    null,
  );

  const {
    data: threadsData,
    isLoading: threadsLoading,
    error: threadsError,
  } = useThreads(user?.id);

  const threads = threadsData?.threads || [];

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
  } = useMessages(chatIdParams, user?.id);
  const isLoadingChat = Boolean(
    chatIdParams && messagesLoading && !messagesData,
  );

  useEffect(() => {
    if (threadsError) {
      toast.error(threadsError.message);
      router.navigate({
        to: "/",
      });
    }
  }, [threadsError]);

  useEffect(() => {
    if (messagesError) {
      toast.error(messagesError.message);
      router.navigate({
        to: "/",
      });
    }
  }, [messagesError]);

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    setInput,
    status,
    stop,
    reload,
    data,
    setMessages,
  } = useChat({
    id: chatIdParams,
    initialMessages: messagesData?.messages || [],
    credentials: "include",
    body: {
      chatId: chatIdParams,
      userId: user?.id,
      model: model,
      reasoningEffort: reasoningEffort,
      apiKeys: apiKeys,
    },
  });

  const handleChatSubmit = (e: React.FormEvent) => {
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

    // For new chat
    if (!chatIdParams) {
      const newChatId = customAlphabet(
        "0123456789abcdefghijklmnopqrstuvwxyz",
        16,
      )();

      // Add new thread to the threads array with empty title
      threads.unshift({
        id: newChatId,
        title: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      setPendingTitleUpdate(newChatId);

      router.navigate({
        to: "/chat/$chatId",
        params: {
          chatId: newChatId,
        },
        replace: true,
      });
    }

    handleSubmit(e);
  };

  // Watch for title data updates from the stream
  useEffect(() => {
    if (data && pendingTitleUpdate) {
      const titleData = data.find(
        (d: any) => d.type === "title" && d.chatId === pendingTitleUpdate,
      ) as { type: string; chatId: string; title: string } | undefined;

      if (titleData) {
        const thread = threads.find(
          (thread) => thread.id === pendingTitleUpdate,
        );
        if (thread) {
          thread.title = titleData.title;
        }
        setPendingTitleUpdate(null);
      }
    }
  }, [data, pendingTitleUpdate, threads]);

  // Watch for error data from the stream
  useEffect(() => {
    if (data) {
      const errorData = data.find((d: any) => d.type === "error") as
        | {
            type: string;
            error: Message;
          }
        | undefined;

      if (errorData) {
        setMessages((prev) => {
          // On error an empty assistant message is created, so we replace it with the error message
          const lastMessage = prev[prev.length - 1];
          if (
            lastMessage?.role === "assistant" &&
            (!lastMessage.content || lastMessage.content.trim() === "")
          ) {
            return [...prev.slice(0, -1), errorData.error];
          } else {
            // Fallback
            return [...prev, errorData.error];
          }
        });
      }
    }
  }, [data, setMessages]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Header />
      <AppSidebar user={user} threads={threads} isLoading={threadsLoading} />
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
          isLoadingChat={isLoadingChat}
        />
      </main>
    </SidebarProvider>
  );
}
