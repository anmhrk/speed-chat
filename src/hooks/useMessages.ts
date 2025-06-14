import { useQuery } from "@tanstack/react-query";
import type { MessagesResponse } from "@/lib/types";

async function fetchMessages(
  chatId: string,
  userId: string,
): Promise<MessagesResponse> {
  const response = await fetch(`/api/chat/messages/${chatId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

export function useMessages(
  chatId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: ["messages", chatId, userId],
    queryFn: () => fetchMessages(chatId!, userId!),
    enabled: !!chatId && !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });
}
