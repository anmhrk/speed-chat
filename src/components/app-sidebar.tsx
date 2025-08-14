"use client";

import { Key, LogIn, LogOut, PenBox, Search, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
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
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useAuth, useClerk, useUser } from "@clerk/nextjs";
import { Skeleton } from "./ui/skeleton";
import { deleteUser } from "@/lib/user-actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface AppSidebarProps {
  userId: string | null;
  currentChatId: string;
  isStreaming: boolean;
  isApiKeysOpen: boolean;
  setIsApiKeysOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
}

export function AppSidebar({
  userId,
  currentChatId,
  isStreaming,
  isApiKeysOpen,
  setIsApiKeysOpen,
  setIsSearchOpen,
}: AppSidebarProps) {
  const { user, isLoaded } = useUser();
  const clerk = useClerk();
  const { signOut } = useAuth();
  const router = useRouter();

  const deleteUserData = useMutation(api.chatActions.deleteUserData);

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
              <SidebarMenuButton onClick={() => setIsSearchOpen(true)}>
                <Search />
                Search chats
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex flex-1 flex-col gap-1">
          {!userId ? (
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
          ) : (
            <>
              {pinnedChats && pinnedChats.length > 0 && (
                <>
                  <SidebarGroupLabel>Pinned</SidebarGroupLabel>
                  <SidebarMenu>
                    {pinnedChats.map((chat) => (
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
              {normalChats && normalChats.length > 0 && (
                <>
                  <SidebarGroupLabel>Chats</SidebarGroupLabel>
                  <SidebarMenu>
                    {normalChats.map((chat) => (
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
            </>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {userId ? (
          isLoaded ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2"
                  variant="ghost"
                >
                  <Avatar>
                    <AvatarImage src={user?.imageUrl || ""} />
                    <AvatarFallback>{user?.fullName?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate font-normal text-sm">
                    {user?.fullName}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => signOut({ redirectUrl: "/" })}>
                  <LogOut />
                  Log out
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsApiKeysOpen(true)}>
                  <Key />
                  Configure API keys
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    const confirmed = confirm(
                      "Are you sure you want to delete your account? You will lose all your chats and data."
                    );

                    if (!confirmed) return;

                    // getMessages is reactive, we have to push user to homepage first and can't do after signout
                    // because if user is on chat page, once chat is deleted, getMessages will throw
                    router.push("/");
                    toast.promise(
                      async () => {
                        await deleteUserData();
                        await deleteUser(userId);
                        await signOut();
                      },
                      {
                        loading: "Deleting account...",
                        success: "Account deleted",
                        error: "Failed to delete account",
                      }
                    );
                  }}
                  variant="destructive"
                >
                  <Trash2 /> Delete account
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Skeleton className="h-12 w-full" />
          )
        ) : (
          <Button
            className="flex w-full"
            onClick={() => clerk.openSignIn()}
            size="lg"
            variant="outline"
          >
            <LogIn className="size-5" strokeWidth={1.7} />
            Login
          </Button>
        )}
        <ApiKeysDialog onOpenChange={setIsApiKeysOpen} open={isApiKeysOpen} />
      </SidebarFooter>
    </Sidebar>
  );
}
