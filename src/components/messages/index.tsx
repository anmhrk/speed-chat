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
  currentChatId: string;
}

export function Messages({
  messages,
  sendMessage,
  setMessages,
  regenerate,
  buildBodyAndHeaders,
  currentChatId,
}: MessagesProps) {
  return (
    <Conversation className="overflow-hidden">
      <ConversationContent className="mx-auto max-w-3xl pt-10 pb-16 text-sm">
        {messages.map((message) => {
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
            />
          );
        })}
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
