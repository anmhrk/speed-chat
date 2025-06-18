"use client";

import { ChatInput } from "@/components/ChatInput";
import { Messages } from "@/components/Messages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Message } from "ai";
import type { Models, ReasoningEfforts, Providers } from "@/lib/types";
import { Loader2 } from "lucide-react";
import { Doc } from "../../convex/_generated/dataModel";

const PROMPT_SUGGESTIONS = [
  "Solve Advent of Code 2021 Day 12 in Rust",
  "Compose a poem about the feeling of love",
  "Is React Native actually better than Flutter?",
  "What is a black hole? Explain like I'm 5",
];

interface ChatAreaProps {
  user: Doc<"users"> | null;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  setInput: (input: string) => void;
  status: "error" | "submitted" | "streaming" | "ready";
  stop: () => void;
  reload: () => void;
  model: Models | null;
  reasoningEffort: ReasoningEfforts | null;
  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  apiKeys: Record<Providers, string> | null;
  setApiKeys: (apiKeys: Record<Providers, string> | null) => void;
  hasApiKeys: boolean;
  setHasApiKeys: (hasApiKeys: boolean) => void;
  isLoadingChat: boolean;
  temporaryChat: boolean;
  append: (message: Message) => void;
  setMessages: (messages: Message[]) => void;
  isCreatingInitialChat: boolean;
}

export function ChatArea({
  user,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  setInput,
  status,
  stop,
  reload,
  model,
  reasoningEffort,
  setModel,
  setReasoningEffort,
  apiKeys,
  setApiKeys,
  hasApiKeys,
  setHasApiKeys,
  isLoadingChat,
  temporaryChat,
  append,
  setMessages,
  isCreatingInitialChat,
}: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const previousMessagesLength = useRef(messages.length);
  const hasScrolledOnLoad = useRef(false);

  // Helper to grab the Radix ScrollArea viewport element
  const getViewport = () =>
    scrollAreaRef.current?.querySelector(
      '[data-slot="scroll-area-viewport"]',
    ) as HTMLDivElement | null;

  const scrollToBottom = useCallback(() => {
    const viewport = getViewport();
    if (viewport) {
      viewport.scrollTo({
        top: viewport.scrollHeight,
        behavior: "instant",
      });
    }
  }, []);

  // Scroll to bottom on page load once chat is loaded
  useEffect(() => {
    if (!isLoadingChat && messages.length > 0 && !hasScrolledOnLoad.current) {
      scrollToBottom();
      hasScrolledOnLoad.current = true;
    }
  }, [isLoadingChat, messages.length, scrollToBottom]);

  const scrollToShowUserMessage = () => {
    const viewport = getViewport();
    if (!viewport || messages.length === 0) return;

    const lastUserMessageIndex = messages.length - 1;
    const messageElements = viewport.querySelectorAll("[data-message-index]");
    const lastUserElement = messageElements[lastUserMessageIndex] as
      | HTMLElement
      | undefined;

    if (lastUserElement) {
      const elementTop = lastUserElement.offsetTop;
      const containerPadding = 72;

      viewport.scrollTo({
        top: elementTop - containerPadding,
        behavior: "instant",
      });
    }
  };

  // Handle scroll behavior when new user message comes in
  useEffect(() => {
    const currentLength = messages.length;
    const previousLength = previousMessagesLength.current;

    if (currentLength > previousLength && hasScrolledOnLoad.current) {
      const isUserMessage = messages[currentLength - 1]?.role === "user";

      if (isUserMessage) {
        setTimeout(() => {
          scrollToShowUserMessage();
        }, 50);
      }
    }

    previousMessagesLength.current = currentLength;
  }, [messages.length]);

  // Scroll event listener to show/hide scroll to bottom button
  useEffect(() => {
    const viewport = getViewport();
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
      setShowScrollToBottom(!isNearBottom && messages.length > 0);
    };
    viewport.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, [messages.length]);

  return (
    <div className="flex h-full flex-col">
      {isLoadingChat ? (
        <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center px-6 py-18 sm:py-16">
          <Loader2 className="text-muted-foreground size-7 animate-spin" />
        </div>
      ) : messages.length === 0 && !input.trim() ? (
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-8">
          {temporaryChat ? (
            <>
              <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                Temporary chat
              </h1>
              <p className="text-muted-foreground text-md max-w-sm text-center">
                This chat won&apos;t appear in your chat history and will be
                cleared when you close the tab.
              </p>
            </>
          ) : (
            <>
              <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                {user
                  ? `How can I help you, ${user.name?.split(" ")[0]}?`
                  : "How can I help you?"}
              </h1>
              <div className="grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
                {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                  <div
                    key={index}
                    className="border-border bg-card hover:bg-accent cursor-pointer rounded-lg border p-4 text-left transition-colors"
                    onClick={() => setInput(suggestion)}
                  >
                    <span className="text-muted-foreground text-sm">
                      {suggestion}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl px-6 py-18">
            <Messages
              messages={messages}
              reload={reload}
              status={status}
              append={append}
              setMessages={setMessages}
            />
          </div>
        </ScrollArea>
      )}

      <div className="mx-auto w-full max-w-3xl flex-shrink-0 px-4">
        <ChatInput
          prompt={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          user={user}
          showScrollToBottom={showScrollToBottom}
          scrollToBottom={scrollToBottom}
          status={status}
          stop={stop}
          model={model}
          reasoningEffort={reasoningEffort}
          apiKeys={apiKeys}
          setModel={setModel}
          setReasoningEffort={setReasoningEffort}
          setApiKeys={setApiKeys}
          hasApiKeys={hasApiKeys}
          setHasApiKeys={setHasApiKeys}
          isCreatingInitialChat={isCreatingInitialChat}
        />
      </div>
    </div>
  );
}
