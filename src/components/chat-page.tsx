"use client";

import { ChatInput } from "./chat-input";
import { Header } from "./header";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type Message } from "ai";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Messages } from "./messages";
import { createChat } from "@/lib/db/actions";
import { Loader2, Upload } from "lucide-react";
import { useHasApiKeys, useSettingsStore } from "@/stores/settings-store";
import { getMessages } from "@/lib/db/actions";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Chat } from "@/lib/db/schema";
import type { Attachment } from "@ai-sdk/ui-utils";
import type { FileMetadata } from "@/lib/types";
import { useDropzone } from "react-dropzone";

const promptSuggestions = [
  "Suggest a quick and healthy dinner recipe",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  user: User | null;
  initialChatId: string;
}

export function ChatPage({ user, initialChatId }: ChatPageProps) {
  const { model, reasoningEffort, apiKeys, customPrompt } = useSettingsStore();
  const hasApiKeys = useHasApiKeys();
  const queryClient = useQueryClient();

  const router = useRouter();
  const pathname = usePathname();
  const chatIdParams = pathname.split("/chat/")[1];
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [dontFetchId, setDontFetchId] = useState("");
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dialogActiveItem, setDialogActiveItem] = useState("General");
  const [fileMetadata, setFileMetadata] = useState<
    Record<string, FileMetadata>
  >({});
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [droppedFiles, setDroppedFiles] = useState<File[]>([]);

  // Sync attachments with fileMetadata state
  useEffect(() => {
    const newAttachments = Object.values(fileMetadata).map((file) => ({
      name: file.name,
      contentType: `image/${file.extension}`,
      url: file.url,
    }));

    if (JSON.stringify(attachments) !== JSON.stringify(newAttachments)) {
      setAttachments(newAttachments);
    }
  }, [fileMetadata, attachments]);

  const handleFileDrop = useCallback((files: File[]) => {
    setDroppedFiles(files);
    setTimeout(() => setDroppedFiles([]), 100);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    noClick: true,
    noKeyboard: true,
    multiple: true,
  });

  // Sync the chatId from the URL with the state
  // useParams was being weird so using usePathname instead
  useEffect(() => {
    if (pathname === "/") {
      setChatId(null);
    } else {
      setChatId(chatIdParams);
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
      return (await getMessages(chatId)) as Message[];
    },
    enabled: Boolean(chatId && chatId !== dontFetchId),
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
      customPrompt,
    },
    onError: (error) => {
      console.error(error);
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

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    if (!hasApiKeys) {
      toast("Please add API keys to chat", {
        action: {
          label: "Add keys",
          onClick: () => {
            setSettingsDialogOpen(true);
            setDialogActiveItem("API Keys");
          },
        },
      });
      return;
    }

    if (!input.trim()) {
      return;
    }

    if (temporaryChat) {
      handleSubmit(e);
      return;
    }

    if (!chatId) {
      const newChatId = crypto.randomUUID();
      const userMessage = input.trim();

      setChatId(newChatId);
      setDontFetchId(newChatId);

      createChat(newChatId);
      queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
        if (!oldData) return oldData;
        return [
          {
            id: newChatId,
            userId: user.id,
            title: "New Chat",
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false,
          },
          ...oldData,
        ];
      });

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      const submitPromise = handleSubmit(e, {
        experimental_attachments: attachments,
      });
      const titlePromise = (async () => {
        try {
          const response = await fetch("/api/generate-title", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chatId: newChatId,
              prompt: userMessage,
              apiKeys,
            }),
          });

          const result = await response.json();

          if (result.success) {
            queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
              if (!oldData) return oldData;
              return oldData.map((chatItem) =>
                chatItem.id === newChatId
                  ? { ...chatItem, title: result.title }
                  : chatItem
              );
            });
          }
        } catch (error) {
          console.error(error);
          // Fallback title is already set when chat is created, so just log for now
        }
      })();

      // Send both requests in parallel
      await Promise.all([submitPromise, titlePromise]);
      setFileMetadata({});
    } else {
      // Bring chat to top of list
      queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
        if (!oldData) return oldData;
        const chatIndex = oldData.findIndex((chat) => chat.id === chatId);
        if (chatIndex === -1) return oldData;

        const newChats = [...oldData];
        newChats.splice(chatIndex, 1);
        newChats.unshift(oldData[chatIndex]);
        return newChats;
      });
      handleSubmit(e, {
        experimental_attachments: attachments,
      });
      setFileMetadata({});
    }
  };

  return (
    <>
      <AppSidebar
        user={user}
        chatIdParams={chatId ?? ""}
        settingsDialogOpen={settingsDialogOpen}
        setSettingsDialogOpen={setSettingsDialogOpen}
        dialogActiveItem={dialogActiveItem}
        setDialogActiveItem={setDialogActiveItem}
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

          <Header temporaryChat={temporaryChat} />
          <div className="flex-1 min-h-0 relative">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading messages..
                  </span>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <Messages
                allMessages={messages}
                status={status}
                reload={reload}
                append={append}
                setMessages={setMessages}
              />
            ) : (
              <div className="h-full flex items-center justify-center px-3">
                <div className="flex flex-col gap-4 mx-auto max-w-2xl w-full items-center">
                  {temporaryChat ? (
                    <>
                      <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                        Temporary chat
                      </h1>
                      <p className="text-muted-foreground text-md max-w-sm text-center">
                        This chat won&apos;t appear in your chat history and
                        will be cleared when you close the tab.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                        {user
                          ? `How can I help you, ${user.name.split(" ")[0]}?`
                          : "How can I help you?"}
                      </h1>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 w-full">
                        {promptSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="border-border bg-card hover:bg-muted cursor-pointer rounded-xl border p-4 text-left transition-colors"
                            onClick={() => setInput(suggestion)}
                          >
                            <span className="text-muted-foreground text-sm">
                              {suggestion}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="shrink-0 px-3">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleChatSubmit}
              stop={stop}
              status={status}
              fileMetadata={fileMetadata}
              setFileMetadata={setFileMetadata}
              droppedFiles={droppedFiles}
            />
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
