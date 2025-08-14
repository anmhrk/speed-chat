import { MyUIMessage } from "@/lib/types";
import { UseChatHelpers } from "@ai-sdk/react";
import { AssistantMessage } from "./assistant-message";
import { UserMessage } from "./user-message";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "./conversation";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Button } from "../ui/button";
import type { LucideIcon } from "lucide-react";
import { useCustomChat } from "@/hooks/use-custom-chat";

interface MessagesProps {
  messages: MyUIMessage[];
  sendMessage: UseChatHelpers<MyUIMessage>["sendMessage"];
  setMessages: UseChatHelpers<MyUIMessage>["setMessages"];
  regenerate: UseChatHelpers<MyUIMessage>["regenerate"];
  buildBodyAndHeaders: ReturnType<typeof useCustomChat>["buildBodyAndHeaders"];
  status: UseChatHelpers<MyUIMessage>["status"];
  currentChatId: string;
}

export function Messages({
  messages,
  sendMessage,
  setMessages,
  regenerate,
  buildBodyAndHeaders,
  status,
  currentChatId,
}: MessagesProps) {
  // Show loader when:
  // 1. Status is "submitted" and last message is user (waiting for assistant response)
  // 2. Last message is assistant but has no content yet (empty assistant message)
  const showLoader =
    (status === "submitted" &&
      messages.length > 0 &&
      messages.at(-1)?.role === "user") ||
    (messages.length > 0 &&
      messages.at(-1)?.role === "assistant" &&
      (!messages.at(-1)?.parts || messages.at(-1)?.parts?.length === 0));

  return (
    <Conversation className="overflow-hidden">
      <ConversationContent className="mx-auto max-w-3xl pt-10 pb-16 text-sm">
        {messages
          .filter((message) => {
            // Don't render empty assistant messages - the loader will handle the visual feedback
            if (
              message.role === "assistant" &&
              (!message.parts || message.parts.length === 0)
            ) {
              return false;
            }
            return true;
          })
          .map((message) => {
            const isLastMessage = message.id === messages.at(-1)?.id;

            return message.role === "user" ? (
              <UserMessage
                key={message.id}
                allMessages={messages}
                message={message}
                setMessages={setMessages}
                sendMessage={sendMessage}
                buildBodyAndHeaders={buildBodyAndHeaders}
              />
            ) : (
              <AssistantMessage
                isLastMessage={isLastMessage}
                key={message.id}
                message={message}
                regenerate={regenerate}
                buildBodyAndHeaders={buildBodyAndHeaders}
                currentChatId={currentChatId}
                status={status}
              />
            );
          })}
        {showLoader && (
          <div className="flex space-x-1 mt-4">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/20"></div>
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/20 [animation-delay:0.15s]"></div>
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/20 [animation-delay:0.3s]"></div>
          </div>
        )}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}

export function MessageActionButton({
  onClick,
  label,
  icon: Icon,
}: {
  onClick: () => void;
  label: string;
  icon: LucideIcon;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div>
          <Button
            className="opacity-0 transition-opacity group-hover:opacity-100"
            onClick={onClick}
            size="icon"
            variant="ghost"
          >
            <Icon className="size-4" />
            <span className="sr-only">{label}</span>
          </Button>
        </div>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
