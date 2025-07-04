import { useSettingsContext } from "@/components/settings-provider";
import { AVAILABLE_MODELS } from "@/lib/models";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import type { UseChatHelpers } from "@ai-sdk/react";
import { createIdGenerator, type Attachment, type Message } from "ai";
import type { User } from "better-auth";
import { useRouter } from "next/navigation";
import { createChat } from "@/lib/db/actions";
import { useQueryClient } from "@tanstack/react-query";
import type { Chat } from "@/lib/db/schema";

interface UnifiedSubmitProps {
  input: string;
  setInput: UseChatHelpers["setInput"];
  chatId: string;
  setChatId: (chatId: string) => void;
  setDontFetchId: (dontFetchId: string) => void;
  setMessages: UseChatHelpers["setMessages"];
  handleSubmit: UseChatHelpers["handleSubmit"];
  user: User | null;
  temporaryChat: boolean;
  attachments: Attachment[];
  handleError: (error: Error, type: "chat" | "image") => void;
  messages: UseChatHelpers["messages"];
}

export function useUnifiedSubmit({
  input,
  setInput,
  chatId,
  setChatId,
  setDontFetchId,
  setMessages,
  handleSubmit,
  user,
  temporaryChat,
  attachments,
  handleError,
  messages,
}: UnifiedSubmitProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { model, apiKeys, hasAnyKey } = useSettingsContext();
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const isImageModel = useCallback(() => {
    return (
      AVAILABLE_MODELS.find((m) => m.id === model)?.imageGeneration ?? false
    );
  }, [model]);

  const generateImage = async (
    chatIdToUse: string,
    messagesToUse: Message[]
  ) => {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      body: JSON.stringify({
        model,
        apiKeys: apiKeys,
        prompt: input.trim(),
        messages: messagesToUse,
        chatId: chatIdToUse,
        temporaryChat,
      }),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error: string };
      handleError(new Error(error.error), "image");
      return;
    }

    const { assistantMessage } = await response.json();

    setIsGeneratingImage(false);
    setMessages((prev) => [...prev, assistantMessage]);
  };

  const handleUnifiedSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

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

    if (!input.trim()) {
      return;
    }

    // Persist the synthetic event for async usage
    if (e.persist) e.persist();

    if (temporaryChat && !isImageModel()) {
      handleSubmit(e, { experimental_attachments: attachments });
      return;
    }

    let currentChatId = chatId;

    if (!temporaryChat && !chatId) {
      currentChatId = crypto.randomUUID();

      setChatId(currentChatId);
      setDontFetchId(currentChatId);

      createChat(currentChatId);
      queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
        if (!oldData) return oldData;
        return [
          {
            id: currentChatId,
            userId: user.id,
            title: "New Chat",
            createdAt: new Date(),
            updatedAt: new Date(),
            isPinned: false,
          },
          ...oldData,
        ];
      });

      window.history.replaceState({}, "", `/chat/${currentChatId}`);
    }

    const titlePromise =
      !temporaryChat && !chatId
        ? (async () => {
            try {
              const response = await fetch("/api/generate-title", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  chatId: currentChatId,
                  prompt: input.trim(),
                  apiKeys,
                }),
              });

              const result = await response.json();

              if (result.success) {
                queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
                  if (!oldData) return oldData;
                  return oldData.map((chatItem) =>
                    chatItem.id === currentChatId
                      ? { ...chatItem, title: result.title }
                      : chatItem
                  );
                });
              }
            } catch (error) {
              console.error(error);
            }
          })()
        : Promise.resolve();

    if (isImageModel()) {
      const userMessage: Message = {
        id: createIdGenerator({ prefix: "user", size: 16 })(),
        role: "user",
        content: input,
        createdAt: new Date(),
        parts: [{ type: "text", text: input }],
      };

      const messagesToSend = [...messages, userMessage];

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsGeneratingImage(true);

      await Promise.all([
        generateImage(currentChatId, messagesToSend),
        titlePromise,
      ]);

      return;
    }

    handleSubmit(e, {
      experimental_attachments: attachments,
    });

    await titlePromise;

    return;
  };

  return { handleUnifiedSubmit, isGeneratingImage };
}
