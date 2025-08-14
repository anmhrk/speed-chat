import { useMutation } from "convex/react";
import { Check, Copy, PenBox, X } from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type { MyUIMessage } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { MessageActionButton } from ".";
import { api } from "@/convex/_generated/api";
import { UseChatHelpers } from "@ai-sdk/react";
import { useCustomChat } from "@/hooks/use-custom-chat";

interface UserMessageProps {
  message: MyUIMessage;
  allMessages: MyUIMessage[];
  setMessages: UseChatHelpers<MyUIMessage>["setMessages"];
  sendMessage: UseChatHelpers<MyUIMessage>["sendMessage"];
  buildBodyAndHeaders: ReturnType<typeof useCustomChat>["buildBodyAndHeaders"];
}

export function UserMessage({
  message,
  allMessages,
  setMessages,
  sendMessage,
  buildBodyAndHeaders,
}: UserMessageProps) {
  const { copyToClipboard, isCopied } = useCopyClipboard();
  const messageContent = message.parts?.find(
    (part) => part.type === "text"
  )?.text;
  const files = message.parts?.filter((part) => part.type === "file") ?? [];

  const deleteMessages = useMutation(api.chatActions.deleteMessages);
  const deleteFiles = useMutation(api.storage.deleteFiles);

  const [isEditing, setIsEditing] = useState(false);
  const [editedMessage, setEditedMessage] = useState(messageContent);
  const editRef = useRef<HTMLTextAreaElement>(null);
  const originalMessagesRef = useRef<MyUIMessage[]>(allMessages);
  const [removedFileUrls, setRemovedFileUrls] = useState<string[]>([]);

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

  const handleEditMessage = () => {
    if (!editedMessage?.trim()) {
      handleCancelEdit();
      toast.error("Message cannot be empty");
      return;
    }

    setIsEditing(false);
    const editingMessageIndex = allMessages.findIndex(
      (m) => m.id === message.id
    );

    // Delete the edited message and all messages below it from the db and messages array
    const messagesToDelete = allMessages.slice(editingMessageIndex);
    deleteMessages({
      messageIdsToDelete: messagesToDelete.map((m) => m.id),
    });

    const updatedMessages = allMessages.slice(0, editingMessageIndex);
    setMessages(updatedMessages);

    if (removedFileUrls.length > 0) {
      deleteFiles({ fileUrls: removedFileUrls });
      setRemovedFileUrls([]);
    }

    const { body, headers } = buildBodyAndHeaders();

    sendMessage(
      {
        text: editedMessage,
        ...(files.length > 0 && {
          files,
        }),
      },
      {
        body,
        headers,
      }
    );
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedMessage(messageContent);

    // Revert to the snapshot captured at the start of editing if attachments were
    // removed while the user was editing but they decide to cancel
    if (allMessages !== originalMessagesRef.current) {
      setMessages(originalMessagesRef.current);
    }
  };

  return (
    <div className="group flex flex-col items-end gap-2 mt-4">
      <div
        className={cn(
          isEditing ? "w-full" : "max-w-[80%]",
          "rounded-lg bg-primary/5 p-3 text-secondary-foreground dark:bg-primary/10"
        )}
      >
        {message.parts?.map((part, i) => {
          const key = `${message.id}-${i}`;

          switch (part.type) {
            case "text":
              return isEditing ? (
                <Textarea
                  className="!bg-transparent w-full resize-none border-0 px-0 shadow-none focus-visible:ring-0"
                  key={key}
                  onBlur={handleCancelEdit}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      handleCancelEdit();
                    }

                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleEditMessage();
                    }
                  }}
                  ref={editRef}
                  value={editedMessage}
                />
              ) : (
                messageContent
              );

            case "file":
              return (
                <div
                  className={cn(
                    "flex items-center py-2",
                    isEditing ? "justify-between" : "justify-start"
                  )}
                  key={key}
                >
                  <Image
                    alt={part.filename ?? ""}
                    className="h-auto w-auto cursor-pointer rounded-md"
                    height={100}
                    onClick={() => window.open(part.url, "_blank")}
                    src={part.url}
                    width={100}
                  />
                  {isEditing && (
                    <Button
                      className="rounded-full"
                      onMouseDown={(e) => {
                        e.preventDefault();

                        setRemovedFileUrls((prev) => [...prev, part.url]);

                        const messageWithUpdatedParts = {
                          ...message,
                          parts: message.parts.filter(
                            (p) => p.type !== "file" || p.url !== part.url
                          ),
                        };

                        setMessages(
                          allMessages.map((m) =>
                            m.id === message.id ? messageWithUpdatedParts : m
                          )
                        );
                      }}
                      size="icon"
                      variant="outline"
                    >
                      <X />
                    </Button>
                  )}
                </div>
              );
            default:
              return null;
          }
        })}
      </div>
      <div className="flex items-center gap-2">
        <MessageActionButton
          icon={PenBox}
          label="Edit Message"
          onClick={handleSelectEdit}
        />
        <MessageActionButton
          icon={isCopied ? Check : Copy}
          label="Copy to clipboard"
          onClick={() => {
            if (messageContent) {
              copyToClipboard(messageContent);
            }
          }}
        />
      </div>
    </div>
  );
}
