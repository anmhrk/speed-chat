import type { Message } from "ai";
import { AssistantMessage } from "@/components/messages/assistant-message";
import { UserMessage } from "@/components/messages/user-message";
import {
  AIConversation,
  AIConversationContent,
  AIConversationScrollButton,
} from "@/components/ui/kibo-ui/ai/conversation";
import { UseChatHelpers } from "@ai-sdk/react";
import { Spinner } from "@/components/ui/kibo-ui/spinner";

interface MessagesProps {
  allMessages: Message[];
  status: UseChatHelpers["status"];
  reload: UseChatHelpers["reload"];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
  chatId: string;
  isOnSharedPage: boolean;
}

export function Messages({
  allMessages,
  status,
  reload,
  append,
  setMessages,
  chatId,
  isOnSharedPage,
}: MessagesProps) {
  const showLoading =
    status === "submitted" &&
    allMessages[allMessages.length - 1].role === "user";

  return (
    <AIConversation className="relative size-full">
      <div className="absolute max-w-[750px] mx-auto top-0 left-0 right-0 h-2 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
      <AIConversationContent className="flex w-full flex-col gap-10 max-w-[750px] mx-auto pb-16 pt-8 px-5 md:px-0">
        {allMessages.map((message) => (
          <div key={message.id} className="w-full">
            {message.role === "user" ? (
              <UserMessage
                message={message}
                allMessages={allMessages}
                append={append}
                setMessages={setMessages}
                isOnSharedPage={isOnSharedPage}
              />
            ) : (
              <AssistantMessage
                message={message}
                isLastMessage={
                  message.id === allMessages[allMessages.length - 1]?.id
                }
                reload={reload}
                chatId={chatId}
                isOnSharedPage={isOnSharedPage}
              />
            )}
          </div>
        ))}
        {showLoading && <Spinner variant="ellipsis" />}
        <div className="absolute max-w-[750px] mx-auto bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />
      </AIConversationContent>
      <AIConversationScrollButton />
    </AIConversation>
  );
}
