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
} from "./ui/sidebar";
import { Button } from "./ui/button";
import {
  Images,
  Key,
  Palette,
  Plus,
  LogIn,
  Loader2,
  Trash,
  LogOut,
  Search,
} from "lucide-react";
import { useSidebar } from "./ui/sidebar";
import { useState } from "react";
import type { User } from "better-auth";
import { deleteUser, signIn, signOut } from "@/lib/auth/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const menuItems = [
  {
    label: "API Keys",
    icon: Key,
    href: "/api-keys",
  },
  {
    label: "Library",
    icon: Images,
    href: "/library",
  },
  {
    label: "Custom Instructions",
    icon: Palette,
    href: "/custom-instructions",
  },
];

interface AppSidebarProps {
  user: User | null;
}

export function AppSidebar({ user }: AppSidebarProps) {
  const { state } = useSidebar();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const isSignedIn = !!user;

  const handleDeleteUser = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      await deleteUser();
      // delete db stuff for user
      // router.push("/");
    }
  };

  return (
    <Sidebar
      variant={state === "expanded" ? "inset" : "sidebar"}
      className="border-r-0"
    >
      <SidebarHeader className="flex items-center flex-col gap-6 justify-center py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          <span className="text-lg font-semibold">SpeedChat</span>
        </Link>

        <Button
          className="w-full rounded-xl flex items-center justify-center"
          variant="outline"
          asChild
        >
          <Link href="/">
            <Plus className="size-5" />
            New Chat
          </Link>
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton className="cursor-pointer">
                <Search className="size-5" />
                Search Chats
              </SidebarMenuButton>
            </SidebarMenuItem>

            {menuItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton asChild>
                  <Link href={item.href}>
                    <item.icon className="size-5" />
                    {item.label}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

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
                  <span className="text-sm">{user?.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 size-4" />
                  Logout
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={handleDeleteUser}
                >
                  <Trash className="mr-2 size-4" />
                  Delete Account
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
