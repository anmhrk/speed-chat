import type { Message } from "ai";
import { AssistantMessage } from "@/components/assistant-message";
import { UserMessage } from "@/components/user-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";
import { UseChatHelpers } from "@ai-sdk/react";

interface MessagesProps {
  allMessages: Message[];
  status: UseChatHelpers["status"];
  reload: UseChatHelpers["reload"];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
}

export function Messages({
  allMessages,
  status,
  reload,
  append,
  setMessages,
}: MessagesProps) {
  const showLoading =
    status === "submitted" &&
    allMessages[allMessages.length - 1].role === "user";

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false);

  const getViewport = useCallback(
    () =>
      scrollAreaRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]',
      ) as HTMLDivElement | null,
    [],
  );

  const scrollToBottom = useCallback(() => {
    const scrollViewport = getViewport();
    if (!scrollViewport) return;

    scrollViewport.scrollTo({
      top: scrollViewport.scrollHeight,
      behavior: "instant",
    });
  }, [getViewport]);

  const checkScrollPosition = useCallback(() => {
    const scrollViewport = getViewport();
    if (!scrollViewport) return;

    const { scrollTop, scrollHeight, clientHeight } = scrollViewport;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100; // 100px threshold
    setShowScrollToBottomButton(!isAtBottom);
  }, [getViewport]);

  useEffect(() => {
    const scrollViewport = getViewport();
    if (!scrollViewport) return;

    scrollViewport.addEventListener("scroll", checkScrollPosition);
    checkScrollPosition();

    return () => {
      scrollViewport.removeEventListener("scroll", checkScrollPosition);
    };
  }, [getViewport, checkScrollPosition]);

  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => {
        checkScrollPosition();
      }, 100);
    }
  }, [allMessages, checkScrollPosition]);

  useEffect(() => {
    scrollToBottom();
  }, [scrollToBottom]);

  return (
    <>
      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="flex w-full flex-col gap-10 max-w-[750px] mx-auto py-16 px-5 md:px-0">
          {allMessages.map((message) => (
            <div key={message.id} className="w-full">
              {message.role === "user" ? (
                <UserMessage
                  message={message}
                  allMessages={allMessages}
                  append={append}
                  setMessages={setMessages}
                />
              ) : (
                <AssistantMessage
                  message={message}
                  isLastMessage={
                    message.id === allMessages[allMessages.length - 1]?.id
                  }
                  reload={reload}
                />
              )}
            </div>
          ))}
          {showLoading && (
            <div className="w-full">
              <AssistantMessageLoader />
            </div>
          )}
        </div>
      </ScrollArea>
      {showScrollToBottomButton && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full shadow-lg"
          size="sm"
        >
          <ArrowDown className="size-4" />
          Scroll to bottom
        </Button>
      )}
    </>
  );
}

function AssistantMessageLoader() {
  return (
    <div className="flex justify-start">
      <div className="w-full">
        <div className="flex items-center space-x-1">
          <div className="bg-primary/10 dark:bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]"></div>
          <div className="bg-primary/10 dark:bg-accent h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]"></div>
          <div className="bg-primary/10 dark:bg-accent h-2 w-2 animate-bounce rounded-full"></div>
        </div>
      </div>
    </div>
  );
}
