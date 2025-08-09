import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UIMessage } from 'ai';
import { Check, Copy, GitBranch, RefreshCcw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { orpc } from '@/backend/orpc';
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
  const router = useRouter();
  const qc = useQueryClient();
  const { regenerate, currentChatId, buildBody } = useCustomChat();
  const { copyToClipboard, isCopied } = useCopyToClipboard();
  const messageContent = message.parts.find(
    (part) => part.type === 'text'
  )?.text;

  const branchOffFromMessage = useMutation(
    orpc.chatActionsRouter.branchOffFromMessage.mutationOptions()
  );

  const deleteMessages = useMutation(
    orpc.chatActionsRouter.deleteMessages.mutationOptions()
  );

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
            toast.promise(
              branchOffFromMessage
                .mutateAsync({
                  parentChatId: currentChatId,
                  messageId: message.id,
                })
                .then((branchChatId) => {
                  qc.invalidateQueries({ queryKey: ['chats'] });
                  router.push(`/c/${branchChatId}`);
                }),
              {
                loading: 'Branching off from this message...',
                success: 'Branch created',
                error: 'Failed to branch off from this message',
              }
            );
          }}
        />
        {isLastMessage && (
          <MessageActionButton
            icon={RefreshCcw}
            label="Regenerate"
            onClick={() => {
              deleteMessages.mutate({
                messageIdsToDelete: [message.id],
              });
              regenerate({
                body: buildBody(),
              });
            }}
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
