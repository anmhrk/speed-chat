"use client";

import { ArrowUp, Globe, Loader2, Paperclip, Square, X } from "lucide-react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  memo,
  Dispatch,
  SetStateAction,
  useCallback,
} from "react";
import { Select, SelectContent, SelectItem, SelectTrigger } from "./ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useSettingsContext } from "@/contexts/settings-context";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import { Toggle } from "./ui/toggle";
import { UseChatHelpers } from "@ai-sdk/react";
import { useUploadThing } from "@/lib/utils";
import { toast } from "sonner";
import Image from "next/image";
import { deleteFiles } from "@/lib/uploadthing";
import type { FileMetadata } from "@/lib/types";

interface ChatInputProps {
  input: UseChatHelpers["input"];
  handleInputChange: UseChatHelpers["handleInputChange"];
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  stop: UseChatHelpers["stop"];
  status: UseChatHelpers["status"];
  fileMetadata: Record<string, FileMetadata>;
  setFileMetadata: Dispatch<SetStateAction<Record<string, FileMetadata>>>;
  droppedFiles?: File[];
}

export function ChatInput({
  input,
  handleInputChange,
  handleSubmit,
  stop,
  status,
  fileMetadata,
  setFileMetadata,
  droppedFiles,
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const {
    model,
    setModel,
    reasoningEffort,
    setReasoningEffort,
    hasApiKeyForProvider,
  } = useSettingsContext();

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);

  const { startUpload, routeConfig, isUploading } = useUploadThing(
    "imageUploader",
    {
      onClientUploadComplete: (res) => {
        res.forEach((file) => {
          setFileMetadata((prev) => ({
            ...prev,
            [file.name]: {
              url: file.ufsUrl,
              name: file.name,
              extension: file.type.split("/")[1],
            },
          }));
        });
      },
      onUploadError: (error: Error) => {
        console.error(error);
        toast.error("Failed to upload files");
        setFiles([]);
        setFileMetadata({});
      },
    }
  );

  const processFiles = useCallback(
    (selectedFiles: File[]) => {
      const maxFileSize = Number(
        routeConfig?.image?.maxFileSize.replace("MB", "")
      );

      if (selectedFiles.length > 0) {
        if (
          !selectedFiles.some((file) =>
            ["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(
              file.type
            )
          )
        ) {
          toast.error("Only PNG, JPEG, JPG, and WebP are supported");
          return;
        }

        // Filter out duplicates
        const uniqueFiles = selectedFiles.filter(
          (file) => !files.some((f) => f.name === file.name)
        );

        const duplicateCount = selectedFiles.length - uniqueFiles.length;
        if (duplicateCount > 0) {
          toast.info(
            `Removed ${duplicateCount} duplicate file${duplicateCount > 1 ? "s" : ""}`
          );
        }

        // Check if adding these files would exceed the limit
        if (files.length + uniqueFiles.length > 5) {
          toast.error("Too many images uploaded. Max 5 per message");
          return;
        }

        // File size limit check
        const exceedsSizeLimit = uniqueFiles.some(
          (file) => file.size > maxFileSize * 1024 * 1024
        );

        if (exceedsSizeLimit) {
          toast.error("File size exceeds the limit");
          return;
        }

        if (uniqueFiles.length > 0) {
          setFiles((prev) => [...prev, ...uniqueFiles]);
          startUpload(uniqueFiles);
        }
      }
    },
    [files, routeConfig, startUpload]
  );

  // Process files from parent component dropzone
  useEffect(() => {
    if (droppedFiles && droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [droppedFiles]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const allSelectedFiles = e.target.files ? Array.from(e.target.files) : [];
    processFiles(allSelectedFiles);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isUploading) {
        return;
      }

      (e.target as HTMLTextAreaElement).form?.requestSubmit();
      setFiles([]);
    }

    if (e.key === "Escape") {
      inputRef.current?.blur();
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-t-xl border border-b-0 p-2 max-w-3xl w-full mx-auto"
    >
      {files.length > 0 && (
        <MemoizedFilePreview
          files={files}
          setFiles={setFiles}
          fileMetadata={fileMetadata}
          setFileMetadata={setFileMetadata}
          isUploading={isUploading}
        />
      )}
      <Textarea
        ref={inputRef}
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder="Ask anything..."
        className="placeholder:text-muted-foreground !bg-transparent max-h-[250px] min-h-[70px] w-full border-0 !text-[15px] shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-1.5">
          {model && reasoningEffort && (
            <>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger variant="ghost" className="w-auto p-2 text-sm">
                  {AVAILABLE_MODELS.find((m) => m.id === model)?.name}
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.filter((m) => !m.imageGeneration)
                    .sort((a, b) => {
                      return a.id.localeCompare(b.id);
                    })
                    .map((model) => {
                      const isDisabled = !hasApiKeyForProvider(model.provider);

                      const selectItem = (
                        <SelectItem
                          key={model.id}
                          value={model.id}
                          disabled={isDisabled}
                        >
                          <div className="flex w-fit items-center gap-2">
                            <div className="flex items-center gap-2">
                              {model.icon}
                              {model.name}
                            </div>
                          </div>
                        </SelectItem>
                      );

                      if (isDisabled) {
                        return (
                          <Tooltip key={model.id}>
                            <TooltipTrigger asChild>
                              <div className="w-full">{selectItem}</div>
                            </TooltipTrigger>
                            <TooltipContent className="text-xs">
                              API key not set for provider
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return selectItem;
                    })}
                </SelectContent>
              </Select>

              {AVAILABLE_MODELS.find((m) => m.id === model)?.reasoning && (
                <Select
                  value={reasoningEffort}
                  onValueChange={setReasoningEffort}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SelectTrigger
                        className="w-auto rounded-full text-sm flex"
                        hideChevron
                      >
                        {(() => {
                          const effort = REASONING_EFFORTS.find(
                            (e) => e.id === reasoningEffort
                          );
                          if (effort) {
                            const IconComponent = effort.icon;
                            return <IconComponent className="size-4" />;
                          }
                          return null;
                        })()}
                        <span className="hidden md:block">
                          {reasoningEffort!.charAt(0).toUpperCase() +
                            reasoningEffort!.slice(1)}
                        </span>
                      </SelectTrigger>
                    </TooltipTrigger>
                    <TooltipContent>Set reasoning effort</TooltipContent>
                  </Tooltip>
                  <SelectContent>
                    {REASONING_EFFORTS.map((effort) => (
                      <SelectItem
                        key={effort.id}
                        value={effort.id}
                        className="flex items-center gap-2"
                      >
                        <effort.icon className="size-4" />
                        {effort.id.charAt(0).toUpperCase() + effort.id.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  variant="outline"
                  className="gap-1.5 rounded-full px-3 py-2 font-normal"
                >
                  <Globe className="size-4" />
                  <span className="hidden md:block">Search</span>
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>Enable web search</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className="gap-1.5 rounded-full px-3 py-2 font-normal"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="size-4" />
                <span className="hidden md:block">Attach</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Only images are supported currently</TooltipContent>
          </Tooltip>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/jpg, image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {status === "submitted" || status === "streaming" ? (
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
            disabled={!input.trim() || isUploading}
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
  setFiles,
  setFileMetadata,
  fileMetadata,
  isUploading,
}: {
  files: File[];
  setFiles: Dispatch<SetStateAction<File[]>>;
  setFileMetadata: Dispatch<SetStateAction<Record<string, FileMetadata>>>;
  fileMetadata: Record<string, FileMetadata>;
  isUploading: boolean;
}) => {
  const previews = useMemo(
    () =>
      files.map((file) => {
        return (
          <div className="relative group" key={file.name}>
            <Image
              src={URL.createObjectURL(file)}
              alt="Uploaded file"
              width={80}
              height={80}
              className="rounded-md object-cover w-20 h-20 cursor-pointer"
              loading="lazy"
              onClick={() => window.open(URL.createObjectURL(file), "_blank")}
            />
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
                onClick={async () => {
                  toast.promise(
                    deleteFiles([fileMetadata[file.name].url]).finally(() => {
                      setFiles((prev) =>
                        prev.filter((f) => f.name !== file.name)
                      );
                      setFileMetadata((prev) => {
                        const { [file.name]: _, ...rest } = prev;
                        return rest;
                      });
                    }),
                    {
                      loading: "Deleting file...",
                      success: "File deleted",
                      error: "Failed to delete file",
                    }
                  );
                }}
              >
                <X className="size-4" />
              </Button>
            )}
          </div>
        );
      }),
    [files, isUploading, fileMetadata]
  );

  return <div className="flex flex-wrap gap-2 pb-3 px-2">{previews}</div>;
};

const MemoizedFilePreview = memo(FilePreview);
