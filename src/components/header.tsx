"use client";

import { Ghost, Github, GitFork, Search, Plus, Menu } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { SidebarTrigger, useSidebar } from "./ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Toggle } from "./ui/toggle";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import Link from "next/link";
import type { User } from "better-auth";
import { forkChat } from "@/lib/actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

interface HeaderProps {
  chatId: string;
  user: User | null;
  temporaryChat: boolean;
  isOnSharedPage: boolean;
  didUserCreate: boolean;
  onSearchChatsOpen: () => void;
}

export function Header({
  chatId,
  user,
  temporaryChat,
  isOnSharedPage,
  didUserCreate,
  onSearchChatsOpen,
}: HeaderProps) {
  const { open } = useSidebar();
  const { isMobile } = useMobile();
  const router = useRouter();
  const isOnHomePage = usePathname() === "/";

  if (isMobile) {
    return (
      <MobileHeader
        user={user}
        temporaryChat={temporaryChat}
        onSearchChatsOpen={onSearchChatsOpen}
        chatId={chatId}
        isOnSharedPage={isOnSharedPage}
        didUserCreate={didUserCreate}
      />
    );
  }

  return (
    <div className="flex items-center justify-between h-12 p-3">
      <div className="flex items-center gap-1.5">
        <SidebarTrigger />
        {(!open || isMobile) && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              asChild
            >
              <Link href="/">
                <Plus className="size-5" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onSearchChatsOpen}
            >
              <Search className="size-4.5" />
            </Button>
          </>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <ForkButton
          chatId={chatId}
          isOnSharedPage={isOnSharedPage}
          didUserCreate={didUserCreate}
          user={user}
        />

        {isOnHomePage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                asChild
              >
                <Link
                  href="https://github.com/anmhrk/speed-chat"
                  target="_blank"
                >
                  <Github className="size-5" />
                  <span className="sr-only">GitHub</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View repo on GitHub</TooltipContent>
          </Tooltip>
        )}

        <ThemeToggle />

        {user && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  size="icon"
                  pressed={temporaryChat}
                  onPressedChange={() => {
                    if (temporaryChat) {
                      router.push("/");
                    } else {
                      router.push("/?temporary=true");
                    }
                  }}
                  className="rounded-full"
                >
                  <Ghost className="size-5" />
                  <span className="sr-only">Temporary Chat</span>
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {temporaryChat ? "Close Temporary Chat" : "Start Temporary Chat"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}

function ForkButton({
  chatId,
  isOnSharedPage,
  didUserCreate,
  user,
}: {
  chatId: string;
  isOnSharedPage: boolean;
  didUserCreate: boolean;
  user: User | null;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return (
    <>
      {isOnSharedPage &&
        (didUserCreate ? (
          <Button
            variant="outline"
            className="rounded-lg h-9 w-fit items-center justify-center gap-2"
            asChild
          >
            <Link href={`/chat/${chatId}`}>Back to chat</Link>
          </Button>
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="rounded-lg h-9 w-fit items-center justify-center gap-2"
                onClick={() => {
                  if (!user) {
                    toast.error("You must be logged in to fork a chat");
                    return;
                  }

                  const newChatId = crypto.randomUUID();
                  toast.promise(
                    forkChat(chatId, newChatId).then(() => {
                      queryClient.invalidateQueries({ queryKey: ["chats"] });
                      router.push(`/chat/${newChatId}`);
                    }),
                    {
                      loading: "Forking chat...",
                      success: "Chat forked!",
                      error: "Failed to fork chat",
                    }
                  );
                }}
              >
                <GitFork className="size-4" />
                Fork
              </Button>
            </TooltipTrigger>
            <TooltipContent>Fork this chat to send messages</TooltipContent>
          </Tooltip>
        ))}
    </>
  );
}

function MobileHeader({
  user,
  temporaryChat,
  onSearchChatsOpen,
  chatId,
  isOnSharedPage,
  didUserCreate,
}: {
  user: User | null;
  temporaryChat: boolean;
  onSearchChatsOpen: () => void;
  chatId: string;
  isOnSharedPage: boolean;
  didUserCreate: boolean;
}) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between h-12 p-3">
      <SidebarTrigger />
      <div className="flex items-center gap-1.5">
        <ForkButton
          chatId={chatId}
          isOnSharedPage={isOnSharedPage}
          didUserCreate={didUserCreate}
          user={user}
        />
        <ThemeToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Menu className="size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => router.push("/")}
              className="cursor-pointer"
            >
              <Plus className="size-4 mr-2" />
              New chat
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={onSearchChatsOpen}
              className="cursor-pointer"
            >
              <Search className="size-4 mr-2" />
              Search chats
            </DropdownMenuItem>
            {user && (
              <DropdownMenuItem
                onClick={() => {
                  if (temporaryChat) {
                    router.push("/");
                  } else {
                    router.push("/?temporary=true");
                  }
                }}
                className="cursor-pointer"
              >
                <Ghost className="size-4 mr-2" />
                {temporaryChat ? "Close" : "Start"} temporary chat
              </DropdownMenuItem>
            )}

            <DropdownMenuItem asChild>
              <Link
                href="https://github.com/anmhrk/speed-chat"
                target="_blank"
                className="cursor-pointer"
              >
                <Github className="size-4 mr-2" />
                View repo on GitHub
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
