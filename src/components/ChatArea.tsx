import { ChatInput } from "./ChatInput";
import type { User } from "better-auth";
import { Messages } from "./Messages";
import { ScrollArea } from "./ui/scroll-area";
import { useEffect, useRef, useState } from "react";
import type { Message } from "ai";
import type { Models, ReasoningEfforts, Providers } from "@/lib/types";
import { Loader2 } from "lucide-react";

const PROMPT_SUGGESTIONS = [
  "Solve Advent of Code 2021 Day 12 in Rust",
  "How many corgis are in the world?",
  "Is React Native actually better than Flutter?",
  "What is the meaning of life?",
];

interface ChatAreaProps {
  user: User | null | undefined;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  error: Error | undefined;
  setInput: (input: string) => void;
  status: "error" | "submitted" | "streaming" | "ready";
  stop: () => void;
  reload: () => void;
  model: Models | null;
  reasoningEffort: ReasoningEfforts | null;
  setModel: (model: Models) => void;
  setReasoningEffort: (reasoningEffort: ReasoningEfforts) => void;
  apiKeys: Record<Providers, string>;
  setApiKeys: (apiKeys: Record<Providers, string>) => void;
  hasApiKeys: boolean;
  setHasApiKeys: (hasApiKeys: boolean) => void;
  isLoadingChat?: boolean;
}

export function ChatArea({
  user,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  error,
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
}: ChatAreaProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);

  // Scroll to bottom on initial page load
  // TODO: Need another listener for show scroll to bottom state so
  // i can render the button when needed

  // TODO: When sending a message, put the active user message at the top of the scroll area
  // just like t3 chat
  useEffect(() => {
    scrollToBottom();
  }, []);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: "instant",
      });
    }
  };

  return (
    <div className="flex h-full flex-col">
      {isLoadingChat ? (
        <div className="mx-auto flex h-full w-full max-w-3xl items-center justify-center px-6 py-18 sm:py-16">
          <Loader2 className="text-muted-foreground size-7 animate-spin" />
        </div>
      ) : messages.length === 0 && !input.trim() ? (
        <div className="mx-auto flex h-full w-full max-w-3xl flex-col items-center justify-center px-4 py-8">
          <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
            {user
              ? `How can I help you, ${user.name.split(" ")[0]}?`
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
        </div>
      ) : (
        <ScrollArea ref={scrollAreaRef} className="min-h-0 flex-1">
          <div className="mx-auto max-w-3xl px-6 py-18 sm:py-16">
            <Messages messages={messages} error={error} reload={reload} />
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
        />
      </div>
    </div>
  );
}
