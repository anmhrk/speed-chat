import type { UIMessage } from 'ai';
import { Check, Copy, GitBranch, RefreshCcw } from 'lucide-react';
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';
import { useCustomChat } from '../providers/chat-provider';
import { MessageActionButton } from '.';
import { Markdown } from './markdown';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './reasoning';

export function AssistantMessage({
  isLastMessage,
  message,
}: {
  isLastMessage: boolean;
  message: UIMessage;
}) {
  const { regenerate } = useCustomChat();
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const messageContent = message.parts.find(
    (part) => part.type === 'text'
  )?.text;

  return (
    <div className="group flex flex-col items-start gap-2">
      <div className="w-full bg-transparent text-secondary-foreground">
        {message.parts.map((part, i) => {
          const key = `${message.id}-${i}`;
          switch (part.type) {
            case 'text':
              return <Markdown key={key}>{part.text}</Markdown>;
            case 'reasoning':
              return (
                <Reasoning key={key}>
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );
            default:
              return null;
          }
        })}
      </div>
      <div className="flex items-center gap-2">
        <MessageActionButton
          icon={GitBranch}
          label="Branch off from this message"
          onClick={() => {
            // TODO: Implement branch off from this message
          }}
        />
        {isLastMessage && (
          <MessageActionButton
            icon={RefreshCcw}
            label="Regenerate"
            onClick={() => regenerate()}
          />
        )}
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
