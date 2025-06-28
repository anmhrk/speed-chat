"use client";

import Link from "next/link";
import Image from "next/image";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroupLabel,
  SidebarMenuAction,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  PenBox,
  LogIn,
  Loader2,
  LogOut,
  Search,
  Settings,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  Pin,
  PinOff,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { User } from "better-auth";
import { signIn, signOut } from "@/lib/auth/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { SettingsDialog } from "./settings-dialog";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteChat,
  getChats,
  getMessages,
  handlePinChat,
  renameChatTitle,
} from "@/lib/actions";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Input } from "./ui/input";
import type { Chat } from "@/lib/db/schema";

interface AppSidebarProps {
  user: User | null;
  chatIdParams: string;
  settingsDialogOpen: boolean;
  setSettingsDialogOpen: (open: boolean) => void;
  dialogActiveItem: string;
  setDialogActiveItem: (item: string) => void;
}

export function AppSidebar({
  user,
  chatIdParams,
  settingsDialogOpen,
  setSettingsDialogOpen,
  dialogActiveItem,
  setDialogActiveItem,
}: AppSidebarProps) {
  const router = useRouter();
  const isSignedIn = !!user;
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const {
    data: chats,
    isLoading: isLoadingChats,
    isError: isErrorChats,
  } = useQuery({
    queryKey: ["chats"],
    queryFn: async () => await getChats(),
    enabled: isSignedIn,
  });

  useEffect(() => {
    if (isErrorChats) {
      toast.error("Failed to load chats");
      router.push("/");
    }
  }, [isErrorChats]);

  return (
    <Sidebar>
      <SidebarHeader className="flex items-center justify-between pt-5">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          <span className="text-lg font-semibold">SpeedChat</span>
        </Link>
        <SidebarGroup className="mt-1 px-0 pb-0">
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

            {isSignedIn && (
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setSettingsDialogOpen(true)}>
                  <Settings />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
            )}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex flex-1 flex-col">
          {isLoadingChats ? (
            <div className="flex flex-1 flex-col items-center justify-center">
              <Loader2 className="size-5 animate-spin mb-2" />
              <span className="text-sm text-muted-foreground">
                Loading chats...
              </span>
            </div>
          ) : chats && chats.length > 0 ? (
            <>
              {chats.filter((chat) => chat.isPinned).length > 0 && (
                <>
                  <SidebarGroupLabel>Pinned</SidebarGroupLabel>
                  <SidebarMenu>
                    {chats
                      .filter((chat) => chat.isPinned)
                      .map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          chatIdParams={chatIdParams}
                        />
                      ))}
                  </SidebarMenu>
                </>
              )}
              {chats.filter((chat) => !chat.isPinned).length > 0 && (
                <>
                  <SidebarGroupLabel>Chats</SidebarGroupLabel>
                  <SidebarMenu>
                    {chats
                      .filter((chat) => !chat.isPinned)
                      .map((chat) => (
                        <ChatItem
                          key={chat.id}
                          chat={chat}
                          chatIdParams={chatIdParams}
                        />
                      ))}
                  </SidebarMenu>
                </>
              )}
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
              <MessageSquare className="size-8 mb-2" />
              <span className="text-sm">No chats yet</span>
            </div>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SettingsDialog
        open={settingsDialogOpen}
        onOpenChange={setSettingsDialogOpen}
        chatsCount={chats?.length || 0}
        dialogActiveItem={dialogActiveItem}
        setDialogActiveItem={setDialogActiveItem}
      />

      <SidebarFooter>
        {isSignedIn ? (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2 transition-colors"
                >
                  <Image
                    src={user?.image || ""}
                    alt="User"
                    width={32}
                    height={32}
                    className="rounded-full object-cover cursor-pointer"
                  />
                  <span className="text-sm truncate font-normal">
                    {user?.name}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56">
                <DropdownMenuItem
                  onClick={() =>
                    void signOut({
                      fetchOptions: {
                        onSuccess: () => {
                          router.push("/");
                        },
                      },
                    })
                  }
                >
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <Button
            variant="ghost"
            className="justify-start flex h-12 w-full items-center gap-3 rounded-lg p-2 transition-colors"
            onClick={() => {
              setIsLoggingIn(true);
              signIn
                .social({ provider: "google", callbackURL: "/" })
                .finally(() => setIsLoggingIn(false));
            }}
            disabled={isLoggingIn}
          >
            {isLoggingIn ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <LogIn className="size-5" />
            )}
            Login
          </Button>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}

function ChatItem({
  chat,
  chatIdParams,
}: {
  chat: Chat;
  chatIdParams: string;
}) {
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const router = useRouter();
  const [isRenamingChat, setIsRenamingChat] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const clearInput = () => {
    setIsRenamingChat(false);
    setRenamingChatId(null);
    setNewChatTitle("");
  };

  return (
    <SidebarMenuItem
      key={chat.id}
      onMouseEnter={() => {
        if (chat.id === chatIdParams) return;
        queryClient.prefetchQuery({
          queryKey: ["messages", chat.id],
          queryFn: async () => await getMessages(chat.id),
        });
      }}
    >
      <SidebarMenuButton
        asChild={!(isRenamingChat && chat.id === renamingChatId)}
        isActive={chat.id === chatIdParams}
      >
        {isRenamingChat && chat.id === renamingChatId ? (
          <Input
            ref={renameInputRef}
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onBlur={clearInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
                  if (!oldData) return oldData;
                  return oldData.map((chatItem) =>
                    chatItem.id === chat.id
                      ? { ...chatItem, title: newChatTitle }
                      : chatItem
                  );
                });
                try {
                  renameChatTitle(chat.id, newChatTitle);
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to rename chat");
                }
                clearInput();
              } else if (e.key === "Escape") {
                clearInput();
              }
            }}
            className="border-none focus-visible:ring-0 !bg-transparent w-full px-0"
          />
        ) : (
          <Link href={`/chat/${chat.id}`}>
            <span className="truncate">{chat.title}</span>
          </Link>
        )}
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover className="!top-2 cursor-pointer">
            <MoreHorizontal />
            <span className="sr-only">Chat Actions</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-fit rounded-lg"
          side={isMobile ? "bottom" : "right"}
          align={isMobile ? "end" : "start"}
          onCloseAutoFocus={(e) => {
            if (isRenamingChat) {
              e.preventDefault();
            }
          }}
        >
          <DropdownMenuItem
            onClick={async () => {
              queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
                if (!oldData) return oldData;
                return oldData.map((chatItem) =>
                  chatItem.id === chat.id
                    ? {
                        ...chatItem,
                        isPinned: !chatItem.isPinned,
                      }
                    : chatItem
                );
              });

              // Update db in background but show optimistic update immediately
              try {
                handlePinChat(chat.id, chat.isPinned);
              } catch (error) {
                console.error(error);
                toast.error("Failed to pin chat");
              }
            }}
          >
            {chat.isPinned ? <PinOff /> : <Pin />}
            <span>{chat.isPinned ? "Unpin" : "Pin"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setIsRenamingChat(true);
              setRenamingChatId(chat.id);
              setNewChatTitle(chat.title);
              setTimeout(() => {
                renameInputRef.current?.focus();
                renameInputRef.current?.select();
              }, 100);
            }}
          >
            <Pencil />
            <span>Rename</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={async () => {
              try {
                await deleteChat(chat.id);
              } catch (error) {
                console.error(error);
                toast.error("Failed to delete chat");
              }

              queryClient.invalidateQueries({
                queryKey: ["chats"],
              });
              if (chat.id === chatIdParams) {
                router.push("/");
              }
            }}
          >
            <Trash2 />
            <span>Delete</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
