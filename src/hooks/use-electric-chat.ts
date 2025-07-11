import type { Chat, DbMessage } from "@/lib/db/schema";
import { useShape } from "@electric-sql/react";
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

  const {
    isLoading: isLoadingChats,
    data: chats,
    isError: isErrorChats,
    error: errorChats,
  } = useShape<Chat>({
    url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
    params: {
      table: "chats",
      where: `user_id = '${user?.id}'`,
    },
  });

  const {
    isLoading: isLoadingMessages,
    data: messages,
    isError: isErrorMessages,
    error: errorMessages,
  } = useShape<DbMessage>({
    url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
    params: {
      table: "messages",
      //   where: `chatId = '${chatId}'`,
    },
  });

  console.log("chats", chats);
  console.log("messages", messages);

  useEffect(() => {
    if (isErrorChats) {
      toast.error(`Error loading chats: ${errorChats}`);
    }

    if (isErrorMessages) {
      toast.error(
        `Error loading messages for chat ${chatId}: ${errorMessages}  `
      );
    }
  }, [isErrorChats, isErrorMessages, chatId, errorChats, errorMessages]);

  const {
    messages: localMessages,
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
    initialMessages: messages as Message[],
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
      customization,
      searchEnabled,
      isNewChat: isNewlyCreated,
      reasoningEnabled,
    },
  });

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
      const newChatId = crypto.randomUUID();
      setChatId(newChatId);
      setIsInputCentered(false);

      window.history.replaceState({}, "", `/chat/${newChatId}`);
      handleSubmit(e, {
        experimental_attachments: attachments,
        allowEmptySubmit: true,
      });
      setTimeout(() => {
        setIsNewlyCreated(false);
      }, 500);
    } else {
      handleSubmit(e, {
        experimental_attachments: attachments,
        allowEmptySubmit: true,
      });
    }
    clearFiles();
  };

  return {
    chats,
    localMessages,
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
