import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { localDb } from "@/lib/db/dexie";
import { toast } from "sonner";
import { getAllMessages, getChats } from "@/lib/db/actions";
import { useRouter } from "next/navigation";
import type { User } from "better-auth";

export function useDataSync({ user }: { user: User | null }) {
  const router = useRouter();
  const isSignedIn = !!user;
  const [hasCheckedLocalData, setHasCheckedLocalData] = useState(false);
  const [needsInitialFetch, setNeedsInitialFetch] = useState(false);

  // Check if there is local data on first load
  useEffect(() => {
    if (!isSignedIn || hasCheckedLocalData) return;

    const fetchLocalData = async () => {
      const localChats = await localDb.chats.toArray();
      const localMessages = await localDb.messages.toArray();

      if (localChats !== undefined && localMessages !== undefined) {
        const hasLocalData = localChats.length > 0 || localMessages.length > 0;
        setNeedsInitialFetch(!hasLocalData);
        setHasCheckedLocalData(true);
      }
    };

    fetchLocalData();
  }, [isSignedIn, hasCheckedLocalData]);

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
    queryKey: ["server-messages"],
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

        setNeedsInitialFetch(false);
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

  return {
    loading: needsInitialFetch || isLoadingChats || isLoadingAllMessages,
  };
}
