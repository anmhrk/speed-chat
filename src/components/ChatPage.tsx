"use client";

import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import type { User } from "better-auth";
import type { Models, ReasoningEfforts, Providers, Thread } from "@/lib/types";
import { useState, useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchMessages,
  fetchThreads,
  generateThreadTitle,
  createInitialChat,
} from "@/lib/actions";
import { useRouter } from "next/navigation";
import { useChatContext } from "@/components/providers/ChatProvider";
import type { Message } from "ai";

interface ChatPageProps {
  initialChatId?: string | null;
  user: User | null;
}

export function ChatPage({ initialChatId, user }: ChatPageProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const chatContext = useChatContext();
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string> | null>(
    null,
  );
  const [temporaryChat, setTemporaryChat] = useState<boolean>(false);

  // Only fetch messages if it's not a new chat
  const shouldFetchMessages = chatId && !chatContext.isNewChat(chatId);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    isError: isMessagesError,
    error: messagesError,
  } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: () => fetchMessages(chatId!, user!.id),
    enabled: !!shouldFetchMessages && !!user?.id && !temporaryChat,
  });

  const {
    data: threadsData,
    isLoading: threadsLoading,
    isError: isThreadsError,
    error: threadsError,
  } = useQuery({
    queryKey: ["threads", user?.id],
    queryFn: () => fetchThreads(user!.id),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (isThreadsError) {
      toast.error(threadsError?.message || "Error fetching threads");
      router.push("/");
    }
  }, [isThreadsError, threadsError, router]);

  useEffect(() => {
    if (isMessagesError) {
      toast.error(messagesError?.message || "Error fetching messages");
      router.push("/");
    }
  }, [isMessagesError, messagesError, router]);

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
  } = useChat({
    id: chatId || undefined,
    initialMessages: messagesData || [],
    credentials: "include",
    body: {
      chatId: chatId || undefined,
      userId: user?.id || undefined,
      model: model,
      reasoningEffort: reasoningEffort,
      apiKeys: apiKeys,
      temporaryChat: temporaryChat,
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
      await createInitialChat(newChatId, user.id);

      // Add a small delay to ensure the database write is complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Update threads data in the query cache to show new chat in the sidebar
      queryClient.setQueryData(["threads", user!.id], (old: Thread[] = []) => [
        {
          id: newChatId,
          title: "New Chat",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        ...old,
      ]);

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      // Start both in parallel
      const [, generatedTitle] = await Promise.all([
        handleSubmit(e),
        (async () => {
          try {
            const title = await generateThreadTitle(newChatId, userMessage);
            return title;
          } catch (error) {
            console.error(error);
            return "New Chat"; // Fallback title
          }
        })(),
      ]);

      // Update the threads cache with the real title
      queryClient.setQueryData(["threads", user!.id], (old: Thread[] = []) =>
        old.map((thread) =>
          thread.id === newChatId
            ? { ...thread, title: generatedTitle }
            : thread,
        ),
      );

      // To prevent refetch when the query becomes enabled after removing from new chat set
      queryClient.setQueryData(["messages", newChatId], messages);
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
        threads={threadsData || []}
        isLoading={threadsLoading}
        newThreads={chatContext.newChatIds}
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
          isLoadingChat={messagesLoading}
          temporaryChat={temporaryChat}
        />
      </main>
    </>
  );
}
