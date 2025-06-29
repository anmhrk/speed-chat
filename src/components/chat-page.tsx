"use client";

import { ChatInput } from "./chat-input";
import { Header } from "./header";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type UIMessage } from "ai";
import { useEffect } from "react";
import { toast } from "sonner";
import { SidebarInset } from "./ui/sidebar";
import { Messages } from "./messages";
import { Loader2 } from "lucide-react";
import { useHasApiKeys, useSettingsStore } from "@/stores/settings-store";
import { useAutoResume } from "@/hooks/use-auto-resume";
import { useChatContext } from "@/contexts/chat-context";
import { createChat } from "@/lib/db/actions";
import { localDb } from "@/lib/db/dexie";

const promptSuggestions = [
  "Suggest a quick and healthy dinner recipe",
  "Explain quantum computing in simple terms",
  "Help me plan a weekend trip to Paris",
  "Create a workout routine for beginners",
];

interface ChatPageProps {
  user: User | null;
}

export function ChatPage({ user }: ChatPageProps) {
  const { model, reasoningEffort, apiKeys, customPrompt } = useSettingsStore();
  const hasApiKeys = useHasApiKeys();
  const {
    loading,
    messages: chatMessages,
    currentChatId,
    setCurrentChatId,
    temporaryChat,
  } = useChatContext();

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
    id: currentChatId ?? undefined,
    initialMessages: chatMessages as UIMessage[],
    credentials: "include",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "user",
      size: 16,
    }),
    experimental_throttle: 100,
    body: {
      chatId: currentChatId ?? undefined,
      model,
      reasoningEffort,
      apiKeys,
      temporaryChat,
      customPrompt,
    },
    onFinish: async (message) => {
      console.log("onFinish called", { message, currentChatId });
      // TODO: why isnt this working??
      if (currentChatId && !temporaryChat) {
        try {
          await localDb.messages.add({
            id: message.id,
            chatId: currentChatId,
            content: message.content,
            createdAt: new Date(),
            role: message.role,
            parts: message.parts,
          });
          console.log("Message saved to local DB successfully");
        } catch (error) {
          console.error("Failed to save message to local DB:", error);
          toast.error("Failed to save message locally");
        }
      }
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
        } as UIMessage;

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

  useAutoResume({
    autoResume: true,
    initialMessages: (chatMessages || []) as UIMessage[],
    experimental_resume,
    data,
    setMessages,
  });

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    if (!hasApiKeys) {
      toast.error("Please add API keys to chat");
      return;
    }

    if (!input.trim()) {
      return;
    }

    if (temporaryChat) {
      handleSubmit(e);
      return;
    }

    if (!currentChatId) {
      const newChatId = crypto.randomUUID();
      const userMessage = input.trim();

      setCurrentChatId(newChatId);

      createChat(newChatId);
      localDb.chats.add({
        id: newChatId,
        title: "New Chat",
        userId: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isPinned: false,
      });

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      // Save user message to local DB immediately
      const userMessageId = crypto.randomUUID();
      await localDb.messages.add({
        id: userMessageId,
        chatId: newChatId,
        content: userMessage,
        createdAt: new Date(),
        role: "user",
        parts: [{ type: "text", text: userMessage }],
      });

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
            localDb.chats.update(newChatId, {
              title: result.title,
            });
          }
        } catch (error) {
          console.error(error);
          // Fallback title is already set when chat is created, so just log for now
        }
      })();

      // Send both requests in parallel
      await Promise.all([submitPromise, titlePromise]);
    } else {
      // Save user message to local DB for existing chat
      const userMessageId = crypto.randomUUID();
      await localDb.messages.add({
        id: userMessageId,
        chatId: currentChatId,
        content: input.trim(),
        createdAt: new Date(),
        role: "user",
        parts: [{ type: "text", text: input.trim() }],
      });

      localDb.chats.update(currentChatId, {
        updatedAt: new Date(),
      });
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
                      This chat won&apos;t appear in your chat history and will
                      be cleared when you close the tab.
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
  );
}
