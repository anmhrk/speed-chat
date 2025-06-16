import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadSearchInput } from "@/components/ThreadSearchInput";
import { UserButton } from "@/components/UserButton";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import Link from "next/link";
import { useState } from "react";
import type { User } from "better-auth";
import type { Thread } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";

interface AppSidebarProps {
  user: User | null;
  threads: Thread[];
  isLoading: boolean;
  newThreads: Set<string>;
  setChatId: (chatId: string | null) => void;
}

export function AppSidebar({
  user,
  threads,
  isLoading,
  newThreads,
  setChatId,
}: AppSidebarProps) {
  const [search, setSearch] = useState<string>("");
  const params = useParams<{ chatId: string }>();
  const chatId = params.chatId;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="relative flex items-center">
          <SidebarTrigger variant="ghost" />
          <Link
            href="/"
            className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold"
            onClick={() => setChatId(null)}
          >
            Speed Chat
          </Link>
        </div>

        <div className="mt-4">
          <Button className="w-full font-semibold" asChild>
            <Link href="/">New Chat</Link>
          </Button>

          <ThreadSearchInput search={search} setSearch={setSearch} />
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-1 px-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {threads
                .filter((thread) =>
                  thread.title.toLowerCase().includes(search.toLowerCase()),
                )
                .map((thread) => (
                  <Link
                    key={thread.id}
                    className={cn(
                      "hover:bg-muted flex items-center rounded-lg p-2 text-sm",
                      chatId === thread.id && "bg-muted",
                      newThreads.has(thread.id) && "bg-muted h-9 animate-pulse",
                    )}
                    href={`/chat/${thread.id}`}
                  >
                    <span className="truncate">{thread.title}</span>
                  </Link>
                ))}
            </div>
          </ScrollArea>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
