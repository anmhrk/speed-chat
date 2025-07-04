"use client";

import { ChatInput } from "@/components/chat-input";
import { Header } from "@/components/header";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type Message } from "ai";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Messages } from "@/components/messages";
import { Upload } from "lucide-react";
import { useSettingsContext } from "@/components/settings-provider";
import { getMessages } from "@/lib/db/actions";
import { useQuery } from "@tanstack/react-query";
import type { Attachment } from "@ai-sdk/ui-utils";
import type { FileMetadata } from "@/lib/types";
import { useDropzone } from "react-dropzone";
import { useUnifiedSubmit } from "@/hooks/use-unified-submit";

const promptSuggestions = [
  "Suggest a quick and healthy dinner recipe",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  user: User | null;
  initialChatId: string;
  greeting?: string;
}

export function ChatPage({ user, initialChatId, greeting }: ChatPageProps) {
  const { model, reasoningEffort, apiKeys, customization } =
    useSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const chatIdParams = pathname.split("/chat/")[1];
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [dontFetchId, setDontFetchId] = useState("");
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

  const handleError = (error: Error, type: "chat" | "image") => {
    console.error(error);

    const errorMessage = {
      id: `error-${crypto.randomUUID()}`,
      role: "assistant",
      content: error.message,
      createdAt: new Date(),
      parts: [{ type: "text", text: error.message }],
    } as Message;

    if (type === "chat") {
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
    } else {
      setMessages((prev) => {
        return [...prev, errorMessage];
      });
    }
  };

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
      customization,
    },
    onError: (error) => {
      handleError(error, "chat");
    },
  });

  const { handleUnifiedSubmit, isGeneratingImage } = useUnifiedSubmit({
    input,
    setInput,
    chatId: chatId ?? "",
    setChatId,
    setDontFetchId,
    setMessages,
    handleSubmit,
    user,
    temporaryChat,
    attachments,
    handleError,
    messages,
  });

  return (
    <>
      <AppSidebar user={user} chatIdParams={chatId ?? ""} status={status} />
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
            {isLoading ? null : messages.length > 0 ? (
              <Messages
                allMessages={messages}
                status={status}
                reload={reload}
                append={append}
                setMessages={setMessages}
                isGeneratingImage={isGeneratingImage}
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
                        {user ? greeting : "How can I help you?"}
                      </h1>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 w-full">
                        {promptSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="border-border bg-secondary/40 dark:bg-card hover:bg-muted dark:hover:bg-muted cursor-pointer rounded-xl border p-4 text-left transition-colors"
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

          <div className="shrink-0 px-3 pb-3">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleUnifiedSubmit}
              stop={stop}
              isLoading={
                status === "submitted" ||
                status === "streaming" ||
                isGeneratingImage
              }
              fileMetadata={fileMetadata}
              setFileMetadata={setFileMetadata}
              droppedFiles={droppedFiles}
              user={user}
            />
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
