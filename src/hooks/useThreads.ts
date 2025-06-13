import { useQuery } from "@tanstack/react-query";
import type { ThreadsResponse } from "@/lib/types";

async function fetchThreads(userId: string): Promise<ThreadsResponse> {
  const response = await fetch("/api/threads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch threads");
  }

  return response.json();
}

export function useThreads(userId: string | undefined) {
  return useQuery({
    queryKey: ["threads", userId],
    queryFn: () => fetchThreads(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
  });
}
