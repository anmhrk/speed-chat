"use client";

import { Ghost, Github, GitFork } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { SidebarTrigger } from "./ui/sidebar";
import { usePathname, useRouter } from "next/navigation";
import { Toggle } from "./ui/toggle";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import Link from "next/link";
import type { User } from "better-auth";
import { forkChat } from "@/lib/db/actions";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface HeaderProps {
  chatId: string;
  user: User | null;
  temporaryChat: boolean;
  isOnSharedPage: boolean;
  didUserCreate: boolean;
}

export function Header({
  chatId,
  user,
  temporaryChat,
  isOnSharedPage,
  didUserCreate,
}: HeaderProps) {
  const router = useRouter();
  const isOnHomePage = usePathname() === "/";
  const queryClient = useQueryClient();

  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between h-12 p-3">
      <SidebarTrigger />
      <div className="flex items-center gap-1.5">
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
              {temporaryChat
                ? "Disable Temporary Chat"
                : "Enable Temporary Chat"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
