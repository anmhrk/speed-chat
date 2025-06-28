"use client";

import { ChatInput } from "./chat-input";
import { Header } from "./header";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type Message, type UIMessage } from "ai";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SidebarInset } from "./ui/sidebar";
import { AppSidebar } from "./app-sidebar";
import { Messages } from "./messages";
import { Loader2 } from "lucide-react";
import { useHasApiKeys, useSettingsStore } from "@/stores/settings-store";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useFetchData } from "@/hooks/use-fetch-data";

const promptSuggestions = [
  "Suggest a quick and healthy dinner recipe",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  user: User | null;
  initialChatId: string;
}

export function ChatPage({ user, initialChatId }: ChatPageProps) {
  const { model, reasoningEffort, apiKeys, customPrompt } = useSettingsStore();
  const hasApiKeys = useHasApiKeys();

  const router = useRouter();
  const pathname = usePathname();
  const chatIdParams = pathname.split("/chat/")[1];
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [dontFetchId, setDontFetchId] = useState("");
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [dialogActiveItem, setDialogActiveItem] = useState("General");

  // Sync the chatId from the URL with the state
  // useParams was being weird so using usePathname instead
  useEffect(() => {
    if (pathname === "/") {
      setChatId(null);
    } else {
      setChatId(chatIdParams);
    }
  }, [chatIdParams, pathname]);

  const {
    loading,
    chats,
    messages: chatMessages,
  } = useFetchData({
    user,
    chatId: chatId ?? undefined,
  });

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
    experimental_resume,
    data,
  } = useChat({
    id: chatId ?? undefined,
    initialMessages: chatMessages as UIMessage[],
    credentials: "include",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "user",
      size: 16,
    }),
    experimental_throttle: 100,
    body: {
      chatId: chatId ?? undefined,
      model,
      reasoningEffort,
      apiKeys,
      temporaryChat,
      customPrompt,
    },
  });

  useEffect(() => {
    if (data && "type" in data && data.type === "error") {
      if ("error" in data) {
        const errorMessage = data.error as string;

        const fullError = {
          id: `error-${crypto.randomUUID()}`,
          role: "assistant",
          content: errorMessage,
          createdAt: new Date(),
          parts: [{ type: "text", text: errorMessage }],
        } as Message;

        setMessages((prev) => {
          // On error an empty assistant message is created, so we replace it with the error message
          const lastMessage = prev[prev.length - 1];
          if (
            lastMessage?.role === "assistant" &&
            (!lastMessage.content || lastMessage.content.trim() === "")
          ) {
            return [...prev.slice(0, -1), fullError];
          } else {
            // Fallback
            return [...prev, fullError];
          }
        });
      }
    }
  }, [data, setMessages]);

  // useAutoResume({
  //   autoResume: Boolean(chatId && !isLoading && initialMessages),
  //   initialMessages: (initialMessages || []) as UIMessage[],
  //   experimental_resume,
  //   data,
  //   setMessages,
  // });

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
            setSettingsDialogOpen(true);
            setDialogActiveItem("API Keys");
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

    if (!chatId) {
      const newChatId = crypto.randomUUID();
      const userMessage = input.trim();

      setChatId(newChatId);
      setDontFetchId(newChatId);

      // createChat(newChatId);

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      const submitPromise = handleSubmit(e);
      const titlePromise = (async () => {
        try {
          const response = await fetch("/api/generate-title", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              chatId: newChatId,
              prompt: userMessage,
              apiKeys,
            }),
          });

          const result = await response.json();

          if (result.success) {
            // TODO: update chat title in local db
          }
        } catch (error) {
          console.error(error);
          // Fallback title is already set when chat is created, so just log for now
        }
      })();

      // Send both requests in parallel
      await Promise.all([submitPromise, titlePromise]);
    } else {
      // Bring chat to top of list in local db

      handleSubmit(e);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-muted-foreground text-sm">
          Setting things up...
        </span>
      </div>
    );
  }

  return (
    <>
      <AppSidebar
        user={user}
        chatIdParams={chatId ?? ""}
        chats={chats}
        settingsDialogOpen={settingsDialogOpen}
        setSettingsDialogOpen={setSettingsDialogOpen}
        dialogActiveItem={dialogActiveItem}
        setDialogActiveItem={setDialogActiveItem}
      />
      <SidebarInset>
        <div className="flex flex-col h-screen">
          <Header temporaryChat={temporaryChat} />
          <div className="flex-1 min-h-0 relative">
            {messages.length > 0 ? (
              <Messages
                allMessages={messages}
                status={status}
                reload={reload}
                append={append}
                setMessages={setMessages}
              />
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
                            className="border-border bg-card hover:bg-muted cursor-pointer rounded-xl border p-4 text-left transition-colors"
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
