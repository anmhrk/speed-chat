"use client";

import {
  ArrowUp,
  Globe,
  Loader2,
  Paperclip,
  Square,
  X,
  FileIcon,
  WandSparkles,
  Mic,
  MicOff,
} from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useEffect, useMemo, memo, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { supportsWebSearch, supportsImageInput } from "@/lib/ai/models";
import { Toggle } from "./ui/toggle";
import { UseChatHelpers } from "@ai-sdk/react";
import Image from "next/image";
import { ModelPicker } from "./model-picker";
import type { User } from "better-auth";
import type { FileMetadata } from "@/lib/types";
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { enhancePrompt } from "@/lib/actions";
import { isImageGenerationModel } from "@/lib/ai/models";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { toast } from "sonner";

interface ChatInputProps {
  input: UseChatHelpers["input"];
  setInput: UseChatHelpers["setInput"];
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
  isModelPickerOpen: boolean;
  setIsModelPickerOpen: Dispatch<SetStateAction<boolean>>;
}

export function ChatInput({
  input,
  setInput,
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
  isModelPickerOpen,
  setIsModelPickerOpen,
}: ChatInputProps) {
  const { model, apiKeys, hasAnyKey } = useSettingsContext();
  const [enhancingPrompt, setEnhancingPrompt] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isUploading || enhancingPrompt || listening) {
        return;
      }

      (e.target as HTMLTextAreaElement).form?.requestSubmit();
    }

    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    isMicrophoneAvailable,
    resetTranscript,
  } = useSpeechRecognition();

  useEffect(() => {
    if (transcript && listening) {
      setInput(transcript);
    }
  }, [transcript, setInput, listening]);

  useEffect(() => {
    if (!listening && transcript) {
      resetTranscript();
    }
  }, [listening, transcript, resetTranscript]);

  useEffect(() => {
    if (!isMicrophoneAvailable) {
      toast.error(
        "Microphone permission denied. Please allow access from browser settings."
      );
    }
  }, [isMicrophoneAvailable]);

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
          <ModelPicker
            hasFilesUploaded={files.length > 0}
            isModelPickerOpen={isModelPickerOpen}
            setIsModelPickerOpen={setIsModelPickerOpen}
          />
          {supportsWebSearch(model) && (
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

          {/* Right now just checking image input cos pdf is supported only when image is supported, atleast for now */}
          {supportsImageInput(model) && (
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
          <div className="flex items-center gap-1.5">
            {input.length > 30 && hasAnyKey() && user && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={async (e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setEnhancingPrompt(true);
                      try {
                        const newPrompt = await enhancePrompt(
                          input,
                          apiKeys.openrouter,
                          isImageGenerationModel(model)
                        );
                        setInput(newPrompt);
                      } catch (error) {
                        console.error("Error enhancing prompt:", error);
                      } finally {
                        setEnhancingPrompt(false);
                      }
                    }}
                  >
                    {enhancingPrompt ? (
                      <Loader2 className="size-5 animate-spin" />
                    ) : (
                      <WandSparkles className="size-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {enhancingPrompt
                    ? "Enhancing prompt..."
                    : "Enhance this prompt"}
                </TooltipContent>
              </Tooltip>
            )}

            {isMounted && browserSupportsSpeechRecognition && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      if (listening) {
                        SpeechRecognition.stopListening();
                      } else {
                        SpeechRecognition.startListening({
                          continuous: true,
                          language: "en-US",
                          interimResults: true,
                        });
                      }
                    }}
                  >
                    {listening ? (
                      <MicOff className="size-5 text-red-500" />
                    ) : (
                      <Mic className="size-5" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {listening
                    ? "Stop recording"
                    : "Start voice input. Might not work on all browsers."}
                </TooltipContent>
              </Tooltip>
            )}
            <Button
              type="submit"
              size="icon"
              disabled={
                isOnSharedPage ||
                (!input.trim() && !files.length) ||
                isUploading ||
                enhancingPrompt ||
                listening
              }
              className="h-8 w-8"
            >
              <ArrowUp className="size-6" />
            </Button>
          </div>
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
