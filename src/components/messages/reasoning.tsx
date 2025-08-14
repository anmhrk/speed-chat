// reference: https://ai-sdk.dev/elements/components/reasoning

"use client";

import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { BrainIcon, ChevronDownIcon } from "lucide-react";
import type { ComponentProps } from "react";
import { createContext, memo, useContext, useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { Markdown } from "./markdown";

type ReasoningContextValue = {
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
};

const ReasoningContext = createContext<ReasoningContextValue | null>(null);

const useReasoning = () => {
  const context = useContext(ReasoningContext);
  if (!context) {
    throw new Error("Reasoning components must be used within Reasoning");
  }
  return context;
};

export type ReasoningProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export const Reasoning = memo(
  ({
    className,
    isStreaming = false,
    open,
    defaultOpen = false,
    onOpenChange,
    children,
    ...props
  }: ReasoningProps) => {
    const [isOpen, setIsOpen] = useControllableState({
      prop: open,
      defaultProp: defaultOpen,
      onChange: onOpenChange,
    });

    const [wasStreamingRef, setWasStreamingRef] = useState(false);
    const [hasAutoClosedRef, setHasAutoClosedRef] = useState(false);

    // Auto-open when streaming starts, auto-close when streaming ends (once only)
    useEffect(() => {
      if (isStreaming && !isOpen) {
        setWasStreamingRef(true); // Mark that this reasoning block was streaming
        setIsOpen(true);
      } else if (
        !isStreaming &&
        isOpen &&
        !defaultOpen &&
        !hasAutoClosedRef &&
        wasStreamingRef
      ) {
        // Only auto-close if this reasoning block was previously streaming
        const timer = setTimeout(() => {
          setIsOpen(false);
          setHasAutoClosedRef(true);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [
      isStreaming,
      isOpen,
      defaultOpen,
      setIsOpen,
      hasAutoClosedRef,
      wasStreamingRef,
    ]);

    const handleOpenChange = (openBlock: boolean) => {
      setIsOpen(openBlock);
    };

    return (
      <ReasoningContext.Provider value={{ isStreaming, isOpen, setIsOpen }}>
        <Collapsible
          className={cn("not-prose mb-4", className)}
          onOpenChange={handleOpenChange}
          open={isOpen}
          {...props}
        >
          {children}
        </Collapsible>
      </ReasoningContext.Provider>
    );
  }
);

export type ReasoningTriggerProps = ComponentProps<
  typeof CollapsibleTrigger
> & {
  title?: string;
};

export const ReasoningTrigger = memo(
  ({
    className,
    title = "Reasoning",
    children,
    ...props
  }: ReasoningTriggerProps) => {
    const { isOpen } = useReasoning();

    return (
      <CollapsibleTrigger
        className={cn(
          "flex items-center gap-2 text-muted-foreground text-sm",
          className
        )}
        {...props}
      >
        {children ?? (
          <>
            <BrainIcon className="size-4" />
            <p>{isOpen ? "Hide reasoning" : "Show reasoning"}</p>
            <ChevronDownIcon
              className={cn(
                "size-4 text-muted-foreground transition-transform",
                isOpen ? "rotate-180" : "rotate-0"
              )}
            />
          </>
        )}
      </CollapsibleTrigger>
    );
  }
);

export type ReasoningContentProps = ComponentProps<
  typeof CollapsibleContent
> & {
  children: string;
};

export const ReasoningContent = memo(
  ({ className, children, ...props }: ReasoningContentProps) => (
    <CollapsibleContent
      className={cn(
        "mt-4 text-sm",
        "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
        className
      )}
      {...props}
    >
      <Markdown>{children}</Markdown>
    </CollapsibleContent>
  )
);

Reasoning.displayName = "Reasoning";
ReasoningTrigger.displayName = "ReasoningTrigger";
ReasoningContent.displayName = "ReasoningContent";
