import type { Message } from "ai";
import { Check, Copy, Edit, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRef, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "./ui/textarea";
import Image from "next/image";
import { UseChatHelpers } from "@ai-sdk/react";
import { deleteFiles } from "@/lib/uploadthing";

interface UserMessageProps {
  message: Message;
  allMessages: Message[];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
}

export function UserMessage({
  message,
  allMessages,
  append,
  setMessages,
}: UserMessageProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(message.content);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const originalMessagesRef = useRef<Message[]>(allMessages);
  const [removedAttachmentUrls, setRemovedAttachmentUrls] = useState<string[]>(
    []
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            <div className="flex flex-wrap gap-2 mt-4 relative">
              {message.experimental_attachments
                ?.filter((attachment) =>
                  attachment.contentType?.startsWith("image/")
                )
                .map((attachment, index) => (
                  <div
                    key={`${message.id}-attachment-${index}`}
                    className="relative"
                  >
                    <Image
                      src={attachment.url}
                      alt={attachment.name ?? "Attachment"}
                      width={800}
                      height={600}
                      className="rounded-md max-w-full h-auto cursor-pointer"
                      loading="lazy"
                      onClick={() => window.open(attachment.url, "_blank")}
                    />

                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute rounded-full top-1 right-1 h-8 w-8 !bg-black/90 hover:!bg-black/90 text-white hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
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
                        <X className="size-5" />
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        <div className="absolute top-full right-0 mt-1 flex gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
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

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCopy}
                className="h-8 w-8"
              >
                {copied ? (
                  <Check className="size-4" />
                ) : (
                  <Copy className="size-4" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {copied ? "Copied!" : "Copy message"}
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}
