"use client";

import { Header } from "@/components/Header";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import type { User } from "better-auth";
import { ChatProvider } from "@/hooks/useChatContext";

interface ChatPageProps {
  initialChatId?: string | null;
  user: User | null;
}

export function ChatPage({ initialChatId, user }: ChatPageProps) {
  return (
    <ChatProvider initialChatId={initialChatId} user={user}>
      <Header />
      <AppSidebar user={user} />
      <main className="h-screen flex-1">
        <ChatArea user={user} />
      </main>
    </ChatProvider>
  );
}
