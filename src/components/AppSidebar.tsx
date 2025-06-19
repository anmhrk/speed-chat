"use client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ThreadSearchInput } from "@/components/ThreadSearchInput";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Link from "next/link";
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Loader2, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doc } from "../../convex/_generated/dataModel";
import { useMobile } from "@/hooks/useMobile";
import {
  isToday,
  isYesterday,
  isWithinInterval,
  subDays,
  startOfDay,
} from "date-fns";

interface AppSidebarProps {
  user: Doc<"users"> | null;
  threads: Doc<"chats">[] | undefined;
  isLoading: boolean;
  newThreads: Set<string>;
  chatId: string | null;
  setChatId: (chatId: string | null) => void;
}

function categorizeThreadsByTime(threads: Doc<"chats">[], search: string) {
  const now = new Date();
  const sevenDaysAgo = startOfDay(subDays(now, 7));

  const filteredThreads = threads.filter((thread) =>
    thread.title.toLowerCase().includes(search.toLowerCase()),
  );

  const todayThreads = filteredThreads
    .filter((thread) => isToday(new Date(thread.updatedAt)))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const yesterdayThreads = filteredThreads
    .filter((thread) => isYesterday(new Date(thread.updatedAt)))
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const past7DaysThreads = filteredThreads
    .filter((thread) => {
      const threadDate = new Date(thread.updatedAt);
      return (
        !isToday(threadDate) &&
        !isYesterday(threadDate) &&
        isWithinInterval(threadDate, { start: sevenDaysAgo, end: now })
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const olderThreads = filteredThreads
    .filter((thread) => {
      const threadDate = new Date(thread.updatedAt);
      return (
        !isToday(threadDate) &&
        !isYesterday(threadDate) &&
        !isWithinInterval(threadDate, { start: sevenDaysAgo, end: now })
      );
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);

  return {
    today: todayThreads,
    yesterday: yesterdayThreads,
    past7Days: past7DaysThreads,
    older: olderThreads,
  };
}

export function AppSidebar({
  user,
  threads,
  isLoading,
  newThreads,
  chatId,
  setChatId,
}: AppSidebarProps) {
  const [search, setSearch] = useState<string>("");
  const isMobile = useMobile();

  const categorizedThreads = useMemo(() => {
    if (!threads) return null;
    return categorizeThreadsByTime(threads, search);
  }, [threads, search]);

  const renderThreadSection = (title: string, threads: Doc<"chats">[]) => {
    if (threads.length === 0) return null;

    return (
      <div key={title} className="mb-4">
        <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          {title}
        </h3>
        <div className="flex flex-col space-y-2">
          {threads.map((thread) => (
            <Link
              key={thread.chatId}
              href={`/chat/${thread.chatId}`}
              className={cn(
                "hover:bg-muted flex items-center rounded-lg p-2 text-sm",
                chatId === thread.chatId && "bg-primary/10 hover:bg-primary/10",
                newThreads.has(thread.chatId) &&
                  "bg-primary/10 h-9 animate-pulse",
              )}
            >
              {/* TODO: Fix this manual width control. probably bad css */}
              <span
                className={cn(
                  "max-w-[205px] truncate",
                  isMobile && "max-w-[240px]",
                )}
              >
                {thread.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    );
  };

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
            <Link href="/" onClick={() => setChatId(null)}>
              New Chat
            </Link>
          </Button>

          <ThreadSearchInput search={search} setSearch={setSearch} />
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-1">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground size-7 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            {categorizedThreads && (
              <div className="space-y-1 px-4">
                {renderThreadSection("Today", categorizedThreads.today)}
                {renderThreadSection("Yesterday", categorizedThreads.yesterday)}
                {renderThreadSection(
                  "Past 7 days",
                  categorizedThreads.past7Days,
                )}
                {renderThreadSection("Older", categorizedThreads.older)}
              </div>
            )}
          </ScrollArea>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user ? (
          <>
            <Link
              className="hover:bg-muted flex h-12 w-full items-center space-x-3 rounded-lg p-2 transition-colors"
              href="/settings"
              onClick={() => setChatId(null)}
            >
              <div className="flex-shrink-0">
                <Avatar>
                  {user.image && (
                    <AvatarImage
                      src={user.image}
                      alt={user.name}
                      className="h-8 w-8 rounded-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <AvatarFallback>
                    {user.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{user.name}</p>
              </div>
            </Link>
          </>
        ) : (
          <>
            <Link
              className="hover:bg-muted flex h-12 w-full items-center rounded-lg p-2 transition-colors"
              href="/login"
            >
              <LogIn className="mr-3 size-4" />
              Login
            </Link>
          </>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
