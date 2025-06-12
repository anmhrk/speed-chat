import { ChatInput } from "./ChatInput";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { Messages } from "./Messages";

const PROMPT_SUGGESTIONS = [
  "Solve Advent of Code 2021 Day 12 in Rust",
  "How many corgis are in the world?",
  "Is React Native actually better than Flutter?",
  "What is the meaning of life?",
];

interface ChatAreaProps {
  user: User | null | undefined;
  chatId?: string;
}

export function ChatArea({ user, chatId }: ChatAreaProps) {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    setInput,
    // status,
    // stop,
    // reload,
  } = useChat({
    credentials: "include",
    body: {
      chatId,
      userId: user?.id,
      model: "google/gemini-2.5-flash-preview-05-20",
      reasoningEffort: "low",
      apiKeys: {},
    },
  });

  return (
    <div className="mx-auto flex h-full w-full max-w-3xl flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {messages.length === 0 && !input.trim() ? (
          <>
            <h1 className="mb-12 text-4xl font-medium">
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
          </>
        ) : (
          <Messages messages={messages} error={error} />
        )}
      </div>

      <div className="px-6">
        <ChatInput
          prompt={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          user={user}
        />
      </div>
    </div>
  );
}
