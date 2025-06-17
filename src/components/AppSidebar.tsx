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
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Loader2, Trash, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Doc } from "../../convex/_generated/dataModel";

interface AppSidebarProps {
  user: Doc<"users"> | null;
  threads: Doc<"chats">[] | undefined;
  isLoading: boolean;
  newThreads: Set<string>;
  chatId: string | null;
  setChatId: (chatId: string | null) => void;
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
          <Button
            className="w-full font-semibold"
            asChild
            onClick={() => setChatId(null)}
          >
            <Link href="/">New Chat</Link>
          </Button>

          <ThreadSearchInput search={search} setSearch={setSearch} />
        </div>
      </SidebarHeader>

      <SidebarContent className="mt-1 px-4">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="text-muted-foreground size-7 animate-spin" />
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {threads &&
                threads.length > 0 &&
                threads
                  .filter((thread) =>
                    thread.title.toLowerCase().includes(search.toLowerCase()),
                  )
                  .map((thread) => (
                    <Link
                      key={thread.chatId}
                      className={cn(
                        "hover:bg-muted group flex items-center rounded-lg p-2 text-sm",
                        chatId === thread.chatId &&
                          "bg-primary/10 hover:bg-primary/10",
                        newThreads.has(thread.chatId) &&
                          "bg-primary/10 h-9 animate-pulse",
                      )}
                      href={`/chat/${thread.chatId}`}
                    >
                      <span className="truncate">{thread.title}</span>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <Trash className="size-4" />
                      </Button>
                    </Link>
                  ))}
            </div>
          </ScrollArea>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4">
        {user ? (
          <>
            <Link
              className="hover:bg-muted flex h-12 w-full items-center space-x-3 rounded-lg p-2 transition-colors"
              href="/settings"
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
