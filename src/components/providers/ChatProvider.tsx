"use client";

import { createContext, useContext, useState } from "react";

interface ChatContextType {
  newChatIds: Set<string>;
  addNewChatId: (id: string) => void;
  removeNewChatId: (id: string) => void;
  isNewChat: (id: string) => boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [newChatIds, setNewChatIds] = useState(new Set<string>());

  const addNewChatId = (id: string) => {
    setNewChatIds((prev) => new Set([...prev, id]));
  };

  const removeNewChatId = (id: string) => {
    setNewChatIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const isNewChat = (id: string) => {
    return newChatIds.has(id);
  };

  return (
    <ChatContext.Provider
      value={{ newChatIds, addNewChatId, removeNewChatId, isNewChat }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
}
