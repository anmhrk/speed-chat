'use client';

import type { ToolUIPart } from 'ai';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from './ai-elements/conversation';
import { Message, MessageContent } from './ai-elements/message';
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from './ai-elements/reasoning';
import { Response } from './ai-elements/response';
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from './ai-elements/tool';
import { useCustomChat } from './providers/chat-provider';

export function Messages() {
  const { messages, isStreaming } = useCustomChat();

  return (
    <Conversation className="h-full w-full">
      <ConversationContent className="mx-auto max-w-3xl">
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
              {message.parts.map((part, i) => {
                const key = `${message.id}-${i}`;

                switch (part.type) {
                  case 'text':
                    return <Response key={key}>{part.text}</Response>;

                  case 'reasoning':
                    return (
                      <Reasoning
                        defaultOpen={false}
                        isStreaming={
                          isStreaming && i === message.parts.length - 1
                        }
                        key={key}
                      >
                        <ReasoningTrigger />
                        <ReasoningContent>{part.text}</ReasoningContent>
                      </Reasoning>
                    );

                  case 'tool-use': {
                    const toolPart = part as ToolUIPart;
                    return (
                      <Tool defaultOpen={true} key={key}>
                        <ToolHeader
                          state={toolPart.state}
                          type={toolPart.type}
                        />
                        <ToolContent>
                          {toolPart.input && (
                            <ToolInput
                              input={toolPart.input as Record<string, unknown>}
                            />
                          )}
                          {(toolPart.output || toolPart.errorText) && (
                            <ToolOutput
                              errorText={toolPart.errorText}
                              output={
                                typeof toolPart.output === 'string'
                                  ? toolPart.output
                                  : JSON.stringify(toolPart.output, null, 2)
                              }
                            />
                          )}
                        </ToolContent>
                      </Tool>
                    );
                  }

                  default:
                    return null;
                }
              })}
            </MessageContent>
          </Message>
        ))}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
