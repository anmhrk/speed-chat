'use client';

import { useMutation } from 'convex/react';
import { useQuery } from 'convex-helpers/react/cache/hooks';
import { Key, LogIn, LogOut, PenBox, Search, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo } from 'react';
import { toast } from 'sonner';
import { ApiKeysDialog } from '@/components/api-keys-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import type { Doc } from '@/convex/_generated/dataModel';
import { authClient } from '@/lib/auth/client';
import { SidebarChatItem } from './sidebar-chat-item';
import { Skeleton } from './ui/skeleton';

type AppSidebarProps = {
  authLoading: boolean;
  currentChatId: string;
  isStreaming: boolean;
  isApiKeysOpen: boolean;
  setIsApiKeysOpen: (open: boolean) => void;
  setIsSearchOpen: (open: boolean) => void;
};

export function AppSidebar({
  authLoading,
  currentChatId,
  isStreaming,
  isApiKeysOpen,
  setIsApiKeysOpen,
  setIsSearchOpen,
}: AppSidebarProps) {
  const router = useRouter();

  const user = useQuery(api.auth.getCurrentUser);
  const deleteUserData = useMutation(api.chatActions.deleteUserData);

  const chats = useQuery(api.chat.getChats, user ? {} : 'skip');
  const isLoadingChats = chats === undefined;

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
          <SidebarChatList
            authLoading={authLoading}
            chats={chats ?? []}
            currentChatId={currentChatId}
            isLoadingChats={isLoadingChats}
            isStreaming={isStreaming}
            user={user}
          />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {authLoading ? (
          <Skeleton className="h-12 w-full" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2"
                variant="ghost"
              >
                <Avatar>
                  <AvatarImage src={user?.image ?? ''} />
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
                  authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push('/');
                      },
                    },
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
                  const confirmed = confirm(
                    'Are you sure you want to delete your account? You will lose all your chats and data.'
                  );

                  if (!confirmed) return;

                  router.push('/');
                  toast.promise(
                    async () => {
                      await deleteUserData();
                      await authClient.deleteUser();
                      await authClient.signOut();
                    },
                    {
                      loading: 'Deleting account...',
                      success: 'Account deleted',
                      error: 'Failed to delete account',
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
          <Button
            className="flex w-full"
            onClick={() => authClient.signIn.social({ provider: 'google' })}
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

function SidebarChatList({
  authLoading,
  user,
  isLoadingChats,
  chats,
  currentChatId,
  isStreaming,
}: {
  authLoading: boolean;
  // biome-ignore lint/suspicious/noExplicitAny: useQuery returns any?
  user: any;
  isLoadingChats: boolean;
  chats: Doc<'chats'>[];
  currentChatId: string;
  isStreaming: boolean;
}) {
  const pinnedChats = useMemo(() => {
    return chats?.filter((chat) => chat.isPinned);
  }, [chats]);

  const normalChats = useMemo(() => {
    return chats?.filter((chat) => !chat.isPinned);
  }, [chats]);

  if (authLoading) {
    return (
      <div className="mx-auto my-auto flex text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto my-auto flex text-muted-foreground text-sm">
        Please login to view your chats.
      </div>
    );
  }

  if (isLoadingChats) {
    return (
      <div className="mx-auto my-auto flex text-muted-foreground text-sm">
        Loading...
      </div>
    );
  }

  if (chats?.length === 0) {
    return (
      <div className="mx-auto my-auto flex text-muted-foreground text-sm">
        No chats yet.
      </div>
    );
  }

  return (
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
  );
}
