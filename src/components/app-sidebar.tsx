"use client";

import {
  Key,
  Loader2,
  LogIn,
  LogOut,
  Palette,
  PenBox,
  Search,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ApiKeysDialog } from "@/components/api-keys-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SidebarChatItem } from "./sidebar-chat-item";
import { Doc } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

interface AppSidebarProps {
  user: Doc<"users"> | null;
  currentChatId: string;
  isStreaming: boolean;
}

export function AppSidebar({
  user,
  currentChatId,
  isStreaming,
}: AppSidebarProps) {
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const { signIn, signOut } = useAuthActions();

  const chats = useQuery(api.chat.getChats, user ? {} : "skip");
  const isLoadingChats = chats === undefined;

  const pinnedChats = useMemo(() => {
    return chats?.filter((chat) => chat.isPinned);
  }, [chats]);

  const normalChats = useMemo(() => {
    return chats?.filter((chat) => !chat.isPinned);
  }, [chats]);

  return (
    <Sidebar variant="inset">
      <SidebarHeader className="flex flex-col items-center">
        <Link className="flex items-center gap-2" href="/">
          <Image alt="Logo" height={32} src="/logo.svg" width={32} />
          <span className="font-medium text-lg">SpeedChat</span>
        </Link>
        <SidebarGroup className="px-0 pb-0">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/">
                  <PenBox />
                  New chat
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton>
                <Search />
                Search chats
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton asChild>
                <Link href="/library">
                  <Palette />
                  Library
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex flex-1 flex-col gap-1">
          {!user ? (
            <div className="mx-auto my-auto flex text-muted-foreground text-sm">
              Please login to view your chats.
            </div>
          ) : isLoadingChats ? (
            <div className="mx-auto my-auto flex text-muted-foreground text-sm">
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="mx-auto my-auto flex text-muted-foreground text-sm">
              No chats yet.
            </div>
          ) : pinnedChats?.length !== 0 ? (
            <>
              <SidebarGroupLabel>Pinned</SidebarGroupLabel>
              <SidebarMenu>
                {pinnedChats?.map((chat) => (
                  <SidebarChatItem
                    chat={chat}
                    currentChatId={currentChatId}
                    isStreaming={isStreaming}
                    key={chat.id}
                  />
                ))}
              </SidebarMenu>
            </>
          ) : (
            <>
              <SidebarGroupLabel>Chats</SidebarGroupLabel>
              <SidebarMenu>
                {normalChats?.map((chat) => (
                  <SidebarChatItem
                    chat={chat}
                    currentChatId={currentChatId}
                    isStreaming={isStreaming}
                    key={chat.id}
                  />
                ))}
              </SidebarMenu>
            </>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2"
                variant="ghost"
              >
                <Avatar>
                  <AvatarImage src={user?.image || ""} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate font-normal text-sm">
                  {user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={() =>
                  void signOut().then(() => {
                    router.push("/");
                  })
                }
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsApiKeysOpen(true)}>
                <Key />
                Configure API keys
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  console.log("delete account");
                }}
                variant="destructive"
              >
                <Trash2 /> Delete account
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="flex w-full"
            disabled={isLoggingIn}
            onClick={() => {
              setIsLoggingIn(true);
              void signIn("google").then(() => {
                setIsLoggingIn(false);
              });
            }}
            size="lg"
            variant="outline"
          >
            {isLoggingIn ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <LogIn className="size-5" strokeWidth={1.7} />
            )}
            Login
          </Button>
        )}
        <ApiKeysDialog onOpenChange={setIsApiKeysOpen} open={isApiKeysOpen} />
      </SidebarFooter>
    </Sidebar>
  );
}
