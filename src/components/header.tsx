"use client";

import { Button } from "@/components/ui/button";
import {
  Settings,
  Key,
  Palette,
  Moon,
  LogIn,
  TextSearch,
  Loader2,
  LogOut,
  Trash,
} from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import type { User } from "better-auth";
import { signIn, signOut, deleteUser } from "@/lib/auth/auth-client";
import { useState } from "react";

interface HeaderProps {
  user: User | null;
}

export function Header({ user }: HeaderProps) {
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { theme, setTheme } = useTheme();
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
    <div className="sticky top-0 z-10 flex items-center justify-between h-10">
      <div className="flex items-center gap-2">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="Logo" width={32} height={32} />
          <span className="text-lg font-semibold">SpeedChat</span>
        </Link>

        {/* Title will go here on chat page */}
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <TextSearch className="size-6" />
                <span className="sr-only">View Chat History</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>View Chat History</TooltipContent>
          </Tooltip>

          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Settings className="size-6" />
                    <span className="sr-only">Settings</span>
                  </Button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent>Settings</TooltipContent>
            </Tooltip>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={!isSignedIn} asChild>
                <Link href="/settings/keys" className="flex items-center gap-2">
                  <Key className="mr-2 size-4" />
                  Configure API Keys
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled={!isSignedIn} asChild>
                <Link
                  href="/settings/customization"
                  className="flex items-center gap-2"
                >
                  <Palette className="mr-2 size-4" />
                  Set Custom Instructions
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  setTheme(theme === "dark" ? "light" : "dark");
                }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <Moon className="size-4" />
                  <span>Dark mode</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) =>
                    setTheme(checked ? "dark" : "light")
                  }
                />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isSignedIn ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Image
                src={user?.image || ""}
                alt="User"
                width={32}
                height={32}
                className="rounded-full object-cover cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
        ) : (
          <Button
            variant="outline"
            className="rounded-xl"
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
              <>
                <LogIn className="size-5" />
                <span className="text-sm">Login</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
