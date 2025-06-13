import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Thread, ThreadsResponse } from "@/lib/types";

interface CreateThreadData {
  id: string;
  title: string;
}

export function useCreateThread(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateThreadData) => {
      // This is an optimistic update - we don't actually call an API
      // since the thread creation happens during chat submission
      return data;
    },
    onMutate: async (newThread) => {
      if (!userId) return;

      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["threads", userId] });

      // Snapshot the previous value
      const previousThreads = queryClient.getQueryData<ThreadsResponse>([
        "threads",
        userId,
      ]);

      // Optimistically update to the new value
      queryClient.setQueryData<ThreadsResponse>(["threads", userId], (old) => {
        const newThreadData: Thread = {
          id: newThread.id,
          title: newThread.title,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          threads: old ? [newThreadData, ...old.threads] : [newThreadData],
        };
      });

      // Return a context object with the snapshotted value
      return { previousThreads };
    },
    onError: (_err, _newThread, context) => {
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousThreads && userId) {
        queryClient.setQueryData(["threads", userId], context.previousThreads);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["threads", userId] });
      }
    },
  });
}

export function useUpdateThreadTitle(userId: string | undefined) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { id: string; title: string }) => {
      return data;
    },
    onMutate: async (updatedThread) => {
      if (!userId) return;

      await queryClient.cancelQueries({ queryKey: ["threads", userId] });

      const previousThreads = queryClient.getQueryData<ThreadsResponse>([
        "threads",
        userId,
      ]);

      queryClient.setQueryData<ThreadsResponse>(["threads", userId], (old) => {
        if (!old) return old;

        return {
          threads: old.threads.map((thread) =>
            thread.id === updatedThread.id
              ? { ...thread, title: updatedThread.title }
              : thread,
          ),
        };
      });

      return { previousThreads };
    },
    onError: (_err, _updatedThread, context) => {
      if (context?.previousThreads && userId) {
        queryClient.setQueryData(["threads", userId], context.previousThreads);
      }
    },
    onSettled: () => {
      if (userId) {
        queryClient.invalidateQueries({ queryKey: ["threads", userId] });
      }
    },
  });
}
