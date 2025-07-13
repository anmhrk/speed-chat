"use client";

import { Header } from "@/components/header";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { Upload } from "lucide-react";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { createChat, insertUserMessageToDb } from "@/lib/actions";
import { useAttachments } from "@/hooks/use-attachments";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { SearchChats } from "@/components/search-chats";
import { ChatLayout } from "@/components/layouts/chat-layout";
import { HomepageLayout } from "@/components/layouts/homepage-layout";
import { getRandomPromptSuggestions } from "@/lib/random";
import { isImageGenerationModel } from "@/lib/ai/models";
import { useElectric } from "@/hooks/use-electric";
import { createNewUserId } from "@/lib/utils";

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
  const {
    model,
    reasoningEffort,
    apiKeys,
    customization,
    hasAnyKey,
    reasoningEnabled,
  } = useSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const chatIdParams = pathname.split("/chat/")[1] ?? initialChatId;
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [newlyCreatedChatId, setNewlyCreatedChatId] = useState<string | null>(
    null
  );
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
  const [isModelPickerOpen, setIsModelPickerOpen] = useState(false);
  const [isInputCentered, setIsInputCentered] = useState(!chatId);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>(
    promptSuggestions || []
  );
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Change the prompt suggestions based on image or language model
  useEffect(() => {
    if (isImageGenerationModel(model)) {
      setCurrentSuggestions(getRandomPromptSuggestions("image"));
    } else {
      setCurrentSuggestions(promptSuggestions || []);
    }
  }, [model, promptSuggestions]);

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
    chats,
    messages: initialMessages,
    isLoadingChats,
    isLoadingMessages,
  } = useElectric({
    user,
    chatId,
    newlyCreatedChatId,
    isOnSharedPage,
  });

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
    generateId: createNewUserId,
    experimental_throttle: 100,
    body: {
      chatId: chatId ?? undefined,
      model,
      reasoningEffort,
      temporaryChat,
      customization,
      searchEnabled,
      isNewChat: Boolean(newlyCreatedChatId),
      reasoningEnabled,
    },
    headers: {
      "X-OpenRouter-Api-Key": apiKeys.openrouter ?? "",
      "X-FalAi-Api-Key": apiKeys.falai ?? "",
      "X-OpenAI-Api-Key": apiKeys.openai ?? "",
      "X-Exa-Api-Key": apiKeys.exa ?? "",
    },
  });

  useShortcuts(
    ["cmd+k", "cmd+shift+o", "cmd+/"],
    [
      () => {
        setIsSearchChatsOpen(true);
      },
      () => {
        router.push("/");
      },
      () => {
        setIsModelPickerOpen(true);
      },
    ]
  );

  const isMessageStreaming = status === "submitted" || status === "streaming";

  // Reset newlyCreatedChatId when route changes to allow fetching for new chat
  useEffect(() => {
    if (newlyCreatedChatId && chatId !== newlyCreatedChatId) {
      setNewlyCreatedChatId(null);
    }
  }, [newlyCreatedChatId, chatId]);

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

    if ((!input.trim() && attachments.length === 0) || isMessageStreaming) {
      return;
    }

    if (temporaryChat) {
      handleSubmit(e, {
        experimental_attachments: attachments,
        allowEmptySubmit: true,
      });
      clearFiles();
      return;
    }

    const userMessage = {
      id: createNewUserId(),
      role: "user" as const,
      content: input,
      createdAt: new Date(),
      parts: [{ type: "text" as const, text: input }],
      ...(attachments.length > 0 && {
        experimental_attachments: attachments,
      }),
    };

    if (!chatId) {
      const newChatId = crypto.randomUUID();
      setNewlyCreatedChatId(newChatId);
      setChatId(newChatId);

      setIsInputCentered(false);
      createChat(newChatId, userMessage);
      window.history.replaceState({}, "", `/chat/${newChatId}`);

      setInput("");
      append(userMessage);
    } else {
      setInput("");
      insertUserMessageToDb(userMessage, chatId);
      append(userMessage);
    }
    clearFiles();
  };

  const onSearchChatsOpen = () => {
    setIsSearchChatsOpen(true);
  };

  const layoutProps = {
    user,
    greeting,
    temporaryChat,
    promptSuggestions: currentSuggestions,
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
    isModelPickerOpen,
    setIsModelPickerOpen,
  };

  const chatLayoutProps = {
    isLoading: isLoadingMessages,
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
        chats={chats}
        isLoadingChats={isLoadingChats}
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
