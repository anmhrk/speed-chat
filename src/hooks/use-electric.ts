import { useShape } from "@electric-sql/react";
import { useMemo, useEffect } from "react";
import { env } from "@/lib/env";
import type { User } from "better-auth";
import type { Chat, DbMessage } from "@/lib/db/schema";
import type { Message } from "ai";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface UseElectricProps {
  user: User | null;
  chatId: string | null;
}

export function useElectric({ user, chatId }: UseElectricProps) {
  const router = useRouter();
  const {
    data: chats = [],
    isLoading: isLoadingChats,
    isError: isErrorChats,
  } = useShape<Chat>({
    url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
    params: {
      table: "chats",
      where: user?.id ? `user_id = '${user.id}'` : "1=0",
    },
  });

  const {
    data: rawMessages = [],
    isLoading: isLoadingMessages,
    isError: isErrorMessages,
  } = useShape<DbMessage>({
    url: `${env.NEXT_PUBLIC_SITE_URL}/api/shape-proxy`,
    params: {
      table: "messages",
      where:
        chatId && user?.id
          ? `chat_id = '${chatId}' AND user_id = '${user.id}'`
          : "1=0",
    },
  });

  useEffect(() => {
    if (isErrorChats) {
      toast.error("Error loading chats");
      router.push("/");
    }

    if (isErrorMessages) {
      toast.error("Error loading messages");
      router.push("/");
    }
  }, [isErrorChats, isErrorMessages, router]);

  const sortedChats = useMemo(() => {
    return chats.sort((a, b) => {
      return (
        // @ts-expect-error - updated_at is returned by db but not in drizzle type
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
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
        experimental_attachments: msg.experimental_attachments || undefined,
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
