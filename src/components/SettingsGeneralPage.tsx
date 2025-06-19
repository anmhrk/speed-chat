"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  User,
  LogOut,
  BarChart3,
  AlertTriangle,
  Trash2,
  RotateCcw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import {
  Preloaded,
  usePreloadedQuery,
  useQuery,
  useMutation,
} from "convex/react";
import { api } from "../../convex/_generated/api";
import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface SettingsGeneralPageProps {
  preloadedUser: Preloaded<typeof api.auth.getCurrentUser>;
}

function formatNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(1) + "B";
  }
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + "M";
  }
  if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + "K";
  }
  return num.toString();
}

export default function SettingsGeneralPage({
  preloadedUser,
}: SettingsGeneralPageProps) {
  const user = usePreloadedQuery(preloadedUser);
  const router = useRouter();
  const { signOut } = useAuthActions();
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);
  const [isResettingUsage, setIsResettingUsage] = useState<boolean>(false);

  const usageData = useQuery(api.chat.fetchUsage, user ? {} : "skip");
  const isLoadingUsage = usageData === undefined;

  const resetUsage = useMutation(api.chat.resetUsage);

  const handleResetUsage = async () => {
    if (
      !confirm(
        "Are you sure you want to reset your usage statistics? This action cannot be undone.",
      )
    ) {
      return;
    }

    setIsResettingUsage(true);
    try {
      await resetUsage({});
    } catch (error) {
      console.error(error);
      toast.error("Failed to reset usage statistics", {
        description:
          error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsResettingUsage(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      return;
    }

    alert("Account deletion not yet implemented");
  };

  if (!user) {
    return null;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="size-5" />
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
                await signOut().finally(() => {
                  setIsSigningOut(false);
                  router.push("/");
                });
              }}
              variant="outline"
              size="sm"
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
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="size-5" />
                <span>Usage Statistics</span>
              </CardTitle>
              <CardDescription>Your Speed Chat usage overview</CardDescription>
            </div>
            {usageData &&
              (usageData.messagesSent > 0 ||
                usageData.chatsCreated > 0 ||
                usageData.promptTokens > 0 ||
                usageData.completionTokens > 0) && (
                <Button
                  onClick={handleResetUsage}
                  disabled={isResettingUsage || isLoadingUsage}
                  variant="outline"
                  size="sm"
                  className="flex shrink-0 items-center gap-2"
                >
                  <RotateCcw className="size-4" />
                  <span>{isResettingUsage ? "Resetting..." : "Reset"}</span>
                </Button>
              )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1 text-center">
              {isLoadingUsage ? (
                <Skeleton className="mx-auto h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {usageData?.messagesSent ?? 0}
                </p>
              )}
              <p className="text-muted-foreground text-sm">Messages Sent</p>
            </div>
            <div className="space-y-1 text-center">
              {isLoadingUsage ? (
                <Skeleton className="mx-auto h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {usageData?.chatsCreated ?? 0}
                </p>
              )}
              <p className="text-muted-foreground text-sm">Chats Created</p>
            </div>
            <div className="space-y-1 text-center">
              {isLoadingUsage ? (
                <Skeleton className="mx-auto h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatNumber(usageData?.promptTokens ?? 0)}
                </p>
              )}
              <p className="text-muted-foreground text-sm">Tokens In</p>
            </div>
            <div className="space-y-1 text-center">
              {isLoadingUsage ? (
                <Skeleton className="mx-auto h-8 w-16" />
              ) : (
                <p className="text-2xl font-bold">
                  {formatNumber(usageData?.completionTokens ?? 0)}
                </p>
              )}
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
            variant="destructive"
            className="flex items-center space-x-2"
          >
            <Trash2 className="size-4" />
            <span>Delete Account</span>
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
