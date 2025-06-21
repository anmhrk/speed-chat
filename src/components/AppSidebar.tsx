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
import { useMobile } from "@/hooks/useMobile";
import {
  isToday,
  isYesterday,
  isWithinInterval,
  subDays,
  startOfDay,
} from "date-fns";
import { useChatContext } from "@/hooks/useChatContext";
import type { User } from "better-auth";
import { chat } from "@/lib/db/schema";
import { useCallback } from "react";

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { chatId, setChatId, newChatIds, chats, isLoadingChats } =
    useChatContext();
  const [search, setSearch] = useState<string>("");
  const isMobile = useMobile();

  const categorizeChatsByTime = useCallback(() => {
    const now = new Date();
    const sevenDaysAgo = startOfDay(subDays(now, 7));

    if (!chats) return null;

    const filteredChats = chats.filter((chat) =>
      chat.title.toLowerCase().includes(search.toLowerCase()),
    );

    const todayChats = filteredChats
      .filter((chat) => isToday(chat.updatedAt))
      .sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

    const yesterdayChats = filteredChats
      .filter((chat) => isYesterday(chat.updatedAt))
      .sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

    const past7DaysChats = filteredChats
      .filter((chat) => {
        return (
          !isToday(chat.updatedAt) &&
          !isYesterday(chat.updatedAt) &&
          isWithinInterval(chat.updatedAt, { start: sevenDaysAgo, end: now })
        );
      })
      .sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

    const olderChats = filteredChats
      .filter((chat) => {
        return (
          !isToday(chat.updatedAt) &&
          !isYesterday(chat.updatedAt) &&
          !isWithinInterval(chat.updatedAt, { start: sevenDaysAgo, end: now })
        );
      })
      .sort((a, b) => {
        if (!a.updatedAt || !b.updatedAt) return 0;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
      });

    return {
      today: todayChats,
      yesterday: yesterdayChats,
      past7Days: past7DaysChats,
      older: olderChats,
    };
  }, [chats, search]);

  const categorizedChats = useMemo(() => {
    return categorizeChatsByTime();
  }, [categorizeChatsByTime]);

  const renderChatSection = (
    sectionTitle: string,
    chats: (typeof chat.$inferSelect)[],
  ) => {
    if (chats.length === 0) return null;

    return (
      <div key={sectionTitle} className="mb-4">
        <h3 className="text-muted-foreground mb-2 text-xs font-medium tracking-wider uppercase">
          {sectionTitle}
        </h3>
        <div className="flex flex-col space-y-2">
          {chats.map((chat) => (
            <Link
              key={chat.id}
              href={`/chat/${chat.id}`}
              className={cn(
                "hover:bg-muted flex items-center rounded-lg p-2 text-sm",
                chatId === chat.id && "bg-primary/10 hover:bg-primary/10",
                newChatIds.has(chat.id) && "bg-primary/10 h-9 animate-pulse",
              )}
            >
              {/* TODO: Fix this manual width control. probably bad css */}
              <span
                className={cn(
                  "max-w-[205px] truncate",
                  isMobile && "max-w-[240px]",
                )}
              >
                {chat.title}
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
        {isLoadingChats ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground size-7 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            {categorizedChats && (
              <div className="space-y-1 px-4">
                {renderChatSection("Today", categorizedChats.today)}
                {renderChatSection("Yesterday", categorizedChats.yesterday)}
                {renderChatSection("Past 7 days", categorizedChats.past7Days)}
                {renderChatSection("Older", categorizedChats.older)}
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
