import { useQuery } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import { localDb } from "@/lib/db/dexie";
import { useLiveQuery } from "dexie-react-hooks";
import { toast } from "sonner";
import { getAllMessages, getChats } from "@/lib/db/actions";
import { useRouter } from "next/navigation";
import type { User } from "better-auth";

export function useFetchData({
  user,
  chatId,
}: {
  user: User | null;
  chatId?: string;
}) {
  const router = useRouter();
  const isSignedIn = !!user;
  const [hasCheckedLocalData, setHasCheckedLocalData] = useState(false);
  const [needsInitialFetch, setNeedsInitialFetch] = useState(false);

  const localChats = useLiveQuery(() => localDb.chats.toArray());
  const localMessages = useLiveQuery(() => localDb.messages.toArray());

  // Check if there is local data on first load
  useEffect(() => {
    if (!isSignedIn || hasCheckedLocalData) return;

    if (localChats !== undefined && localMessages !== undefined) {
      const hasLocalData = localChats.length > 0 || localMessages.length > 0;
      setNeedsInitialFetch(!hasLocalData);
      setHasCheckedLocalData(true);
    }
  }, [isSignedIn, localChats, localMessages, hasCheckedLocalData]);

  // Fetch all chats from server when no local data exists
  const {
    data: serverChats,
    isLoading: isLoadingChats,
    isError: isErrorChats,
  } = useQuery({
    queryKey: ["server-chats"],
    queryFn: async () => await getChats(),
    enabled: isSignedIn && needsInitialFetch,
    staleTime: Infinity,
  });

  // Fetch all messages from server when no local data exists
  const {
    data: serverMessages,
    isLoading: isLoadingAllMessages,
    isError: isErrorAllMessages,
  } = useQuery({
    queryKey: ["server-all-messages"],
    queryFn: async () => await getAllMessages(),
    enabled: isSignedIn && needsInitialFetch,
    staleTime: Infinity,
  });

  // Populate local DB with server data when available
  useEffect(() => {
    const populateLocalDb = async () => {
      if (!needsInitialFetch || !serverChats || !serverMessages) return;

      console.log("Populating local DB with server data", {
        chatsCount: serverChats.length,
        messagesCount: serverMessages.length,
      });

      try {
        await localDb.transaction(
          "rw",
          [localDb.chats, localDb.messages],
          async () => {
            await localDb.chats.bulkPut(serverChats);
            await localDb.messages.bulkPut(serverMessages);
          }
        );
      } catch (error) {
        toast.error("Failed to sync data locally");
      }
    };

    populateLocalDb();
  }, [needsInitialFetch, serverChats, serverMessages]);

  useEffect(() => {
    if (isErrorChats || isErrorAllMessages) {
      toast.error("Failed to fetch data from server");
      router.push("/");
    }
  }, [isErrorChats, isErrorAllMessages, router]);

  const chats = useMemo(() => {
    if (!isSignedIn) return [];

    if (localChats && localChats.length > 0) {
      return localChats.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    }

    return serverChats || [];
  }, [isSignedIn, localChats, serverChats]);

  const chatMessages = useLiveQuery(
    async () => {
      if (!chatId || !localMessages) return [];

      const messages = await localDb.messages
        .where("chatId")
        .equals(chatId)
        .sortBy("createdAt");

      return messages;
    },
    [chatId, localMessages],
    []
  );

  const messages = useMemo(() => {
    if (!chatId) return [];
    return chatMessages || [];
  }, [chatId, chatMessages]);

  return {
    loading: needsInitialFetch || isLoadingChats || isLoadingAllMessages, // just show loading when populating local db
    chats,
    messages,
  };
}
