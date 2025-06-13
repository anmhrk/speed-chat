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
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { User } from "better-auth";
import { Skeleton } from "./ui/skeleton";

interface Thread {
  id: string;
  title: string;
}

interface AppSidebarProps {
  user: User | null | undefined;
  status?: "error" | "submitted" | "streaming" | "ready";
  threads: Thread[];
  setThreads?: React.Dispatch<React.SetStateAction<Thread[]>>;
}

export function AppSidebar({ user, threads }: AppSidebarProps) {
  const [search, setSearch] = useState<string>("");

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="relative flex items-center">
          <SidebarTrigger />
          <Link
            to="/"
            className="absolute left-1/2 -translate-x-1/2 text-lg font-semibold"
          >
            Speed Chat
          </Link>
        </div>

        <div className="mt-4">
          <Button className="w-full font-semibold" asChild>
            <Link to="/">New Chat</Link>
          </Button>

          <ThreadSearchInput search={search} setSearch={setSearch} />
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-1 px-4">
        <ScrollArea className="h-full">
          {/* TODO: Sort threads by relative date later once db fetching is implemented */}
          <div className="space-y-2">
            {threads
              .filter((thread) =>
                thread.title.toLowerCase().includes(search.toLowerCase()),
              )
              .map((thread) => (
                <Link
                  key={thread.id}
                  className="hover:bg-muted flex items-center rounded-lg p-2 text-sm"
                  to="/chat/$chatId"
                  params={{ chatId: thread.id }}
                >
                  <span className="truncate">
                    {thread.title === "" ? (
                      <Skeleton className="h-4 w-full rounded" />
                    ) : (
                      thread.title
                    )}
                  </span>
                </Link>
              ))}
          </div>
        </ScrollArea>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <UserButton user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
