import type { UseChatHelpers } from '@ai-sdk/react';
import { useMutation } from 'convex/react';
import {
  Bolt,
  Check,
  Clock,
  Copy,
  Cpu,
  GitBranch,
  Info,
  RefreshCcw,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { api } from '@/convex/_generated/api';
import { useCopyClipboard } from '@/hooks/use-copy-clipboard';
import { useIsMobile } from '@/hooks/use-mobile';
import type { MyUIMessage, searchWebToolOutput } from '@/lib/types';
import type { useCustomChat } from '@/providers/chat-provider';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { MessageActionButton } from '.';
import { Reasoning, ReasoningContent, ReasoningTrigger } from './reasoning';
import { Response } from './response';
import { Tool, ToolContent, ToolHeader, ToolInput, ToolOutput } from './tool';

type AssistantMessageProps = {
  isLastMessage: boolean;
  message: MyUIMessage;
  regenerate: UseChatHelpers<MyUIMessage>['regenerate'];
  buildBodyAndHeaders: ReturnType<typeof useCustomChat>['buildBodyAndHeaders'];
  currentChatId: string;
};

export function AssistantMessage({
  isLastMessage,
  message,
  regenerate,
  buildBodyAndHeaders,
  currentChatId,
}: AssistantMessageProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { copyToClipboard, isCopied } = useCopyClipboard();

  const branchOffFromMessage = useMutation(
    api.chatActions.branchOffFromMessage
  );
  const deleteMessages = useMutation(api.chatActions.deleteMessages);

  return (
    <div className="group flex flex-col items-start gap-2">
      <div className="w-full bg-transparent text-secondary-foreground">
        {message.parts?.map((part, i) => {
          const key = `${message.id}-${i}`;
          switch (part.type) {
            case 'text':
              return <Response key={key}>{part.text}</Response>;
            case 'reasoning':
              return (
                <Reasoning isStreaming={part.state === 'streaming'} key={key}>
                  <ReasoningTrigger />
                  <ReasoningContent>{part.text}</ReasoningContent>
                </Reasoning>
              );
            case 'tool-searchWebTool':
              return (
                <Tool defaultOpen={part.state !== 'output-available'} key={key}>
                  <ToolHeader state={part.state} type={part.type} />
                  <ToolContent>
                    <ToolInput input={part.input} />
                    <ToolOutput
                      errorText={part.errorText}
                      output={
                        part.output ? (
                          <div className="space-y-3">
                            {(part.output as searchWebToolOutput).map(
                              (result) => (
                                <div
                                  className="rounded-lg border p-3 transition-colors"
                                  key={result.url}
                                >
                                  <div className="flex flex-col gap-2">
                                    <a
                                      className="line-clamp-2 font-medium text-blue-500 text-sm hover:underline dark:text-blue-400"
                                      href={result.url}
                                      rel="noopener noreferrer"
                                      target="_blank"
                                    >
                                      {result.title}
                                    </a>
                                    <div className="flex items-center justify-between text-muted-foreground text-xs">
                                      <span className="truncate">
                                        {result.url}
                                      </span>
                                      {result.publishedDate && (
                                        <span>
                                          {new Date(
                                            result.publishedDate
                                          ).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        ) : null
                      }
                    />
                  </ToolContent>
                </Tool>
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
              branchOffFromMessage({
                parentChatId: currentChatId,
                messageId: message.id,
              }).then((branchChatId) => {
                router.push(`/chat/${branchChatId}`);
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
              deleteMessages({
                messageIdsToDelete: [message.id],
              });

              const { body, headers } = buildBodyAndHeaders();
              regenerate({
                body,
                headers,
              });
            }}
          />
        )}
        <MessageActionButton
          icon={isCopied ? Check : Copy}
          label="Copy to clipboard"
          onClick={() => {
            copyToClipboard(
              message.parts
                ?.map((part) => (part.type === 'text' ? part.text : ''))
                .join('') || ''
            );
          }}
        />

        {message.metadata && (
          <div className="flex w-full items-center text-muted-foreground text-xs opacity-0 transition-opacity group-hover:opacity-100">
            <div className="flex w-full items-center">
              <span className="mr-2 max-w-[40vw] truncate font-medium">
                {message.metadata.modelName}
              </span>
              <div className="flex-1" />
              {isMobile ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      className="ml-auto h-8 w-8"
                      size="icon"
                      variant="ghost"
                    >
                      <Info className="size-4 text-primary" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-fit p-3">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Bolt className="size-3" />
                        <span>{message.metadata.tps.toFixed(2)} tok/s</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cpu className="size-3" />
                        <span>{message.metadata.completionTokens} tokens</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="size-3" />
                        <span>
                          Time-to-first: {message.metadata.ttft.toFixed(2)} s
                        </span>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="flex flex-row items-center gap-1.5">
                  <p className="inline-flex items-center">
                    <Bolt className="mr-1 inline-block size-3" />
                    {message.metadata.tps.toFixed(2)} tok/s
                  </p>
                  <p className="inline-flex items-center">
                    <Cpu className="mr-1 inline-block size-3" />
                    {message.metadata.completionTokens} tokens
                  </p>
                  <p className="inline-flex items-center">
                    <Clock className="mr-1 inline-block size-3" />
                    Time-to-first: {message.metadata.ttft.toFixed(2)} s
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
