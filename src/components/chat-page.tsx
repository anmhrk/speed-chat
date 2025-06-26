"use client";

import { ChatInput } from "./chat-input";
import { Header } from "./header";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type Message } from "ai";
import { useRef, useEffect, useState } from "react";
import { toast } from "sonner";
import { SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Messages } from "./messages";
import { createChat, generateChatTitle } from "@/lib/actions";
import { Loader2 } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import {
  useHasApiKeys,
  useSettingsStore,
  useHasHydrated,
} from "@/stores/settings-store";
import { AVAILABLE_MODELS, REASONING_EFFORTS } from "@/lib/models";
import { useScroll } from "@/hooks/use-scroll";

const promptSuggestions = [
  "Suggest a quick and healthy dinner recipe",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  user: User | null;
  error?: string;
  initialMessages?: Message[];
  isLoading?: boolean;
}

export function ChatPage({
  user,
  error,
  initialMessages,
  isLoading,
}: ChatPageProps) {
  const hasHydrated = useHasHydrated();
  const { model, reasoningEffort, apiKeys, customPrompt } = useSettingsStore();
  const hasApiKeys = useHasApiKeys();

  const router = useRouter();
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const chatId = typeof params.id === "string" ? params.id : null;
  const temporaryChat = searchParams.get("temporary") === "true";
  const lastChatIdRef = useRef<string | null>(chatId);
  const [dynamicChatId, setDynamicChatId] = useState<string | null>(chatId);

  const { isScrolled, scrollAreaRef } = useScroll();

  useEffect(() => {
    if (chatId !== lastChatIdRef.current) {
      lastChatIdRef.current = chatId;
      setDynamicChatId(chatId);
    }
  }, [chatId]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      router.push("/");
    }
  }, [error, router]);

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    stop,
    status,
    reload,
    append,
    setMessages,
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
    // Only pass the body after hydration to avoid mismatches
    body: hasHydrated
      ? {
          chatId: dynamicChatId || undefined,
          model,
          reasoningEffort,
          apiKeys,
          temporaryChat,
          customPrompt,
        }
      : {
          chatId: dynamicChatId || undefined,
          // Use default values during SSR/before hydration
          model:
            AVAILABLE_MODELS.find((m) => m.default)?.id ||
            AVAILABLE_MODELS[0].id,
          reasoningEffort: REASONING_EFFORTS[0].id,
          apiKeys: {
            openrouter: "",
            openai: "",
            anthropic: "",
          },
          temporaryChat,
          customPrompt: "",
        },
    onError: (error) => {
      const errorMessage = {
        id: `error-${crypto.randomUUID()}`,
        role: "assistant",
        content: error.message,
        createdAt: new Date(),
        parts: [{ type: "text", text: error.message }],
      } as Message;

      setMessages((prev) => {
        // On error an empty assistant message is created, so we replace it with the error message
        const lastMessage = prev[prev.length - 1];
        if (
          lastMessage?.role === "assistant" &&
          (!lastMessage.content || lastMessage.content.trim() === "")
        ) {
          return [...prev.slice(0, -1), errorMessage];
        } else {
          // Fallback
          return [...prev, errorMessage];
        }
      });
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
      const userMessage = input.trim();

      setDynamicChatId(newChatId);
      createChat(newChatId); // Don't await this to not block the UI

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      // Start both in parallel
      await Promise.all([
        handleSubmit(e),
        (async () => {
          try {
            const title = await generateChatTitle(newChatId, userMessage);
            return title;
            // TODO: Update the title in the sidebar once returned
          } catch (error) {
            console.error(error);
            // Fallback title is already set when chat is created
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
        <div className="flex flex-col h-screen">
          <Header temporaryChat={temporaryChat} isScrolled={isScrolled} />
          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex items-center gap-2">
                  <Loader2 className="size-5 animate-spin" />
                  <span className="text-muted-foreground text-sm">
                    Loading messages..
                  </span>
                </div>
              </div>
            ) : messages.length > 0 ? (
              <ScrollArea className="h-full px-3" ref={scrollAreaRef}>
                <Messages
                  allMessages={messages}
                  status={status}
                  reload={reload}
                  append={append}
                  setMessages={setMessages}
                />
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center px-3">
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
                        {user
                          ? `How can I help you, ${user.name.split(" ")[0]}?`
                          : "How can I help you?"}
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

          <div className="shrink-0 px-3">
            <ChatInput
              input={input}
              handleInputChange={handleInputChange}
              handleSubmit={handleChatSubmit}
              stop={stop}
              status={status}
            />
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
