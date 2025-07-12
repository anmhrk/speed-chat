import { ChatInput } from "@/components/chat-input";
import { WelcomeSection } from "@/components/welcome-section";
import { Suggestions } from "@/components/suggestions";
import type { User } from "better-auth";
import type { FileMetadata } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import { UseChatHelpers } from "@ai-sdk/react";
import { useMobile } from "@/hooks/use-mobile";

interface HomepageLayoutProps {
  user: User | null;
  greeting?: string;
  temporaryChat: boolean;
  promptSuggestions?: string[];
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  setInput: UseChatHelpers["setInput"];
  input: UseChatHelpers["input"];
  handleInputChange: UseChatHelpers["handleInputChange"];
  handleChatSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: UseChatHelpers["stop"];
  isMessageStreaming: boolean;
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
  isOnSharedPage: boolean;
  isModelPickerOpen: boolean;
  setIsModelPickerOpen: Dispatch<SetStateAction<boolean>>;
}

export function HomepageLayout({
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
  isOnSharedPage,
  isModelPickerOpen,
  setIsModelPickerOpen,
}: HomepageLayoutProps) {
  const { isMobile } = useMobile();

  return (
    <>
      {isMobile ? (
        <>
          <div className="flex-1 flex items-center justify-center px-3">
            <div className="flex flex-col gap-4 mx-auto max-w-3xl w-full items-center">
              <WelcomeSection
                user={user}
                greeting={greeting}
                temporaryChat={temporaryChat}
                className={temporaryChat ? "mb-8" : "mb-4"}
              />
              {!temporaryChat && (
                <Suggestions
                  inputRef={inputRef}
                  setInput={setInput}
                  promptSuggestions={promptSuggestions}
                />
              )}
            </div>
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
      ) : (
        <div className="h-full flex items-center justify-center px-3">
          <div className="flex flex-col gap-6 mx-auto max-w-3xl w-full items-center">
            <WelcomeSection
              user={user}
              greeting={greeting}
              temporaryChat={temporaryChat}
              className={temporaryChat ? "mb-2" : "mb-4"}
            />
            <div className="w-full max-w-3xl">
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
            {!temporaryChat && (
              <Suggestions
                inputRef={inputRef}
                setInput={setInput}
                promptSuggestions={promptSuggestions}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
