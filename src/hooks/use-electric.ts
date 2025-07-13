import { ShapeStream, Shape } from "@electric-sql/client";
import { useMemo, useEffect, useState } from "react";
import { env } from "@/lib/env";
import type { User } from "better-auth";
import type { Chat, DbMessage } from "@/lib/db/schema";
import type { Message } from "ai";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { validateChatAccess } from "@/lib/actions";

interface UseElectricProps {
  user: User | null;
  chatId: string | null;
  newlyCreatedChatId?: string | null;
  isOnSharedPage?: boolean;
}

export function useElectric({
  user,
  chatId,
  newlyCreatedChatId = null,
  isOnSharedPage = false,
}: UseElectricProps) {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [rawMessages, setRawMessages] = useState<DbMessage[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setChats([]);
      setIsLoadingChats(false);
      return;
    }

    const chatStream = new ShapeStream<Chat>({
      url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
      params: {
        table: "chats",
        where: `"userId" = '${user.id}'`,
      },
      onError: (error) => {
        console.error("Error loading chats:", error);
        toast.error("Error loading chats");
        router.push("/");
      },
    });

    const chatShape = new Shape(chatStream);

    const unsubscribe = chatShape.subscribe(({ rows }) => {
      setChats(rows || []);
      setIsLoadingChats(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.id, router]);

  useEffect(() => {
    if (
      !chatId ||
      (!user?.id && !isOnSharedPage) ||
      (newlyCreatedChatId && chatId === newlyCreatedChatId)
    ) {
      setRawMessages([]);
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    let unsubscribe: (() => void) | null = null;
    let isCancelled = false;

    const createShapeStream = () => {
      const messageStream = new ShapeStream<DbMessage>({
        url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
        params: {
          table: "messages",
          where: `"chatId" = '${chatId}'`,
        },
        onError: (error) => {
          console.error("Error loading messages:", error);
          toast.error("Error loading messages");
          router.push("/");
        },
      });

      const messageShape = new Shape(messageStream);

      unsubscribe = messageShape.subscribe(({ rows }) => {
        if (isCancelled) return;
        setRawMessages(rows || []);
        setIsLoadingMessages(false);
      });
    };

    if (isOnSharedPage) {
      createShapeStream();
    } else {
      validateChatAccess(chatId)
        .then((hasAccess) => {
          if (isCancelled) return;

          if (!hasAccess) {
            // Throw generic not found error
            toast.error(`Chat ${chatId} not found`);
            router.push("/");
            setIsLoadingMessages(false);
            return;
          }

          createShapeStream();
        })
        .catch((error) => {
          if (isCancelled) return;
          console.error("Error validating chat access:", error);
          toast.error("Error validating chat access");
          router.push("/");
          setIsLoadingMessages(false);
        });
    }

    return () => {
      isCancelled = true;
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatId, user?.id, newlyCreatedChatId, isOnSharedPage, router]);

  const sortedChats = useMemo(() => {
    return chats.sort((a, b) => {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [chats]);

  const messages = useMemo(() => {
    return rawMessages.map(
      (msg: DbMessage): Message => ({
        id: msg.id,
        content: msg.content,
        role: msg.role as "user" | "assistant" | "system",
        createdAt: msg.createdAt,
        annotations: msg.annotations || undefined,
        parts: msg.parts || undefined,
        experimental_attachments: msg.experimentalAttachments || undefined,
      })
    );
  }, [rawMessages]);

  return {
    chats: sortedChats,
    messages,
    isLoadingChats,
    isLoadingMessages,
  };
}
