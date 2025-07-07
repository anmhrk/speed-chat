import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getChats } from "@/lib/db/actions";
import { toast } from "sonner";
import { useEffect } from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarHeader,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroupLabel,
  SidebarContent,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { PenBox, LogIn, Search, MessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { ShareChatDialog } from "./share-chat-dialog";
import { SidebarItem } from "./sidebar-item";
import { signIn } from "@/lib/auth/auth-client";
import type { User } from "better-auth";

interface AppSidebarProps {
  user: User | null;
  chatIdParams: string;
  isMessageStreaming: boolean;
  onSearchChatsOpen?: () => void;
}

export function AppSidebar({
  user,
  chatIdParams,
  isMessageStreaming,
  onSearchChatsOpen,
}: AppSidebarProps) {
  const router = useRouter();
  const isSignedIn = !!user;
  const [isShareChatDialogOpen, setIsShareChatDialogOpen] = useState(false);
  const [shareChatId, setShareChatId] = useState<string | null>(null);
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
  }, [isErrorChats, router]);

  const handleShareChat = (chatId: string) => {
    setShareChatId(chatId);
    setIsShareChatDialogOpen(true);
  };

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
              <SidebarMenuButton onClick={onSearchChatsOpen}>
                <Search />
                Search chats
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="flex flex-1 flex-col">
          {isLoadingChats ? null : chats && chats.length > 0 ? (
            <>
              {chats.filter((chat) => chat.isPinned).length > 0 && (
                <>
                  <SidebarGroupLabel>Pinned</SidebarGroupLabel>
                  <SidebarMenu>
                    {chats
                      .filter((chat) => chat.isPinned)
                      .map((chat) => (
                        <SidebarItem
                          key={chat.id}
                          chat={chat}
                          chatIdParams={chatIdParams}
                          isMessageStreaming={isMessageStreaming}
                          onShareChat={handleShareChat}
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
                        <SidebarItem
                          key={chat.id}
                          chat={chat}
                          chatIdParams={chatIdParams}
                          isMessageStreaming={isMessageStreaming}
                          onShareChat={handleShareChat}
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

      <SidebarFooter>
        {isSignedIn ? (
          <Link
            href="/settings"
            className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
          >
            <Image
              src={user?.image || ""}
              alt="User"
              width={32}
              height={32}
              className="rounded-full object-cover cursor-pointer"
            />
            <span className="text-sm truncate font-normal">{user?.name}</span>
          </Link>
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

      <ShareChatDialog
        chatId={shareChatId}
        isOpen={isShareChatDialogOpen}
        onOpenChange={setIsShareChatDialogOpen}
        chat={chats?.find((chat) => chat.id === shareChatId)}
      />
    </Sidebar>
  );
}
