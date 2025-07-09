"use client";

import { Header } from "@/components/header";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type Message } from "ai";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { Upload } from "lucide-react";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { createChat, getMessages } from "@/lib/db/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Chat } from "@/lib/db/schema";
import { useAttachments } from "@/hooks/use-attachments";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { SearchChats } from "@/components/search-chats";
import { StreamData } from "@/lib/types";
import { ChatLayout } from "@/components/layouts/chat-layout";
import { HomepageLayout } from "@/components/layouts/homepage-layout";

interface ChatPageProps {
  user: User | null;
  initialChatId?: string;
  greeting?: string;
  promptSuggestions?: string[];
  isOnSharedPage?: boolean;
  didUserCreate?: boolean;
}

export function ChatPage({
  user,
  initialChatId,
  greeting,
  promptSuggestions,
  isOnSharedPage,
  didUserCreate,
}: ChatPageProps) {
  const { model, reasoningEffort, apiKeys, customization, hasAnyKey } =
    useSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const queryClient = useQueryClient();
  const chatIdParams = pathname.split("/chat/")[1] ?? initialChatId;
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const {
    fileMetadata,
    attachments,
    getRootProps,
    getInputProps,
    isDragActive,
    clearFiles,
    files,
    setFiles,
    isUploading,
    fileInputRef,
    handleFileChange,
    removeFile,
    acceptsPdf,
  } = useAttachments(model);
  const [isSearchChatsOpen, setIsSearchChatsOpen] = useState(false);
  const [isInputCentered, setIsInputCentered] = useState(!chatId);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync the chatId from the URL with the state
  useEffect(() => {
    if (pathname === "/") {
      setChatId(null);
      setIsInputCentered(true);
    } else {
      setChatId(chatIdParams);
      setIsInputCentered(false);
    }
  }, [chatIdParams, pathname]);

  const {
    data: initialMessages,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["messages", chatId],
    queryFn: async () => {
      if (!chatId) return [];
      return (await getMessages(chatId, isOnSharedPage ?? false)) as Message[];
    },
    enabled: Boolean(chatId),
    staleTime: Infinity,
  });

  useEffect(() => {
    if (isError) {
      toast.error(error?.message ?? "Failed to load messages");
      router.push("/");
    }
  }, [isError, error, router]);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    stop,
    status,
    reload,
    append,
    setMessages,
    data,
  } = useChat({
    id: chatId ?? undefined,
    initialMessages,
    credentials: "include",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "user",
      size: 16,
    }),
    experimental_throttle: 100,
    body: {
      chatId: chatId ?? undefined,
      model,
      reasoningEffort,
      apiKeys,
      temporaryChat,
      customization,
      searchEnabled,
      isNewChat: isNewlyCreated,
    },
    onError: (error) => {
      const errorMessage = {
        id: `error-${crypto.randomUUID()}`,
        role: "assistant",
        content: error.message,
        createdAt: new Date(),
        parts: [{ type: "text", text: error.message }],
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

  useShortcuts(
    ["cmd+k", "cmd+shift+o"],
    [
      () => {
        setIsSearchChatsOpen(true);
      },
      () => {
        router.push("/");
      },
    ]
  );

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isOnSharedPage && !didUserCreate) {
      toast.error("Please fork this shared chat to send messages");
      return;
    }

    if (isOnSharedPage && didUserCreate) {
      toast.error(
        "You can't chat on a shared chat. Please go back to the original chat."
      );
      return;
    }

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    if (!hasAnyKey()) {
      toast("Please add API keys to chat", {
        action: {
          label: "Add keys",
          onClick: () => router.push("/settings/api-keys"),
        },
      });
      return;
    }

    if (!input.trim()) {
      return;
    }

    if (temporaryChat) {
      handleSubmit(e, { experimental_attachments: attachments });
      clearFiles();
      return;
    }

    if (!chatId) {
      setIsNewlyCreated(true);
      const newChatId = crypto.randomUUID();
      setChatId(newChatId);
      // Set messages query cache to prevent refetch on route change
      queryClient.setQueryData(["messages", newChatId], []);

      setIsInputCentered(false);

      createChat(newChatId).catch((error) => {
        toast.error("Failed to create chat");
        console.error(error);
      });

      queryClient.setQueryData(["chats"], (oldData: Chat[] | undefined) => {
        const newChat: Chat = {
          id: newChatId,
          userId: user!.id,
          title: "New chat",
          createdAt: new Date(),
          updatedAt: new Date(),
          isPinned: false,
          isShared: false,
          isBranched: false,
          parentChatId: null,
        };
        return oldData ? [newChat, ...oldData] : [newChat];
      });

      window.history.replaceState({}, "", `/chat/${newChatId}`);
      handleSubmit(e, { experimental_attachments: attachments });
      setTimeout(() => {
        setIsNewlyCreated(false);
      }, 500);
    } else {
      // Put chat to the top of the list
      queryClient.setQueryData(["chats"], (oldData: Chat[] | undefined) => {
        if (!oldData) return oldData;
        const currentChat = oldData.find((chat) => chat.id === chatId);
        if (currentChat) {
          return [currentChat, ...oldData.filter((chat) => chat.id !== chatId)];
        }
        return oldData;
      });

      handleSubmit(e, { experimental_attachments: attachments });
    }
    clearFiles();
  };

  useEffect(() => {
    data?.map((d) => {
      const data = d as StreamData<string>;

      if (data.type === "title") {
        queryClient.setQueryData(["chats"], (oldData: Chat[] | undefined) => {
          if (!oldData) return oldData;
          return oldData.map((chatItem) =>
            chatItem.id === chatId
              ? { ...chatItem, title: data.payload }
              : chatItem
          );
        });
      }
    });
  }, [data, chatId, queryClient]);

  const isMessageStreaming = status === "submitted" || status === "streaming";
  const onSearchChatsOpen = () => {
    setIsSearchChatsOpen(true);
  };

  const layoutProps = {
    user,
    greeting,
    temporaryChat,
    promptSuggestions,
    inputRef,
    setInput,
    input,
    handleInputChange,
    handleChatSubmit,
    stop,
    isMessageStreaming,
    files,
    setFiles,
    fileMetadata,
    isUploading,
    fileInputRef,
    handleFileChange,
    removeFile,
    acceptsPdf,
    searchEnabled,
    setSearchEnabled,
    isOnSharedPage: isOnSharedPage ?? false,
  };

  const chatLayoutProps = {
    isLoading,
    messages,
    initialMessages,
    status,
    reload,
    append,
    setMessages,
    chatId: chatId ?? "",
    ...layoutProps,
  };

  return (
    <>
      <AppSidebar
        user={user}
        chatIdParams={chatId ?? ""}
        isMessageStreaming={isMessageStreaming}
        onSearchChatsOpen={onSearchChatsOpen}
      />
      <SidebarInset>
        <div {...getRootProps()} className="flex flex-col h-screen relative">
          <input {...getInputProps()} />

          {isDragActive && (
            <div className="absolute inset-0 z-50 bg-secondary border-2 border-dashed border-primary flex items-center justify-center">
              <div className="text-center flex flex-col items-center gap-2">
                <Upload className="size-24" />
                <div className="text-md text-muted-foreground mt-1">
                  Upload images to attach to your message
                </div>
              </div>
            </div>
          )}

          <Header
            chatId={chatId ?? ""}
            user={user}
            temporaryChat={temporaryChat}
            isOnSharedPage={isOnSharedPage ?? false}
            didUserCreate={didUserCreate ?? false}
            onSearchChatsOpen={onSearchChatsOpen}
          />
          {isInputCentered ? (
            <HomepageLayout {...layoutProps} />
          ) : (
            <ChatLayout {...chatLayoutProps} />
          )}
        </div>
      </SidebarInset>

      <SearchChats
        isOpen={isSearchChatsOpen}
        onOpenChange={setIsSearchChatsOpen}
        user={user}
      />
    </>
  );
}
