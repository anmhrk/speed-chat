'use client';

import type { User } from 'better-auth';
import { Loader2, LogIn, Palette, PenBox, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { authClient } from '@/backend/auth/auth-client';
import { env } from '@/backend/env/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  //   SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const isSignedIn = !!user;
  const [isLoggingIn, setIsLoggingIn] = useState(false);

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
        <SidebarGroup className="flex flex-1 flex-col" />
      </SidebarContent>

      <SidebarFooter>
        {isSignedIn ? (
          <Button
            className="flex h-12 w-full items-center justify-start gap-3 rounded-lg p-2"
            onClick={() => {
              // Open settings dialog here
            }}
            variant="ghost"
          >
            <Avatar>
              <AvatarImage src={user?.image || ''} />
              <AvatarFallback>{user?.name?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="truncate font-normal text-sm">{user?.name}</span>
          </Button>
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
      </SidebarFooter>
    </Sidebar>
  );
}
