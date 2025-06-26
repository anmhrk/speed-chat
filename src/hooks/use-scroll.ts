import { useEffect, useState, useRef, useCallback } from "react";

interface UseScrollOptions {
  autoScrollToBottom?: boolean;
  scrollSelector?: string;
}

export function useScroll(options: UseScrollOptions = {}) {
  const {
    autoScrollToBottom = true,
    scrollSelector = '[data-slot="scroll-area-viewport"]',
  } = options;

  const [isScrolled, setIsScrolled] = useState(false);
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
    if (autoScrollToBottom) {
      scrollToBottom("instant");
    }
  }, [autoScrollToBottom, scrollToBottom]);

  // Set up scroll event listener to track scroll state
  useEffect(() => {
    const scrollViewport = getViewport();
    if (!scrollViewport) return;

    const handleScroll = () => {
      setIsScrolled(scrollViewport.scrollTop > 0);
    };

    scrollViewport.addEventListener("scroll", handleScroll);
    return () => scrollViewport.removeEventListener("scroll", handleScroll);
  }, [getViewport]);

  return {
    isScrolled,
    scrollAreaRef,
    scrollToBottom,
    getViewport,
  };
}
