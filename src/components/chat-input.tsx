"use client";

import {
  ArrowUp,
  Globe,
  Loader2,
  Paperclip,
  Square,
  X,
  FileIcon,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useEffect, useRef, useMemo, memo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { AVAILABLE_MODELS } from "@/lib/models";
import { Toggle } from "./ui/toggle";
import { UseChatHelpers } from "@ai-sdk/react";
import Image from "next/image";
import { ModelPicker } from "./model-picker";
import type { User } from "better-auth";
import type { FileMetadata } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";

interface ChatInputProps {
  input: UseChatHelpers["input"];
  handleInputChange: UseChatHelpers["handleInputChange"];
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
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
  isOnSharedPage: boolean;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  stop,
  isMessageStreaming,
  user,
  files,
  fileMetadata,
  isUploading,
  fileInputRef,
  handleFileChange,
  removeFile,
  acceptsPdf,
  searchEnabled,
  setSearchEnabled,
  isOnSharedPage,
  inputRef,
}: ChatInputProps) {
  const { model, apiKeys } = useSettingsContext();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isUploading) {
        return;
      }

      (e.target as HTMLTextAreaElement).form?.requestSubmit();
    }

    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl bg-muted/20 dark:bg-muted/30 border p-2 max-w-3xl w-full mx-auto"
    >
      {files.length > 0 && (
        <MemoizedFilePreview
          files={files}
          fileMetadata={fileMetadata}
          isUploading={isUploading}
          removeFile={removeFile}
        />
      )}
      <Textarea
        ref={inputRef}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="placeholder:text-muted-foreground !bg-transparent max-h-[250px] min-h-[75px] w-full border-0 !text-[15px] shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-1.5">
          <ModelPicker hasFilesUploaded={files.length > 0} />
          {AVAILABLE_MODELS.find((m) => m.id === model)?.search && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Toggle
                    variant="outline"
                    className="gap-1.5 rounded-full px-3 py-2 font-normal"
                    pressed={searchEnabled}
                    onPressedChange={(pressed) => setSearchEnabled(pressed)}
                    disabled={isOnSharedPage || !user || !apiKeys.exa}
                  >
                    <Globe className="size-4" />
                    <span className="hidden md:block">Search</span>
                  </Toggle>
                </div>
              </TooltipTrigger>

              <TooltipContent>
                {user
                  ? apiKeys.exa
                    ? "Enable web search"
                    : "EXA_API_KEY not set"
                  : "Please login first"}
              </TooltipContent>
            </Tooltip>
          )}

          {AVAILABLE_MODELS.find((m) => m.id === model)?.imageInput && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-1.5 rounded-full px-3 py-2 font-normal"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isOnSharedPage || !user}
                  >
                    <Paperclip className="size-4" />
                    <span className="hidden md:block">Attach</span>
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {user
                  ? `Only images ${acceptsPdf ? "and PDFs" : ""} are supported currently`
                  : "Please login first"}
              </TooltipContent>
            </Tooltip>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={`image/png, image/jpeg, image/jpg, image/webp${
              acceptsPdf ? ", application/pdf" : ""
            }`}
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {isMessageStreaming ? (
          <Button
            size="icon"
            onClick={stop}
            className="bg-muted-foreground hover:bg-muted-foreground/80 h-8 w-8"
          >
            <Square className="size-6" />
          </Button>
        ) : (
          <Button
            type="submit"
            size="icon"
            disabled={isOnSharedPage || !input.trim() || isUploading}
            className="h-8 w-8"
          >
            <ArrowUp className="size-6" />
          </Button>
        )}
      </div>
    </form>
  );
}

const FilePreview = ({
  files,
  fileMetadata,
  isUploading,
  removeFile,
}: {
  files: File[];
  fileMetadata: Record<string, FileMetadata>;
  isUploading: boolean;
  removeFile: (fileName: string) => void;
}) => {
  const previews = useMemo(
    () =>
      files.map((file) => {
        return (
          <div className="relative group" key={file.name}>
            {file.type.startsWith("image/") ? (
              <Image
                src={URL.createObjectURL(file)}
                alt="Uploaded file"
                width={80}
                height={80}
                className="rounded-md object-cover w-20 h-20 cursor-pointer"
                loading="lazy"
                onClick={() => window.open(URL.createObjectURL(file), "_blank")}
              />
            ) : (
              <Link
                href={URL.createObjectURL(file)}
                target="_blank"
                className="flex flex-col items-center justify-between w-20 h-20 rounded-md bg-background hover:bg-background/60 transition-colors cursor-pointer text-xs gap-1 p-2"
              >
                <FileIcon className="size-6 flex-shrink-0 mt-3" />
                <span className="truncate max-w-full text-center">
                  {file.name ?? "File"}
                </span>
              </Link>
            )}
            {isUploading && !fileMetadata[file.name] && (
              <div className="absolute top-0 right-0 left-0 bottom-0 flex items-center justify-center bg-black/50 rounded-md">
                <Loader2 className="size-6 animate-spin text-white" />
              </div>
            )}
            {!(isUploading && !fileMetadata[file.name]) && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute rounded-full top-0 right-0 h-6 w-6 !bg-black/90 hover:!bg-black/90 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeFile(file.name)}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        );
      }),
    [files, isUploading, fileMetadata, removeFile]
  );

  return <div className="flex flex-wrap gap-2 pb-3 px-2">{previews}</div>;
};

const MemoizedFilePreview = memo(FilePreview);
