import {
  Check,
  Copy,
  RotateCcw,
  Download,
  ExternalLink,
  GitBranch,
  Bolt,
  Cpu,
  Clock,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { memo, useState } from "react";
import type { Message } from "ai";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Markdown } from "@/components/messages/markdown";
import removeMarkdown from "remove-markdown";
import "katex/dist/katex.min.css";
import { UseChatHelpers } from "@ai-sdk/react";
import Link from "next/link";
import type {
  ImageGenerationToolInvocation,
  MessageAnnotation,
} from "@/lib/types";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { branchOffChat } from "@/lib/db/actions";
import { ReasoningBlock } from "@/components/messages/reasoning-block";
import { WebSearchBlock } from "@/components/messages/web-search-block";
import { MemoryBlock } from "@/components/messages/memory";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";
import { useMobile } from "@/components/providers/mobile-provider";

interface AssistantMessageProps {
  message: Message;
  isLastMessage: boolean;
  reload: UseChatHelpers["reload"];
  chatId: string;
  isOnSharedPage: boolean;
}

export const AssistantMessage = memo(function AssistantMessage({
  message,
  isLastMessage,
  reload,
  chatId,
  isOnSharedPage,
}: AssistantMessageProps) {
  const isError = message.id.startsWith("error-");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isMobile } = useMobile();
  const { isCopied, copyToClipboard } = useCopyClipboard();
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);

  const handleBranchOffChat = async (parentChatId: string) => {
    const newChatId = crypto.randomUUID();

    toast.promise(
      branchOffChat(parentChatId, newChatId).then(() => {
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        router.push(`/chat/${newChatId}`);
      }),
      {
        loading: "Branching...",
        success: "Chat branched off!",
        error: "Failed to branch off chat",
      }
    );
  };

  return (
    <div className="flex justify-start text-[15px]">
      <div className="group relative w-full">
        {isError ? (
          <div className="bg-destructive/10 flex justify-start rounded-lg p-3 text-[15px]">
            <div className="w-full">
              <div className="text-destructive break-words whitespace-pre-wrap">
                {message.content}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-foreground">
            {message.parts?.map((part, partIndex) => {
              if (part.type === "reasoning") {
                setIsReasoningStreaming(true);
                return (
                  <ReasoningBlock
                    key={partIndex}
                    reasoning={part.reasoning || ""}
                    isStreaming={isReasoningStreaming}
                  />
                );
              }

              if (part.type === "text") {
                setIsReasoningStreaming(false);
                return (
                  <div key={partIndex}>
                    <Markdown>{part.text}</Markdown>
                  </div>
                );
              }

              if (part.type === "tool-invocation") {
                if (part.toolInvocation.toolName === "generateImage") {
                  return (
                    <div
                      key={partIndex}
                      className="flex flex-wrap gap-2 mt-4 w-full relative max-w-[66.67%]"
                    >
                      {part.toolInvocation.state === "result" ? (
                        <div className="relative group/image">
                          <img
                            src={
                              (
                                part.toolInvocation as ImageGenerationToolInvocation
                              ).result.imageUrl
                            }
                            alt="Generated Image"
                            className="rounded-md w-full max-w-[400px] h-auto aspect-auto cursor-pointer"
                            width={400}
                            height={300}
                            loading="lazy"
                          />

                          <div className="absolute top-1 right-1 flex gap-1.5">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full h-7 w-7 !bg-black/90 hover:!bg-black/90 text-white hover:text-white opacity-0 group-hover/image:opacity-100 transition-opacity"
                                  asChild
                                >
                                  <Link
                                    href={
                                      (
                                        part.toolInvocation as ImageGenerationToolInvocation
                                      ).result.imageUrl
                                    }
                                    target="_blank"
                                  >
                                    <ExternalLink className="size-4" />
                                  </Link>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Open in new tab
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full h-7 w-7 !bg-black/90 hover:!bg-black/90 text-white hover:text-white opacity-0 group-hover/image:opacity-100 transition-opacity"
                                  onMouseDown={async (e) => {
                                    e.stopPropagation();
                                    e.preventDefault();

                                    const response = await fetch(
                                      (
                                        part.toolInvocation as ImageGenerationToolInvocation
                                      ).result.imageUrl
                                    );
                                    const blob = await response.blob();
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = "image";
                                    document.body.appendChild(a);
                                    a.click();
                                    document.body.removeChild(a);
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  <Download className="size-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                Download image
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      ) : (
                        <div>Generating image...</div>
                      )}
                    </div>
                  );
                }

                if (part.toolInvocation.toolName === "webSearch") {
                  return (
                    <WebSearchBlock
                      key={partIndex}
                      toolInvocation={part.toolInvocation}
                    />
                  );
                }

                if (part.toolInvocation.toolName === "addMemory") {
                  return (
                    <MemoryBlock
                      key={partIndex}
                      toolInvocation={part.toolInvocation}
                    />
                  );
                }
              }

              return null;
            })}
          </div>
        )}

        <div className="absolute top-full left-0 mt-1 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 items-center">
          {isLastMessage && !isOnSharedPage && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleBranchOffChat(chatId)}
                  >
                    <GitBranch className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Branch off chat</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => reload()}
                    className="h-8 w-8"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Retry message</TooltipContent>
              </Tooltip>
            </>
          )}
          {!isError &&
            !message.parts?.some(
              (part) =>
                part.type === "tool-invocation" &&
                part.toolInvocation.toolName === "generateImage"
            ) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      copyToClipboard(removeMarkdown(message.content))
                    }
                    className="h-8 w-8"
                  >
                    {isCopied ? (
                      <Check className="size-4" />
                    ) : (
                      <Copy className="size-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {isCopied ? "Copied!" : "Copy message"}
                </TooltipContent>
              </Tooltip>
            )}

          <div
            className={`text-xs text-muted-foreground flex items-center w-full`}
          >
            {message.annotations?.map((annotation, index) => {
              if (typeof annotation === "string") {
                return null;
              }
              const annotationData = annotation as MessageAnnotation;

              return (
                <div key={index} className="flex w-full items-center">
                  <span className="font-medium mr-2 truncate max-w-[40vw]">
                    {annotationData.metadata.modelName}
                  </span>
                  <div className="flex-1" />
                  {isMobile ? (
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 ml-auto"
                        >
                          <Info className="size-4 text-primary" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-fit p-3">
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Bolt className="size-3" />
                            <span>
                              {annotationData.metadata.tps.toFixed(2)} tok/s
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Cpu className="size-3" />
                            <span>
                              {annotationData.metadata.totalTokens} tokens
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="size-3" />
                            <span>
                              Time-to-first:{" "}
                              {annotationData.metadata.ttft.toFixed(2)} s
                            </span>
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  ) : (
                    <div className="flex flex-row gap-1.5 items-center">
                      <p className="inline-flex items-center">
                        <Bolt className="size-3 inline-block mr-1" />
                        {annotationData.metadata.tps.toFixed(2)} tok/s
                      </p>
                      <p className="inline-flex items-center">
                        <Cpu className="size-3 inline-block mr-1" />
                        {annotationData.metadata.totalTokens} tokens
                      </p>
                      <p className="inline-flex items-center">
                        <Clock className="size-3 inline-block mr-1" />
                        Time-to-first: {annotationData.metadata.ttft.toFixed(
                          2
                        )}{" "}
                        s
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
});
