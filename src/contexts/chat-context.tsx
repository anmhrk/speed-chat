"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useLiveQuery } from "dexie-react-hooks";
import { localDb } from "@/lib/db/dexie";
import { useDataSync } from "@/hooks/use-data-sync";
import type { User } from "better-auth";
import type { Chat, Message } from "@/lib/db/drizzle/schema";

interface ChatContextType {
  loading: boolean;
  chats: Chat[] | undefined;
  messages: Message[] | undefined;
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  user: User | null;
  temporaryChat: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export function ChatProvider({ children, user }: ChatProviderProps) {
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const pathname = usePathname();

  // Sync the chatId from the URL with the state
  useEffect(() => {
    if (pathname === "/") {
      setCurrentChatId(null);
    } else {
      setCurrentChatId(pathname.split("/chat/")[1]);
    }
  }, [pathname]);

  console.log("currentChatId", currentChatId);

  const { loading } = useDataSync({ user });

  const chats = useLiveQuery(async () => {
    if (!user) return [];
    return await localDb.chats.reverse().sortBy("updatedAt");
  }, [user]);

  const messages = useLiveQuery(async () => {
    if (!currentChatId) return [];
    return await localDb.messages
      .where("chatId")
      .equals(currentChatId)
      .sortBy("createdAt");
  }, [currentChatId]);

  return (
    <ChatContext
      value={{
        loading,
        chats,
        messages,
        currentChatId,
        setCurrentChatId,
        user,
        temporaryChat,
      }}
    >
      {children}
    </ChatContext>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
