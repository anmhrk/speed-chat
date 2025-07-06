import type { Message } from "ai";
import { Check, Copy, Edit, ExternalLink, FileIcon, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Textarea } from "../ui/textarea";
import Image from "next/image";
import { UseChatHelpers } from "@ai-sdk/react";
import { deleteFiles } from "@/lib/uploadthing";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";

interface UserMessageProps {
  message: Message;
  allMessages: Message[];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
  isOnSharedPage: boolean;
}

export function UserMessage({
  message,
  allMessages,
  append,
  setMessages,
  isOnSharedPage,
}: UserMessageProps) {
  const { isCopied, copyToClipboard } = useCopyClipboard();
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const originalMessagesRef = useRef<Message[]>(allMessages);
  const [removedAttachmentUrls, setRemovedAttachmentUrls] = useState<string[]>(
    []
  );

  const handleSelectEdit = () => {
    originalMessagesRef.current = allMessages;

    setIsEditing(true);
    setTimeout(() => {
      if (editRef.current) {
        editRef.current.focus();
        // Move cursor to end cos it was appearing at the start for some reason?
        const len = editRef.current.value.length;
        editRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  const handleEdit = () => {
    setIsEditing(false);

    const editedMessageIndex = allMessages.findIndex(
      (m) => m.id === message.id
    );

    const currentEditedMessage = allMessages[editedMessageIndex];

    const messagesToCheck = allMessages.slice(editedMessageIndex + 1);
    const futureAttachmentUrls = messagesToCheck.flatMap((m) =>
      m.experimental_attachments?.map((a) => a.url)
    );
    const futureToolInvocationUrls = messagesToCheck.flatMap((m) =>
      m.parts?.map((part) =>
        part.type === "tool-invocation"
          ? (part.toolInvocation as any).result.imageUrl
          : null
      )
    );

    const urlsToDelete = [
      ...removedAttachmentUrls,
      ...futureAttachmentUrls,
      ...futureToolInvocationUrls,
    ].filter((url): url is string => Boolean(url));

    if (urlsToDelete.length > 0) {
      deleteFiles(urlsToDelete);
    }

    allMessages.splice(editedMessageIndex);

    append({
      id: message.id,
      role: "user",
      content: editedMessage,
      experimental_attachments:
        currentEditedMessage.experimental_attachments ?? [],
    });
    setRemovedAttachmentUrls([]);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMessage(message.content);
    setRemovedAttachmentUrls([]);

    // Revert to the snapshot captured at the start of editing if attachments were
    // removed while the user was editing but they decide to cancel
    if (allMessages !== originalMessagesRef.current) {
      setMessages(originalMessagesRef.current);
    }
  };

  return (
    <div className="flex justify-end text-[15px]">
      <div
        className={cn("group relative max-w-[66.67%]", isEditing && "w-full")}
      >
        <div
          className={cn(
            isEditing ? "bg-primary/20 w-full" : "bg-accent",
            "rounded-lg px-4 py-3"
          )}
        >
          <div className="break-words whitespace-pre-wrap">
            {isEditing ? (
              <Textarea
                ref={editRef}
                value={editedMessage}
                onChange={(e) => setEditedMessage(e.target.value)}
                className="w-full resize-none border-0 !bg-transparent shadow-none focus-visible:ring-0"
                onBlur={(e) => {
                  // Don't exit editing if user clicked on an attachment removal button
                  const relatedTarget = e.relatedTarget as HTMLElement;
                  if (relatedTarget?.closest("[data-attachment-remove]")) {
                    return;
                  }

                  handleCancelEdit();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    handleCancelEdit();
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleEdit();
                  }
                }}
              />
            ) : (
              message.content
            )}
          </div>

          {message.experimental_attachments && (
            <div
              className={cn(
                "mt-4 relative",
                isEditing ? "flex flex-col gap-2" : "flex flex-wrap gap-2"
              )}
            >
              {message.experimental_attachments.map((attachment, index) => (
                <div
                  key={`${message.id}-attachment-${index}`}
                  className={cn(
                    "flex items-center gap-2",
                    isEditing && "justify-between w-full"
                  )}
                >
                  {attachment.contentType?.startsWith("image/") ? (
                    <Image
                      src={attachment.url}
                      alt={attachment.name ?? "Attachment"}
                      className={cn(
                        "rounded-md aspect-auto h-auto cursor-pointer",
                        isEditing ? "max-w-[350px]" : "max-w-full"
                      )}
                      onClick={() => window.open(attachment.url, "_blank")}
                      width={400}
                      height={300}
                    />
                  ) : (
                    <Link
                      href={attachment.url}
                      target="_blank"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-background hover:bg-background/60 transition-colors cursor-pointer text-sm"
                    >
                      <FileIcon className="size-4 flex-shrink-0" />
                      <span className="truncate max-w-[200px]">
                        {attachment.name ?? "File"}
                      </span>
                      <ExternalLink className="size-4 flex-shrink-0" />
                    </Link>
                  )}

                  {isEditing && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full !bg-black/90 hover:!bg-black/90 text-white hover:text-white flex-shrink-0"
                      data-attachment-remove
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        e.preventDefault();

                        setRemovedAttachmentUrls((prev) => [
                          ...prev,
                          attachment.url,
                        ]);

                        const messageWithoutAttachment = {
                          ...message,
                          experimental_attachments:
                            message.experimental_attachments?.filter(
                              (a) => a.url !== attachment.url
                            ),
                        };

                        setMessages(
                          allMessages.map((m) =>
                            m.id === message.id ? messageWithoutAttachment : m
                          )
                        );
                      }}
                    >
                      <X className="size-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="absolute top-full right-0 mt-1 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
          {!isOnSharedPage && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSelectEdit}
                  className="h-8 w-8"
                >
                  <Edit className="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Edit message</TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => copyToClipboard(message.content)}
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
        </div>
      </div>
    </div>
  );
}
