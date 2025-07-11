"use client";

import { Header } from "@/components/header";
import { useRouter } from "next/navigation";
import type { User } from "better-auth";
import { useEffect, useRef, useState } from "react";
import { SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/sidebar";
import { Upload } from "lucide-react";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { useAttachments } from "@/hooks/use-attachments";
import { useShortcuts } from "@/hooks/use-shortcuts";
import { SearchChats } from "@/components/search-chats";
import { ChatLayout } from "@/components/layouts/chat-layout";
import { HomepageLayout } from "@/components/layouts/homepage-layout";
import { getRandomPromptSuggestions } from "@/lib/random";
import { isImageGenerationModel } from "@/lib/models";
import { useElectricChat } from "@/hooks/use-electric-chat";

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
  const router = useRouter();
  const { model } = useSettingsContext();
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
  const {
    chats,
    localMessages,
    temporaryChat,
    chatId,
    isInputCentered,
    isLoadingChats,
    isLoadingMessages,
    handleChatSubmit,
    setSearchEnabled,
    isMessageStreaming,
    input,
    setInput,
    handleInputChange,
    stop,
    status,
    reload,
    append,
    setMessages,
    searchEnabled,
  } = useElectricChat({
    user,
    initialChatId,
    isOnSharedPage,
    didUserCreate,
    attachments,
    clearFiles,
  });
  const [isSearchChatsOpen, setIsSearchChatsOpen] = useState(false);
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
  };

  const chatLayoutProps = {
    isLoadingMessages,
    messages: localMessages,
    status,
    reload,
    append,
    setMessages,
    chatId: chatId ?? "",
    ...layoutProps,
  };

  const onSearchChatsOpen = () => {
    setIsSearchChatsOpen(true);
  };

  return (
    <>
      <AppSidebar
        chats={chats}
        isLoadingChats={isLoadingChats}
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
