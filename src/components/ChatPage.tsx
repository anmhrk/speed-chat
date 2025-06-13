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
import { useChatData } from "@/hooks/useChat";
import {
  useCreateThread,
  useUpdateThreadTitle,
} from "@/hooks/useThreadsMutation";

interface ChatPageProps {
  chatIdParams?: string;
  user: User | null | undefined;
  defaultOpen: boolean;
}

export function ChatPage({ chatIdParams, user, defaultOpen }: ChatPageProps) {
  const router = useRouter();
  const [chatId, setChatId] = useState<string>(chatIdParams || "");
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

  // React Query hooks
  const {
    data: threadsData,
    isLoading: threadsLoading,
    error: threadsError,
  } = useThreads(user?.id);
  const {
    data: chatData,
    isLoading: chatLoading,
    error: chatError,
  } = useChatData(chatIdParams, user?.id);
  const createThreadMutation = useCreateThread(user?.id);
  const updateThreadTitleMutation = useUpdateThreadTitle(user?.id);

  const threads = threadsData?.threads || [];

  // Determine if we should show loading state for chat
  const isLoadingChat = Boolean(chatIdParams && chatLoading && !chatData);

  // Show error toast if threads or chat fail to load
  useEffect(() => {
    if (threadsError) {
      toast.error("Failed to load chat history");
    }
  }, [threadsError]);

  useEffect(() => {
    if (chatError) {
      toast.error("Failed to load chat messages");
    }
  }, [chatError]);

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
    initialMessages: chatData?.chat?.messages || [],
    credentials: "include",
    body: {
      chatId,
      userId: user?.id,
      model: model,
      reasoningEffort: reasoningEffort,
      apiKeys: apiKeys,
    },
    onFinish: (message, { finishReason }) => {
      // Handle any remaining title updates if needed
      if (pendingTitleUpdate && finishReason === "stop") {
        // Check if we received title data from the stream
        const titleData = data?.find(
          (d: any) => d.type === "title" && d.chatId === pendingTitleUpdate,
        ) as { type: string; chatId: string; title: string } | undefined;
        if (titleData) {
          updateThreadTitleMutation.mutate({
            id: pendingTitleUpdate,
            title: titleData.title,
          });
        } else {
          // Fallback: extract title from message content
          updateThreadTitleMutation.mutate({
            id: pendingTitleUpdate,
            title: extractTitleFromResponse(message.content),
          });
        }
        setPendingTitleUpdate(null);
      }
    },
    onError: (error) => {
      console.error("Chat error:", error);

      // Check if there's a more detailed error in the data stream
      const errorData = data?.find((d: any) => d.type === "error") as
        | {
            type: string;
            error: string;
          }
        | undefined;

      // Use the same format as the server to avoid inconsistency
      const errorContent =
        errorData?.error ||
        `Error: ${error.message || "An error occurred while processing your request"}`;

      // Add error message as assistant message
      const errorAssistantMessage = {
        id: `error-${Date.now()}`,
        role: "assistant" as const,
        content: errorContent,
        createdAt: new Date(),
      };

      setMessages((prev) => [...prev, errorAssistantMessage]);
    },
  });

  // Function to extract a title from the assistant's response
  const extractTitleFromResponse = (content: string): string => {
    // Simple heuristic: take first few words, max 6 words
    const words = content.trim().split(/\s+/).slice(0, 6);
    return (
      words.join(" ") + (content.trim().split(/\s+/).length > 6 ? "..." : "")
    );
  };

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

    // for new chat
    if (!chatId) {
      const newChatId = customAlphabet(
        "0123456789abcdefghijklmnopqrstuvwxyz",
        16,
      )();
      setChatId(newChatId);

      // Add new thread with empty title (will show skeleton)
      createThreadMutation.mutate({
        id: newChatId,
        title: "", // Empty title will show skeleton
      });

      setPendingTitleUpdate(newChatId);

      // router.navigate({
      //   to: "/chat/$chatId",
      //   params: {
      //     chatId: newChatId,
      //   },
      //   replace: true,
      // });
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
        updateThreadTitleMutation.mutate({
          id: pendingTitleUpdate,
          title: titleData.title,
        });
        setPendingTitleUpdate(null);
      }
    }
  }, [data, pendingTitleUpdate, updateThreadTitleMutation]);

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
