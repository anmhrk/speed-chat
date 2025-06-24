"use client";

import { useChat } from "@ai-sdk/react";
import { ChatInput } from "./chat-input";
import { Header } from "./header";
import { SettingsProvider } from "./settings-provider";
import { useSearchParams } from "next/navigation";
import type { User } from "better-auth";

const PROMPT_SUGGESTIONS = [
  "Write a creative story about space exploration",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  greeting?: string;
  user: User | null;
}

export function ChatPage({ greeting, user }: ChatPageProps) {
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    stop,
    status,
  } = useChat();

  return (
    <SettingsProvider>
      <div className="flex flex-col h-screen p-3">
        <Header user={user} />

        <div className="flex-1 flex flex-col">
          {/* {messages.length > 0 && (
            <ScrollArea className="h-full">
              
            </ScrollArea>
          )} */}

          {messages.length === 0 && (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col gap-4 mx-auto max-w-2xl w-full items-center">
                {temporaryChat ? (
                  <>
                    <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                      Temporary chat
                    </h1>
                    <p className="text-muted-foreground text-md max-w-sm text-center">
                      This chat won&apos;t appear in your chat history and will
                      be cleared when you close the tab.
                    </p>
                  </>
                ) : (
                  <>
                    <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                      {greeting}
                    </h1>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 w-full">
                      {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                        <div
                          key={index}
                          className="border-border bg-card hover:bg-primary/10 cursor-pointer rounded-xl border p-4 text-left transition-colors"
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
            </div>
          )}
        </div>

        <ChatInput
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          stop={stop}
          status={status}
        />
      </div>
    </SettingsProvider>
  );
}
