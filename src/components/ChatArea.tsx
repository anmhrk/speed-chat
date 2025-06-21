"use client";

import { ChatInput } from "@/components/ChatInput";
import { Messages } from "@/components/Messages";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import type { User } from "better-auth";
import { useChatContext } from "@/hooks/useChatContext";

const PROMPT_SUGGESTIONS = [
  "Solve Advent of Code 2021 Day 10 in Python",
  "Compose a poem about the feeling of love",
  "Is React Native actually better than Flutter?",
  "What is a black hole? Explain like I'm 5",
];

interface ChatAreaProps {
  user: User | null;
}

export function ChatArea({ user }: ChatAreaProps) {
  const { messages, input, setInput, temporaryChat, isLoadingMessages } =
    useChatContext();

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
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
    if (
      !isLoadingMessages &&
      messages.length > 0 &&
      !hasScrolledOnLoad.current
    ) {
      scrollToBottom();
      hasScrolledOnLoad.current = true;
    }
  }, [isLoadingMessages, messages.length, scrollToBottom]);

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
      {isLoadingMessages ? (
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
            <Messages />
          </div>
        </ScrollArea>
      )}

      <div className="mx-auto w-full max-w-3xl flex-shrink-0 px-4">
        <ChatInput
          user={user}
          showScrollToBottom={showScrollToBottom}
          scrollToBottom={scrollToBottom}
        />
      </div>
    </div>
  );
}
