import type { UseChatHelpers } from '@ai-sdk/react';
import type { LucideIcon } from 'lucide-react';
import type { useCustomChat } from '@/hooks/use-custom-chat';
import type { MyUIMessage } from '@/lib/types';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { AssistantMessage } from './assistant-message';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './conversation';
import { UserMessage } from './user-message';

type MessagesProps = {
  messages: MyUIMessage[];
  sendMessage: UseChatHelpers<MyUIMessage>['sendMessage'];
  setMessages: UseChatHelpers<MyUIMessage>['setMessages'];
  regenerate: UseChatHelpers<MyUIMessage>['regenerate'];
  buildBodyAndHeaders: ReturnType<typeof useCustomChat>['buildBodyAndHeaders'];
  status: UseChatHelpers<MyUIMessage>['status'];
  currentChatId: string;
  error: UseChatHelpers<MyUIMessage>['error'];
};

export function Messages({
  messages,
  sendMessage,
  setMessages,
  regenerate,
  buildBodyAndHeaders,
  status,
  currentChatId,
  error,
}: MessagesProps) {
  // Show loader when:
  // 1. Status is "submitted" and last message is user (waiting for assistant response)
  // 2. Last message is assistant but has no content yet (empty assistant message)
  const showLoader =
    (status === 'submitted' &&
      messages.length > 0 &&
      messages.at(-1)?.role === 'user') ||
    (messages.length > 0 &&
      messages.at(-1)?.role === 'assistant' &&
      (!messages.at(-1)?.parts || messages.at(-1)?.parts?.length === 0));

  return (
    <Conversation className="overflow-hidden">
      <ConversationContent className="mx-auto max-w-3xl pt-10 pb-16 text-sm">
        {messages
          .filter((message) => {
            // Don't render empty assistant messages - the loader will handle the visual feedback
            if (
              message.role === 'assistant' &&
              (!message.parts || message.parts.length === 0)
            ) {
              return false;
            }
            return true;
          })
          .map((message) => {
            const isLastMessage = message.id === messages.at(-1)?.id;

            return message.role === 'user' ? (
              <UserMessage
                allMessages={messages}
                buildBodyAndHeaders={buildBodyAndHeaders}
                key={message.id}
                message={message}
                sendMessage={sendMessage}
                setMessages={setMessages}
              />
            ) : (
              <AssistantMessage
                buildBodyAndHeaders={buildBodyAndHeaders}
                currentChatId={currentChatId}
                isLastMessage={isLastMessage}
                key={message.id}
                message={message}
                regenerate={regenerate}
              />
            );
          })}
        {error && (
          <div className="flex flex-col items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950">
            <div className="text-red-600 text-sm dark:text-red-400">
              {error.message ||
                'An error occurred while generating the response'}
            </div>
            <Button
              className="border-red-200 text-red-600 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900"
              onClick={() => {
                setMessages(messages.slice(0, -1)); // Remove last message (which is the error)
                regenerate({
                  body: buildBodyAndHeaders().body,
                  headers: buildBodyAndHeaders().headers,
                });
              }}
              size="sm"
              variant="outline"
            >
              Retry
            </Button>
          </div>
        )}
        {showLoader && !error && (
          <div className="mt-4 flex space-x-1">
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/20" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/20 [animation-delay:0.15s]" />
            <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary/20 [animation-delay:0.3s]" />
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
