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
import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import type { User } from "better-auth";
import { Skeleton } from "./ui/skeleton";
import type { Thread } from "@/lib/types";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  user: User | null | undefined;
  threads: Thread[];
  isLoading?: boolean;
}

export function AppSidebar({ user, threads, isLoading }: AppSidebarProps) {
  const [search, setSearch] = useState<string>("");
  const routerState = useRouterState();

  const chatId = routerState.location.pathname.startsWith("/chat/")
    ? routerState.location.pathname.split("/chat/")[1]
    : undefined;

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="relative flex items-center">
          <SidebarTrigger variant="ghost" />
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
          <div className="space-y-2">
            {isLoading
              ? Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="flex items-center rounded-lg p-2">
                    <Skeleton className="h-5 w-full animate-pulse rounded-md" />
                  </div>
                ))
              : threads
                  .filter((thread) =>
                    thread.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((thread) => (
                    <Link
                      key={thread.id}
                      className={cn(
                        "hover:bg-muted flex items-center rounded-lg p-2 text-sm",
                        chatId === thread.id && "bg-muted",
                      )}
                      to="/chat/$chatId"
                      params={{ chatId: thread.id }}
                    >
                      <span className="truncate">
                        {thread.title === "" ? (
                          <Skeleton className="h-4 w-full animate-pulse rounded-md" />
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
