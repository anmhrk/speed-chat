import { ChatInput } from "@/components/chat-input";
import { Messages } from "@/components/messages";
import type { Message } from "ai";
import type { User } from "better-auth";
import type { FileMetadata } from "@/lib/types";
import { UseChatHelpers } from "@ai-sdk/react";
import { Dispatch, SetStateAction } from "react";

interface ChatLayoutProps {
  isLoading: boolean;
  messages: UseChatHelpers["messages"];
  initialMessages: Message[] | undefined;
  status: UseChatHelpers["status"];
  reload: UseChatHelpers["reload"];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
  chatId: string;
  isOnSharedPage: boolean;
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
  handleInputChange: UseChatHelpers["handleInputChange"];
  handleChatSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: UseChatHelpers["stop"];
  isMessageStreaming: boolean;
  user: User | null;
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  fileMetadata: Record<string, FileMetadata>;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (fileName: string) => void;
  acceptsPdf: boolean;
  searchEnabled: boolean;
  setSearchEnabled: Dispatch<SetStateAction<boolean>>;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  isModelPickerOpen: boolean;
  setIsModelPickerOpen: Dispatch<SetStateAction<boolean>>;
}

export function ChatLayout({
  isLoading,
  messages,
  initialMessages,
  status,
  reload,
  append,
  setMessages,
  chatId,
  isOnSharedPage,
  input,
  setInput,
  handleInputChange,
  handleChatSubmit,
  stop,
  isMessageStreaming,
  user,
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
  inputRef,
  isModelPickerOpen,
  setIsModelPickerOpen,
}: ChatLayoutProps) {
  const hasMessages =
    messages.length > 0 || (initialMessages && initialMessages.length > 0);

  return (
    <>
      <div className="flex-1 min-h-0 relative">
        {!isLoading && hasMessages && (
          <Messages
            allMessages={messages}
            status={status}
            reload={reload}
            append={append}
            setMessages={setMessages}
            chatId={chatId}
            isOnSharedPage={isOnSharedPage}
          />
        )}
      </div>
      <div className="shrink-0 px-3 pb-3">
        <ChatInput
          input={input}
          setInput={setInput}
          handleInputChange={handleInputChange}
          handleSubmit={handleChatSubmit}
          stop={stop}
          isMessageStreaming={isMessageStreaming}
          user={user}
          files={files}
          setFiles={setFiles}
          fileMetadata={fileMetadata}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          removeFile={removeFile}
          acceptsPdf={acceptsPdf}
          searchEnabled={searchEnabled}
          setSearchEnabled={setSearchEnabled}
          isOnSharedPage={isOnSharedPage}
          inputRef={inputRef}
          isModelPickerOpen={isModelPickerOpen}
          setIsModelPickerOpen={setIsModelPickerOpen}
        />
      </div>
    </>
  );
}
