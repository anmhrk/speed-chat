"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useChat } from "@ai-sdk/react";
import { toast } from "sonner";
import { type Message, createIdGenerator } from "ai";
import { useRouter } from "next/navigation";
import type { User } from "better-auth";
import {
  createChat,
  fetchChats,
  fetchMessages,
  generateChatTitle,
} from "@/lib/actions";
import type {
  Models,
  ReasoningEfforts,
  Providers,
  CustomizationSettings,
} from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { chat } from "@/lib/db/schema";

interface ChatContextType {
  chatId: string | null;
  setChatId: (chatId: string | null) => void;
  model: Models | null;
  setModel: (model: Models | null) => void;
  reasoningEffort: ReasoningEfforts | null;
  setReasoningEffort: (effort: ReasoningEfforts | null) => void;
  hasApiKeys: boolean;
  setHasApiKeys: (hasKeys: boolean) => void;
  apiKeys: Record<Providers, string> | null;
  setApiKeys: (keys: Record<Providers, string> | null) => void;
  customizationSettings: CustomizationSettings | null;
  setCustomizationSettings: (settings: CustomizationSettings | null) => void;
  temporaryChat: boolean;
  setTemporaryChat: (temporary: boolean) => void;
  newChatIds: Set<string>;
  setNewChatIds: (newIds: Set<string>) => void;

  // From useChat hook
  messages: Message[];
  input: string;
  handleInputChange: (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | React.ChangeEvent<HTMLTextAreaElement>,
  ) => void;
  setInput: (input: string) => void;
  status: "error" | "submitted" | "streaming" | "ready";
  stop: () => void;
  reload: () => void;
  setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
  append: (message: Message) => void;

  // Custom submit handler
  handleChatSubmit: (e: React.FormEvent) => Promise<void>;

  // Queries
  chats: (typeof chat.$inferSelect)[] | undefined;
  isLoadingChats: boolean;
  isLoadingMessages: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
  initialChatId?: string | null;
  user: User | null;
}

export function ChatProvider({
  children,
  initialChatId,
  user,
}: ChatProviderProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [chatId, setChatId] = useState<string | null>(initialChatId || null);
  const [model, setModel] = useState<Models | null>(null);
  const [reasoningEffort, setReasoningEffort] =
    useState<ReasoningEfforts | null>(null);
  const [hasApiKeys, setHasApiKeys] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Record<Providers, string> | null>(
    null,
  );
  const [customizationSettings, setCustomizationSettings] =
    useState<CustomizationSettings | null>(null);
  const [temporaryChat, setTemporaryChat] = useState<boolean>(false);
  const [newChatIds, setNewChatIds] = useState(new Set<string>());

  useEffect(() => {
    const savedSettings = localStorage.getItem("customization_settings");
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setCustomizationSettings(parsed);
    }
  }, []);

  const {
    data: chats,
    isLoading: isLoadingChats,
    error: chatsError,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: () => fetchChats(user?.id || ""),
    enabled: !!user,
  });

  const {
    data: initialMessages,
    isLoading: isLoadingMessages,
    error: messagesError,
  } = useQuery({
    queryKey: ["threads"],
    queryFn: () => fetchMessages(chatId || ""),
    enabled: Boolean(chatId && user && !newChatIds.has(chatId)),
  });

  useEffect(() => {
    if (chatsError) {
      toast.error("Error fetching chats", {
        action: {
          label: "Retry",
          onClick: () => {
            queryClient.invalidateQueries({ queryKey: ["chats"] });
          },
        },
      });
    }
  }, [chatsError, queryClient]);

  useEffect(() => {
    if (messagesError) {
      toast.error("Error fetching messages", {
        action: {
          label: "Retry",
          onClick: () => {
            queryClient.invalidateQueries({ queryKey: ["threads"] });
          },
        },
      });
    }

    if (!initialMessages && !isLoadingMessages) {
      router.push("/");
    }
  }, [messagesError, router, initialMessages, isLoadingMessages, queryClient]);

  const chat = useChat({
    id: chatId || undefined,
    initialMessages: (initialMessages as Message[]) || [],
    credentials: "include",
    sendExtraMessageFields: true,
    generateId: createIdGenerator({
      prefix: "user",
      size: 16,
    }),
    experimental_throttle: 200,
    body: {
      chatId: chatId || undefined,
      model: model,
      reasoningEffort: reasoningEffort,
      apiKeys: apiKeys,
      temporaryChat: temporaryChat,
      customizationSettings: customizationSettings,
    },
    onError: (error) => {
      const errorMessage = {
        id: `error-${crypto.randomUUID()}`,
        role: "assistant",
        content: error.message,
        createdAt: new Date(),
        parts: [
          {
            type: "text" as const,
            text: error.message,
          },
        ],
      } as Message;

      chat.setMessages((prev) => {
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

    if (!chat.input.trim()) {
      return;
    }

    if (temporaryChat) {
      if (!chatId) {
        const tempChatId = crypto.randomUUID();
        setChatId(tempChatId);
      }
      chat.handleSubmit(e);
      return;
    }

    if (!chatId) {
      const newChatId = crypto.randomUUID();
      const userMessage = chat.input.trim();

      setChatId(newChatId);
      setNewChatIds((prev) => new Set([...prev, newChatId]));
      createChat(newChatId, user.id);

      window.history.replaceState({}, "", `/chat/${newChatId}`);

      await Promise.all([
        chat.handleSubmit(e),
        (async () => {
          try {
            const title = await generateChatTitle(newChatId, userMessage);
            return title;
          } catch (error) {
            console.error(error);
            return "New Chat";
          }
        })(),
      ]).then(() => {
        setNewChatIds((prev) => {
          const next = new Set(prev);
          next.delete(newChatId);
          return next;
        });
      });
    } else {
      chat.handleSubmit(e);
    }
  };

  const contextValue: ChatContextType = {
    chatId,
    setChatId,
    model,
    setModel,
    reasoningEffort,
    setReasoningEffort,
    hasApiKeys,
    setHasApiKeys,
    apiKeys,
    setApiKeys,
    customizationSettings,
    setCustomizationSettings,
    temporaryChat,
    setTemporaryChat,
    newChatIds,
    setNewChatIds,
    messages: chat.messages,
    input: chat.input,
    handleInputChange: chat.handleInputChange,
    setInput: chat.setInput,
    status: chat.status,
    stop: chat.stop,
    reload: chat.reload,
    setMessages: chat.setMessages,
    append: chat.append,
    handleChatSubmit,
    chats,
    isLoadingChats,
    isLoadingMessages,
  };

  return <ChatContext value={contextValue}>{children}</ChatContext>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }

  return context;
}
