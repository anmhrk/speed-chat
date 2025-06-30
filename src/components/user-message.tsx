import type { Message } from "ai";
import { Check, Copy, Edit } from "lucide-react";
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
import { deleteFile } from "@/lib/uploadthing";

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

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    toast.success("Copied to clipboard");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSelectEdit = () => {
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

  const handleEdit = async () => {
    setIsEditing(false);

    const editedMessageIndex = allMessages.findIndex(
      (m) => m.id === message.id
    );

    const messagesToCheck = allMessages.slice(editedMessageIndex);
    const fileKeys = messagesToCheck.flatMap((m) =>
      m.experimental_attachments?.map((a) => a.url.split("/f/").pop())
    );

    // Don't await to not block the UI
    if (fileKeys.length > 0) {
      Promise.all(
        fileKeys.map((key) => {
          if (key) {
            deleteFile(key);
          }
        })
      );
    }

    // Remove all messages after the edited message including the edited message
    allMessages.splice(editedMessageIndex);

    setMessages(allMessages);
    append({
      id: message.id,
      role: "user",
      content: editedMessage,
    });
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
                onBlur={() => {
                  setIsEditing(false);
                  setEditedMessage(message.content);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setIsEditing(false);
                    setEditedMessage(message.content);
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
            <div className="flex flex-wrap gap-2 mt-4">
              {message.experimental_attachments
                ?.filter((attachment) =>
                  attachment.contentType?.startsWith("image/")
                )
                .map((attachment, index) => (
                  <Image
                    key={`${message.id}-attachment-${index}`}
                    src={attachment.url}
                    alt={attachment.name ?? "Attachment"}
                    width={100}
                    height={100}
                    className="rounded-md w-40 h-40 object-cover"
                    loading="lazy"
                  />
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
