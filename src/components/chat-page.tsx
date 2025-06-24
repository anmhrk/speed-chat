"use client";

import { ChatInput } from "./chat-input";
import { Header } from "./header";
import { SettingsProvider, useSettingsContext } from "./settings-provider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type Message } from "ai";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";

const promptSuggestions = [
  "Write a creative story about space exploration",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  greeting?: string;
  user: User | null;
  initialMessages?: Message[];
}

export function ChatPage({ user, greeting, initialMessages }: ChatPageProps) {
  return (
    <SettingsProvider>
      <ChatPageInner
        user={user}
        greeting={greeting}
        initialMessages={initialMessages}
      />
    </SettingsProvider>
  );
}

function ChatPageInner({ greeting, user, initialMessages }: ChatPageProps) {
  const { model, reasoningEffort, apiKeys, customInstructions, hasApiKeys } =
    useSettingsContext();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  const chatId = typeof params.chatId === "string" ? params.chatId : null;
  const temporaryChat = searchParams.get("temporary") === "true";

  // Track the last chatId to detect URL changes after window.history.replaceState
  const lastChatIdRef = useRef<string | null>(chatId);
  const [dynamicChatId, setDynamicChatId] = useState<string | null>(chatId);

  useEffect(() => {
    if (chatId !== lastChatIdRef.current) {
      lastChatIdRef.current = chatId;
      setDynamicChatId(chatId);
    }
  }, [chatId]);

  console.log(
    model,
    reasoningEffort,
    apiKeys,
    temporaryChat,
    customInstructions
  );

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    stop,
    status,
  } = useChat({
    id: dynamicChatId || undefined,
    initialMessages,
    credentials: "include",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "user",
      size: 16,
    }),
    experimental_throttle: 200,
    body: {
      chatId: dynamicChatId || undefined,
      model,
      reasoningEffort,
      apiKeys,
      temporaryChat,
      customInstructions,
    },
  });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    if (!hasApiKeys) {
      toast("Please add API keys to chat", {
        action: {
          label: "Add keys",
          onClick: () => {
            router.push("/settings/keys");
          },
        },
      });
      return;
    }

    if (!input.trim()) {
      return;
    }

    if (temporaryChat) {
      handleSubmit(e);
      return;
    }

    if (!dynamicChatId) {
      const newChatId = crypto.randomUUID();
      // const userMessage = input.trim();

      // createChat({ chatId: newChatId });

      setDynamicChatId(newChatId);
      // Not using router.push cos it will cause a rerender and message state will be lost
      window.history.replaceState({}, "", `/chat/${newChatId}`);

      // Start both in parallel
      await Promise.all([
        handleSubmit(e),
        (async () => {
          try {
            // await generateChatTitle({
            //   chatId: newChatId,
            //   prompt: userMessage,
            // });
          } catch (error) {
            console.error(error);
            // Fallback title is already set in generateChatTitle action
          }
        })(),
      ]);
    } else {
      handleSubmit(e);
    }
  };

  return (
    <>
      <AppSidebar user={user} />

      <SidebarInset>
        <div className="flex flex-col h-full p-3">
          <Header />

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
                        This chat won&apos;t appear in your chat history and
                        will be cleared when you close the tab.
                      </p>
                    </>
                  ) : (
                    <>
                      <h1 className="mb-12 text-3xl font-medium sm:text-4xl">
                        {greeting}
                      </h1>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 w-full">
                        {promptSuggestions.map((suggestion, index) => (
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
            handleSubmit={handleChatSubmit}
            stop={stop}
            status={status}
          />
        </div>
      </SidebarInset>
    </>
  );
}
