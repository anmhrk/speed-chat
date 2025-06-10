import { useState } from "react";
import { ChatInput } from "./ChatInput";
import type { User } from "better-auth";

const PROMPT_SUGGESTIONS = [
  "Solve Advent of Code 2021 Day 12 in Rust",
  "How many corgis are in the world?",
  "Is React Native actually better than Flutter?",
  "What is the meaning of life?",
];

interface ChatAreaProps {
  user: User | null | undefined;
}

export function ChatArea({ user }: ChatAreaProps) {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="mx-auto flex h-full w-full max-w-4xl flex-1 flex-col">
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8">
        {!prompt.trim() ? (
          <>
            <div className="mb-8 text-center">
              <h1 className="text-foreground mb-4 text-4xl font-medium">
                {user
                  ? `How can I help you, ${user.name.split(" ")[0]}?`
                  : "How can I help you?"}
              </h1>
            </div>

            <div className="mb-8 grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
              {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                <div
                  key={index}
                  className="border-border bg-card hover:bg-accent cursor-pointer rounded-lg border p-4 text-left transition-colors"
                  onClick={() => setPrompt(suggestion)}
                >
                  <span className="text-muted-foreground text-sm">
                    {suggestion}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1" />
        )}
      </div>

      <div className="p-6">
        <ChatInput prompt={prompt} setPrompt={setPrompt} />
      </div>
    </div>
  );
}
