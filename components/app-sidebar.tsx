'use client';

import type { User } from 'better-auth';
import {
  Key,
  Loader2,
  LogIn,
  LogOut,
  Palette,
  PenBox,
  Search,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { authClient } from '@/backend/auth/auth-client';
import { env } from '@/backend/env/client';
import ApiKeysDialog from '@/components/api-keys-dialog';
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
import { useCustomChat } from './providers/chat-provider';

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const isSignedIn = !!user;
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const { chats, isLoadingChats } = useCustomChat();

  const pinnedChats = useMemo(() => {
    return chats
      ?.filter((chat) => chat.isPinned)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [chats]);

  const normalChats = useMemo(() => {
    return chats
      ?.filter((chat) => !chat.isPinned)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }, [chats]);

  // TODO: If no saved chats, show something

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
          {isLoadingChats ? null : (
            <>
              {pinnedChats?.length !== 0 && (
                <>
                  <SidebarGroupLabel>Pinned</SidebarGroupLabel>
                  <SidebarMenu>
                    {pinnedChats?.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton asChild>
                          <Link href={`/c/${chat.id}`}>{chat.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </>
              )}
              {normalChats?.length !== 0 && (
                <>
                  <SidebarGroupLabel>Chats</SidebarGroupLabel>
                  <SidebarMenu>
                    {normalChats?.map((chat) => (
                      <SidebarMenuItem key={chat.id}>
                        <SidebarMenuButton asChild>
                          <Link href={`/c/${chat.id}`}>{chat.title}</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </>
              )}
            </>
          )}
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2"
                variant="ghost"
              >
                <Avatar>
                  <AvatarImage src={user?.image || ''} />
                  <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="truncate font-normal text-sm">
                  {user?.name}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem
                onClick={async () => {
                  await authClient.signOut({
                    fetchOptions: {
                      onSuccess: () => {
                        router.push('/');
                      },
                    },
                  });
                }}
              >
                <LogOut />
                Log out
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  console.log('delete account');
                }}
                variant="destructive"
              >
                <Trash2 /> Delete account
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setIsApiKeysOpen(true)}>
                <Key />
                Configure API keys
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button
            className="flex w-full"
            disabled={isLoggingIn}
            onClick={async () => {
              setIsLoggingIn(true);
              try {
                await authClient.signIn.social({
                  provider: 'google',
                  callbackURL: env.NEXT_PUBLIC_BASE_URL,
                });
              } catch (error) {
                console.error('Sign in failed:', error);
              } finally {
                setIsLoggingIn(false);
              }
            }}
            size="lg"
            variant="outline"
          >
            {isLoggingIn ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <LogIn className="size-5" />
            )}
            Login
          </Button>
        )}
        <ApiKeysDialog onOpenChange={setIsApiKeysOpen} open={isApiKeysOpen} />
      </SidebarFooter>
    </Sidebar>
  );
}
