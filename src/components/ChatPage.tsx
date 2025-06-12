import { AppSidebar } from "./AppSidebar";
import { ChatArea } from "./ChatArea";
import { Header } from "./Header";
import { SidebarProvider } from "./ui/sidebar";
import type { User } from "better-auth";
import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import type { Models, ReasoningEfforts, Providers } from "@/lib/types";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import { customAlphabet } from "nanoid";

interface ChatPageProps {
  chatIdParams?: string;
  user: User | null | undefined;
  defaultOpen: boolean;
}

export function ChatPage({ chatIdParams, user, defaultOpen }: ChatPageProps) {
  const router = useRouter();
  const [chatId, setChatId] = useState<string>(chatIdParams || "");
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
  });

  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    error,
    setInput,
    status,
    stop,
    reload,
  } = useChat({
    credentials: "include",
    body: {
      chatId,
      userId: user?.id,
      model: model,
      reasoningEffort: reasoningEffort,
      apiKeys: apiKeys,
    },
  });

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    // for new chat
    if (!chatId) {
      setChatId(customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 10)());
    }

    const canSubmit =
      hasApiKeys || model === "google/gemini-2.5-flash-preview-05-20";
    if (canSubmit && input.trim()) {
      handleSubmit(e);
      router.navigate({
        to: "/chat/$chatId",
        params: {
          chatId,
        },
      });
    }
  };

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Header />
      <AppSidebar user={user} status={status} />
      <main className="h-screen flex-1">
        <ChatArea
          user={user}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleChatSubmit}
          error={error}
          setInput={setInput}
          status={status}
          stop={stop}
          reload={reload}
          model={model}
          setModel={setModel}
          reasoningEffort={reasoningEffort}
          setReasoningEffort={setReasoningEffort}
          apiKeys={apiKeys}
          setApiKeys={setApiKeys}
          hasApiKeys={hasApiKeys}
          setHasApiKeys={setHasApiKeys}
        />
      </main>
    </SidebarProvider>
  );
}
