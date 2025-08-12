"use client";

import { useChat } from "@ai-sdk/react";
import { createIdGenerator, type FileUIPart } from "ai";
import { usePathname, useRouter } from "next/navigation";
import type { MyUIMessage } from "@/lib/types";
import { useState, useRef, useCallback, useMemo } from "react";
import { nanoid } from "nanoid";
import { Doc } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { CHAT_MODELS } from "@/lib/models";
import { useChatConfig } from "@/providers/chat-config-provider";

type CustomChatProps = {
  initialMessages: MyUIMessage[];
  user: Doc<"users"> | null;
};

export function useCustomChat({ initialMessages, user }: CustomChatProps) {
  const { model, reasoningEffort, shouldUseReasoning, searchWeb, apiKeys } =
    useChatConfig();
  const router = useRouter();
  const pathname = usePathname();
  const urlChatId = useMemo(
    () => pathname.split("/chat/")[1] ?? "",
    [pathname]
  );
  const [chatId] = useState<string>(() => urlChatId || nanoid());
  const [isNewChat, setIsNewChat] = useState<boolean>(() => !urlChatId);

  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };
  const [filesToSend, setFilesToSend] = useState<FileUIPart[]>([]);

  const { messages, sendMessage, setMessages, stop, status, regenerate } =
    useChat<MyUIMessage>({
      id: chatId,
      messages: initialMessages,
      generateId: createIdGenerator({
        prefix: "user",
        size: 16,
      }),
    });

  const buildBodyAndHeaders = useCallback(() => {
    return {
      body: {
        chatId,
        modelId:
          CHAT_MODELS.find((m) => m.name === model)?.id ??
          "anthropic/claude-sonnet-4", // Default so that typescript is happy
        reasoningEffort,
        shouldUseReasoning,
        shouldSearchWeb: searchWeb,
        isNewChat,
      },
      headers: {
        "x-ai-gateway-api-key": apiKeys.aiGateway,
      },
    };
  }, [
    chatId,
    model,
    apiKeys.aiGateway,
    reasoningEffort,
    shouldUseReasoning,
    searchWeb,
    isNewChat,
  ]);

  const isStreaming = status === "streaming" || status === "submitted";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user) {
      toast.error("Please sign in to chat");
      return;
    }

    if (!input.trim() || isStreaming) {
      return;
    }

    if (isNewChat) {
      router.replace(`/chat/${chatId}`);
      setIsNewChat(false);
    }

    const { body, headers } = buildBodyAndHeaders();

    sendMessage(
      {
        text: input,
        files: filesToSend,
      },
      {
        body,
        headers,
      }
    );

    setInput("");
    setFilesToSend([]);
  };

  return {
    messages,
    sendMessage,
    setMessages,
    stop,
    regenerate,
    chatId,
    input,
    setInput,
    inputRef,
    handleInputChange,
    isStreaming,
    handleSubmit,
    filesToSend,
    setFilesToSend,
    buildBodyAndHeaders,
  };
}
