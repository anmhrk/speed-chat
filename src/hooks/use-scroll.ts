import { useEffect, useRef, useCallback } from "react";

interface UseScrollOptions {
  autoScrollToBottom?: boolean;
  scrollSelector?: string;
}

export function useScroll(
  options: UseScrollOptions = {},
  hasInitialMessages = false
) {
  const {
    autoScrollToBottom = true,
    scrollSelector = '[data-slot="scroll-area-viewport"]',
  } = options;

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const getViewport = useCallback(
    () =>
      scrollAreaRef.current?.querySelector(
        scrollSelector
      ) as HTMLDivElement | null,
    [scrollSelector]
  );

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = "instant") => {
      const scrollViewport = getViewport();
      if (!scrollViewport) return;

      scrollViewport.scrollTo({
        top: scrollViewport.scrollHeight,
        behavior,
      });
    },
    [getViewport]
  );

  // Auto-scroll to bottom on initial load
  useEffect(() => {
    if (autoScrollToBottom && hasInitialMessages) {
      scrollToBottom("instant");
    }
  }, [autoScrollToBottom, scrollToBottom]);

  return {
    scrollAreaRef,
    scrollToBottom,
    getViewport,
  };
}
