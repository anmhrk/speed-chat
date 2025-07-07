import type { Message } from "ai";
import { AssistantMessage } from "@/components/messages/assistant-message";
import { UserMessage } from "@/components/messages/user-message";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useLayoutEffect,
} from "react";
import { Button } from "../ui/button";
import { ArrowDown } from "lucide-react";
import { UseChatHelpers } from "@ai-sdk/react";

interface MessagesProps {
  allMessages: Message[];
  status: UseChatHelpers["status"];
  reload: UseChatHelpers["reload"];
  append: UseChatHelpers["append"];
  setMessages: UseChatHelpers["setMessages"];
  chatId: string;
  isOnSharedPage: boolean;
}

export function Messages({
  allMessages,
  status,
  reload,
  append,
  setMessages,
  chatId,
  isOnSharedPage,
}: MessagesProps) {
  const showLoading =
    status === "submitted" &&
    allMessages[allMessages.length - 1].role === "user";

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottomButton, setShowScrollToBottomButton] =
    useState(false);
  const hasInitiallyScrolled = useRef(false);

  const getViewport = useCallback(
    () =>
      scrollAreaRef.current?.querySelector(
        '[data-slot="scroll-area-viewport"]'
      ) as HTMLDivElement | null,
    []
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

  useLayoutEffect(() => {
    if (hasInitiallyScrolled.current || allMessages.length === 0) return;

    const observer = new MutationObserver(() => {
      const viewport = getViewport();
      if (viewport && !hasInitiallyScrolled.current) {
        // Scroll immediately when viewport is detected
        viewport.scrollTop = viewport.scrollHeight;
        hasInitiallyScrolled.current = true;
        observer.disconnect();
      }
    });

    if (scrollAreaRef.current) {
      observer.observe(scrollAreaRef.current, {
        childList: true,
        subtree: true,
      });
    }

    // Fallback: try to scroll immediately if viewport already exists
    const viewport = getViewport();
    if (viewport && !hasInitiallyScrolled.current) {
      viewport.scrollTop = viewport.scrollHeight;
      hasInitiallyScrolled.current = true;
    }

    return () => observer.disconnect();
  }, [allMessages.length, getViewport]);

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

  return (
    <div className="relative h-full">
      {/* Top shadow */}
      <div className="absolute max-w-[750px] mx-auto top-0 left-0 right-0 h-2 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />

      <ScrollArea className="h-full" ref={scrollAreaRef}>
        <div className="flex w-full flex-col gap-10 max-w-[750px] mx-auto pb-16 pt-8 px-5 md:px-0">
          {allMessages.map((message) => (
            <div key={message.id} className="w-full">
              {message.role === "user" ? (
                <UserMessage
                  message={message}
                  allMessages={allMessages}
                  append={append}
                  setMessages={setMessages}
                  isOnSharedPage={isOnSharedPage}
                />
              ) : (
                <AssistantMessage
                  message={message}
                  isLastMessage={
                    message.id === allMessages[allMessages.length - 1]?.id
                  }
                  reload={reload}
                  chatId={chatId}
                  isOnSharedPage={isOnSharedPage}
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

      {/* Bottom shadow */}
      <div className="absolute max-w-[750px] mx-auto bottom-0 left-0 right-0 h-2 bg-gradient-to-t from-background to-transparent pointer-events-none z-10" />

      {showScrollToBottomButton && (
        <Button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 rounded-full shadow-lg"
          size="sm"
        >
          <ArrowDown className="size-4" />
          Scroll to bottom
        </Button>
      )}
    </div>
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
