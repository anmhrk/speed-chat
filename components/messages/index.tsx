'use client';

import { Loader2, type LucideIcon } from 'lucide-react';
import { useCustomChat } from '../providers/chat-provider';
import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import { AssistantMessage } from './assistant-message';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './conversation';
import { UserMessage } from './user-message';

export function Messages() {
  const { messages, status } = useCustomChat();

  const showLoading =
    status === 'submitted' && messages.at(-2)?.role === 'user';

  return (
    <Conversation className="overflow-hidden">
      <ConversationContent className="mx-auto max-w-3xl space-y-2 pt-10 pb-16 text-sm">
        {messages.map((message) => {
          const isLastMessage = message.id === messages.at(-1)?.id;

          return message.role === 'user' ? (
            <UserMessage key={message.id} message={message} />
          ) : (
            <AssistantMessage
              isLastMessage={isLastMessage}
              key={message.id}
              message={message}
            />
          );
        })}
        {showLoading && (
          <div className="flex justify-start">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
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
