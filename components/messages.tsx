'use client';

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './ai-elements/conversation';
import { Message, MessageContent } from './ai-elements/message';
import { useCustomChat } from './providers/chat-provider';
import { Actions, Action } from './ai-elements/actions';
import { Response } from './ai-elements/response';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from './ai-elements/reasoning';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from './ai-elements/tool';
import { ClipboardIcon, PencilIcon, RotateCcwIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useChatConfig } from '@/components/providers/chat-config-provider';
import { CHAT_MODELS } from '@/lib/models';
import type { ChatStreamBody, searchWebToolOutput } from '@/backend/orpc/routers/chat-stream';

export function Messages() {
  const { messages, regenerate, setInput, inputRef, isStreaming } = useCustomChat();
  const pathname = usePathname();
  const chatId = useMemo(() => (pathname.startsWith('/c/') ? pathname.slice(3) : ''), [pathname]);
  const { model, reasoningEffort, shouldUseReasoning, searchWeb, apiKeys } = useChatConfig();

  const buildBody = useCallback((): ChatStreamBody => ({
    chatId,
    modelId:
      CHAT_MODELS.find((m) => m.name === model)?.id ?? 'anthropic/claude-sonnet-4',
    apiKey: apiKeys.aiGateway,
    reasoningEffort,
    shouldUseReasoning,
    shouldSearchWeb: searchWeb,
    isNewChat: false,
  }), [apiKeys.aiGateway, chatId, model, reasoningEffort, searchWeb, shouldUseReasoning]);

  const getMessageText = useCallback((message: (typeof messages)[number]) => {
    return message.parts
      .filter((p) => p.type === 'text' && typeof (p as any).text === 'string')
      .map((p) => (p as any).text as string)
      .join('\n');
  }, [messages]);

  const handleCopy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could toast success in future
    } catch (err) {
      console.error('Failed to copy', err);
    }
  }, []);

  const handleEdit = useCallback((text: string) => {
    setInput(text);
    // focus input if available
    const el = inputRef?.current;
    if (el) {
      el.focus();
      // move cursor to end
      const val = el.value;
      el.value = '';
      el.value = val;
    }
  }, [inputRef, setInput]);

  const handleRetry = useCallback((messageId: string) => {
    const body = buildBody();
    regenerate({ messageId, body });
  }, [buildBody, regenerate]);

  const renderSearchWebOutput = (output: unknown) => {
    const results = output as searchWebToolOutput | undefined;
    if (!results || !Array.isArray(results) || results.length === 0) return null;
    return (
      <div className="space-y-3 p-2">
        {results.map((item) => (
          <div key={item.url.toString()} className="space-y-1">
            <a
              href={item.url.toString()}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline"
            >
              {item.title}
            </a>
            {item.publishedDate && (
              <p className="text-xs text-muted-foreground">{item.publishedDate}</p>
            )}
            {item.content && (
              <p className="text-sm text-foreground/90">{item.content}</p>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPart = (part: any) => {
    // ToolUIPart heuristic: has state and input fields
    if (part && typeof part === 'object' && 'state' in part && 'input' in part) {
      const toolName = (part.type ?? 'tool') as string;
      const state = part.state as 'input-streaming' | 'input-available' | 'output-available' | 'output-error';
      const errorText = (part.errorText ?? undefined) as string | undefined;
      const outputNode = toolName === 'searchWeb' ? renderSearchWebOutput(part.output) : (part.output ? (
        <pre className="whitespace-pre-wrap text-xs p-2">{typeof part.output === 'string' ? part.output : JSON.stringify(part.output, null, 2)}</pre>
      ) : null);

      return (
        <Tool key={part.toolCallId ?? toolName + Math.random()} defaultOpen={state !== 'output-available'}>
          <ToolHeader state={state} type={(part.type as `tool-${string}`)} />
          <ToolContent>
            <ToolInput input={part.input} />
            <ToolOutput errorText={errorText} output={outputNode} />
          </ToolContent>
        </Tool>
      );
    }

    switch (part.type) {
      case 'text':
        return <Response key={part.id ?? Math.random()}>{part.text as string}</Response>;
      case 'reasoning':
        return (
          <Reasoning key={part.id ?? Math.random()} isStreaming={isStreaming} defaultOpen={false}>
            <ReasoningTrigger />
            <ReasoningContent>{(part.text as string) ?? ''}</ReasoningContent>
          </Reasoning>
        );
      default:
        return null;
    }
  };

  return (
    <Conversation className="mx-auto h-full w-full max-w-3xl">
      <ConversationContent>
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {message.parts.map((part: any) => renderPart(part))}
            </MessageContent>

            {message.role === 'user' ? (
              <Actions className="opacity-0 transition-opacity group-hover:opacity-100">
                <Action
                  tooltip="Copy"
                  onClick={() => handleCopy(getMessageText(message))}
                >
                  <ClipboardIcon className="size-4" />
                </Action>
                <Action
                  tooltip="Edit"
                  onClick={() => handleEdit(getMessageText(message))}
                >
                  <PencilIcon className="size-4" />
                </Action>
              </Actions>
            ) : (
              <Actions className="opacity-0 transition-opacity group-hover:opacity-100">
                <Action
                  tooltip="Copy"
                  onClick={() => handleCopy(getMessageText(message))}
                >
                  <ClipboardIcon className="size-4" />
                </Action>
                <Action tooltip="Retry" onClick={() => handleRetry(message.id)}>
                  <RotateCcwIcon className="size-4" />
                </Action>
              </Actions>
            )}
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
