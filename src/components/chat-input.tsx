"use client";

import {
  ArrowUp,
  Brain,
  File,
  Globe,
  Images,
  Loader2,
  Paperclip,
  Square,
  X,
} from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
} from "./ui/select";
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
import { ScrollArea } from "./ui/scroll-area";

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
    isHydrated,
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
      className="rounded-2xl bg-muted/20 dark:bg-muted/30 border p-2 max-w-3xl w-full mx-auto"
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
        className="placeholder:text-muted-foreground !bg-transparent max-h-[250px] min-h-[75px] w-full border-0 !text-[15px] shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between px-1 pt-2">
        <div className="flex items-center gap-1.5">
          {isHydrated && model && reasoningEffort && (
            <>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger variant="ghost">
                  <div className="flex items-center gap-2.5">
                    {AVAILABLE_MODELS.find((m) => m.id === model)?.icon}
                    <span className="font-normal text-sm">
                      {AVAILABLE_MODELS.find((m) => m.id === model)?.name}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="min-w-[400px] p-2 border backdrop-blur-xl shadow-xl rounded-2xl">
                  <ScrollArea className="h-[460px]">
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="px-3 py-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Chat Models
                          </h4>
                        </div>
                        <div className="space-y-0.5">
                          {AVAILABLE_MODELS.filter((m) => !m.imageGeneration)
                            .sort((a, b) => {
                              return a.id.localeCompare(b.id);
                            })
                            .map((model) => (
                              <SelectItem
                                key={model.id}
                                value={model.id}
                                className="rounded-xl mx-1 px-3 py-3 hover:bg-accent/50 transition-all duration-200 cursor-pointer border-0"
                                disabled={
                                  !hasApiKeyForProvider(model.providerId)
                                }
                              >
                                <div className="flex items-center justify-between w-90">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      {model.icon}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">
                                        {model.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground capitalize">
                                        {model.providerName}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {model.reasoning && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-blue-600 dark:from-blue-900/30 dark:to-blue-800/40 dark:text-blue-400 shadow-sm">
                                            <Brain className="h-3.5 w-3.5" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Has reasoning capabilities
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {model.pdfInput && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 text-purple-600 dark:from-purple-900/30 dark:to-purple-800/40 dark:text-purple-400 shadow-sm">
                                            <File className="h-3.5 w-3.5" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          PDF attachment support
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {model.imageInput && (
                                      <Tooltip>
                                        <TooltipTrigger>
                                          <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-br from-cyan-100 to-cyan-200 text-cyan-600 dark:from-cyan-900/30 dark:to-cyan-800/40 dark:text-cyan-400 shadow-sm">
                                            <Images className="h-3.5 w-3.5" />
                                          </div>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          Image attachment support
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      </div>

                      <SelectSeparator />

                      <div className="space-y-1">
                        <div className="px-3 py-2">
                          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Image Models
                          </h4>
                        </div>
                        <div className="space-y-0.5">
                          {AVAILABLE_MODELS.filter((m) => m.imageGeneration)
                            .sort((a, b) => {
                              return a.id.localeCompare(b.id);
                            })
                            .map((model) => (
                              <SelectItem
                                key={model.id}
                                value={model.id}
                                className="rounded-xl mx-1 px-3 py-3 hover:bg-accent/50 transition-all duration-200 cursor-pointer border-0"
                                disabled={
                                  !hasApiKeyForProvider(model.providerId)
                                }
                              >
                                <div className="flex items-center w-90">
                                  <div className="flex items-center gap-3">
                                    <div className="flex-shrink-0">
                                      {model.icon}
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="font-medium text-sm">
                                        {model.name}
                                      </span>
                                      <span className="text-xs text-muted-foreground capitalize">
                                        {model.providerName}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
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
                      <SelectItem key={effort.id} value={effort.id}>
                        <div className="flex items-center gap-2">
                          <effort.icon className="size-4" />
                          {effort.id.charAt(0).toUpperCase() +
                            effort.id.slice(1)}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </>
          )}

          {AVAILABLE_MODELS.find((m) => m.id === model)?.search && (
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
          )}

          {AVAILABLE_MODELS.find((m) => m.id === model)?.imageInput && (
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
              <TooltipContent>
                Only images are supported currently
              </TooltipContent>
            </Tooltip>
          )}

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
