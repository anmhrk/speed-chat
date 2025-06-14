import { useQuery } from "@tanstack/react-query";
import type { ChatResponse } from "@/lib/types";

async function fetchChat(
  chatId: string,
  userId: string,
): Promise<ChatResponse> {
  const response = await fetch(`/api/chat/messages/${chatId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch chat");
  }

  return response.json();
}

export function useChatData(
  chatId: string | undefined,
  userId: string | undefined,
) {
  return useQuery({
    queryKey: ["chat", chatId, userId],
    queryFn: () => fetchChat(chatId!, userId!),
    enabled: !!chatId && !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
