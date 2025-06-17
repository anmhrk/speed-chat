"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User as UserIcon,
  LogOut,
  BarChart3,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";

interface SettingsGeneralPageProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
}

export default function SettingsGeneralPage({
  preloadedUser,
}: SettingsGeneralPageProps) {
  const user = usePreloadedQuery(preloadedUser);
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState<boolean>(false);

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsDeletingAccount(true);
    // TODO: Implement account deletion
    alert("Account deletion not yet implemented");
    setIsDeletingAccount(false);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserIcon className="size-5" />
            <span>Profile</span>
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div className="flex min-w-0 flex-1 items-center gap-4">
              <Avatar className="ring-border h-16 w-16 ring-2">
                {user.image && (
                  <AvatarImage
                    src={user.image}
                    alt={user.name}
                    referrerPolicy="no-referrer"
                  />
                )}
                <AvatarFallback className="text-xl font-semibold">
                  {user.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="mb-1 text-xl font-semibold tracking-tight">
                  {user.name}
                </h3>
                <p className="text-muted-foreground mb-2 font-medium">
                  {user.email}
                </p>
                <div className="bg-muted inline-flex items-center gap-1.5 rounded-full px-2.5 py-1">
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <span className="text-xs font-medium">
                    Member since{" "}
                    {new Date(user._creationTime).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
            <Button
              onClick={async () => {
                setIsSigningOut(true);
                await signOut().finally(() => setIsSigningOut(false));
              }}
              disabled={isSigningOut}
              className="flex shrink-0 items-center gap-2"
            >
              <LogOut className="size-4" />
              <span>{isSigningOut ? "Signing out..." : "Sign Out"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="size-5" />
            <span>Usage Statistics</span>
          </CardTitle>
          <CardDescription>Your Speed Chat usage overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-muted-foreground text-sm">Messages Sent</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-muted-foreground text-sm">Chat Threads</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-muted-foreground text-sm">Tokens In</p>
            </div>
            <div className="space-y-1 text-center">
              <p className="text-2xl font-bold">--</p>
              <p className="text-muted-foreground text-sm">Tokens Out</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive flex items-center space-x-2">
            <AlertTriangle className="size-5" />
            <span>Danger Zone</span>
          </CardTitle>
          <CardDescription>
            Delete your account and all your data.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleDeleteAccount}
            disabled={isDeletingAccount}
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <Trash2 className="size-4" />
            <span>{isDeletingAccount ? "Deleting..." : "Delete Account"}</span>
          </Button>
          <p className="text-muted-foreground text-sm">
            <strong>Note: </strong>Once you delete your account, there is no
            going back. Please be certain. This will permanently remove all your
            data, including chat history and settings.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
