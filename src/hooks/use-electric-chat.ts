import { useEffect, useState } from "react";
import { env } from "@/lib/env";
import type { User } from "better-auth";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useChat } from "@ai-sdk/react";
import { type Attachment, createIdGenerator, type Message } from "ai";
import { useSettingsContext } from "@/components/providers/settings-provider";
import { createChat, insertUserMessageToDb } from "@/lib/db/actions";
import { ShapeStream, Shape } from "@electric-sql/client";

interface UseElectricChatProps {
  user: User | null;
  initialChatId?: string;
  isOnSharedPage?: boolean;
  didUserCreate?: boolean;
  attachments: Attachment[];
  clearFiles: () => void;
}

export function useElectricChat({
  user,
  initialChatId,
  isOnSharedPage,
  didUserCreate,
  attachments,
  clearFiles,
}: UseElectricChatProps) {
  const {
    model,
    reasoningEffort,
    apiKeys,
    customization,
    hasAnyKey,
    reasoningEnabled,
  } = useSettingsContext();
  const router = useRouter();
  const pathname = usePathname();
  const chatIdParams = pathname.split("/chat/")[1] ?? initialChatId;
  const searchParams = useSearchParams();
  const temporaryChat = searchParams.get("temporary") === "true";
  const [chatId, setChatId] = useState<string | null>(initialChatId ?? null);
  const [isInputCentered, setIsInputCentered] = useState(!chatId);
  const [isNewlyCreated, setIsNewlyCreated] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [isInitiatingClient, setIsInitiatingClient] = useState(false);

  const [localChats, setLocalChats] = useState<any[]>([]);
  const [localMessages, setLocalMessages] = useState<any[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);

  // Sync the chatId from the URL with the state
  useEffect(() => {
    if (pathname === "/") {
      setChatId(null);
      setIsInputCentered(true);
    } else {
      setChatId(chatIdParams);
      setIsInputCentered(false);
    }
  }, [chatIdParams, pathname]);

  // Conditional chats subscription
  useEffect(() => {
    if (!user?.id) return;

    const chatsStream = new ShapeStream({
      url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
      params: {
        table: "chats",
        where: `user_id = '${user.id}'`,
      },
    });

    const chats = new Shape(chatsStream);

    const unsubscribe = chats.subscribe(({ rows }) => {
      console.log("chats rows", rows);
      setLocalChats(rows);
      setIsLoadingChats(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  // Conditional messages subscription
  useEffect(() => {
    if (!chatId) {
      setIsLoadingMessages(false);
      return;
    }
    setIsLoadingMessages(true);

    const messagesStream = new ShapeStream({
      url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
      params: {
        table: "messages",
        where: `chat_id = '${chatId}'`,
      },
    });

    const messages = new Shape(messagesStream);

    const unsubscribe = messages.subscribe(({ rows }) => {
      console.log("messages rows", rows);
      setLocalMessages(rows);
      setIsLoadingMessages(false);
    });

    return () => {
      unsubscribe();
    };
  }, [chatId]);

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
    id: chatId ?? undefined,
    initialMessages: localMessages as Message[],
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
      customization,
      searchEnabled,
      isNewChat: isNewlyCreated,
      reasoningEnabled,
    },
  });

  // Sync localMessages with messages state (only for non-initiating clients)
  useEffect(() => {
    if (localMessages.length > 0 && chatId && !isInitiatingClient) {
      setMessages(localMessages as Message[]);
    }
  }, [localMessages, setMessages, chatId, isInitiatingClient]);

  const isMessageStreaming = status === "submitted" || status === "streaming";

  const handleChatSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isOnSharedPage && !didUserCreate) {
      toast.error("Please fork this shared chat to send messages");
      return;
    }

    if (isOnSharedPage && didUserCreate) {
      toast.error(
        "You can't chat on a shared chat. Please go back to the original chat."
      );
      return;
    }

    if (!user) {
      toast.error("Please login to chat");
      return;
    }

    if (!hasAnyKey()) {
      toast("Please add API keys to chat", {
        action: {
          label: "Add keys",
          onClick: () => router.push("/settings/api-keys"),
        },
      });
      return;
    }

    if ((!input.trim() && !attachments) || isMessageStreaming) {
      return;
    }

    if (temporaryChat) {
      handleSubmit(e, {
        experimental_attachments: attachments,
        allowEmptySubmit: true,
      });
      clearFiles();
      return;
    }

    if (!chatId) {
      setIsNewlyCreated(true);
      setIsInitiatingClient(true);
      const newChatId = crypto.randomUUID();
      setChatId(newChatId);
      setIsInputCentered(false);

      createChat(newChatId, input, attachments);

      window.history.replaceState({}, "", `/chat/${newChatId}`);
      handleSubmit(e, {
        experimental_attachments: attachments,
        allowEmptySubmit: true,
      });
      setTimeout(() => {
        setIsNewlyCreated(false);
        setIsInitiatingClient(false);
      }, 500);
    } else {
      setIsInitiatingClient(true);
      insertUserMessageToDb(chatId, input, attachments);
      handleSubmit(e, {
        experimental_attachments: attachments,
        allowEmptySubmit: true,
      });
      setTimeout(() => {
        setIsInitiatingClient(false);
      }, 100);
    }
    clearFiles();
  };

  return {
    chats: localChats,
    messages,
    temporaryChat,
    chatId,
    isInputCentered,
    isLoadingChats,
    isLoadingMessages,
    handleChatSubmit,
    setSearchEnabled,
    searchEnabled,
    isMessageStreaming,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    reload,
    append,
    setMessages,
    stop,
    status,
  };
}
