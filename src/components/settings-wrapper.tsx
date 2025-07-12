"use client";

import type { User } from "better-auth";
import { Button } from "./ui/button";
import Link from "next/link";
import { signOut } from "@/lib/auth/auth-client";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, Command } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Image from "next/image";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { cn } from "@/lib/utils";
import { isAppleDevice } from "@/lib/utils";

const tabs = [
  {
    label: "General",
    value: "general",
    href: "/settings",
  },
  {
    label: "API Keys",
    value: "api-keys",
    href: "/settings/api-keys",
  },
  {
    label: "Customization",
    value: "customization",
    href: "/settings/customization",
  },
  {
    label: "Memory",
    value: "memory",
    href: "/settings/memory",
  },
];

export function SettingsWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const showCmdKey = isAppleDevice();

  const getCurrentTab = () => {
    if (pathname === "/settings") return "general";
    const pathSegment = pathname.split("/").pop();
    return pathSegment || "general";
  };
  const currentTab = getCurrentTab();

  return (
    <div className="max-w-6xl h-full w-full mx-auto p-2 mt-2">
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link className="flex items-center gap-2" href="/">
            <ArrowLeft className="size-4" />
            Back to chat
          </Link>
        </Button>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
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
            Sign out
          </Button>
        </div>
      </div>

      <div className="mt-8 flex w-full flex-row gap-14">
        <div className="flex-col gap-2 items-center w-1/4 hidden md:flex">
          <Image
            src={user.image ?? ""}
            alt="User profile picture"
            width={150}
            height={150}
            className="rounded-full object-cover"
          />

          <div className="flex flex-col gap-1 items-center">
            <p className="text-xl font-medium">{user.name}</p>
            <p className="text-md font-medium text-muted-foreground">
              {user.email}
            </p>
          </div>

          <div className="flex flex-col mt-8 bg-accent dark:bg-accent/40 rounded-lg p-4 w-full">
            <p className="text-md font-semibold mb-4">Keyboard Shortcuts</p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Search</span>
                <div className="flex items-center gap-1">
                  {showCmdKey ? (
                    <ShortcutBox>
                      <Command className="size-4" />
                    </ShortcutBox>
                  ) : (
                    <ShortcutBox type="ctrl">Ctrl</ShortcutBox>
                  )}
                  <ShortcutBox>K</ShortcutBox>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">New Chat</span>
                <div className="flex items-center gap-1">
                  {showCmdKey ? (
                    <ShortcutBox>
                      <Command className="size-4" />
                    </ShortcutBox>
                  ) : (
                    <ShortcutBox type="ctrl">Ctrl</ShortcutBox>
                  )}
                  <ShortcutBox type="shift">Shift</ShortcutBox>
                  <ShortcutBox>O</ShortcutBox>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Toggle Sidebar</span>
                <div className="flex items-center gap-1">
                  {showCmdKey ? (
                    <ShortcutBox>
                      <Command className="size-4" />
                    </ShortcutBox>
                  ) : (
                    <ShortcutBox type="ctrl">Ctrl</ShortcutBox>
                  )}
                  <ShortcutBox>B</ShortcutBox>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Show Model Picker</span>
                <div className="flex items-center gap-1">
                  {showCmdKey ? (
                    <ShortcutBox>
                      <Command className="size-4" />
                    </ShortcutBox>
                  ) : (
                    <ShortcutBox type="ctrl">Ctrl</ShortcutBox>
                  )}
                  <ShortcutBox>/</ShortcutBox>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full md:w-3/4 px-4 md:px-0">
          <Tabs value={currentTab}>
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} asChild>
                  <Link href={tab.href}>{tab.label}</Link>
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={currentTab} className="mt-6 pb-8 md:pb-0">
              {children}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ShortcutBox({
  children,
  type,
}: {
  children: React.ReactNode;
  type?: "shift" | "ctrl";
}) {
  return (
    <kbd
      className={cn(
        "flex items-center justify-center h-7 text-md bg-primary/10 dark:bg-muted border border-border rounded-sm",
        type === "shift" || type === "ctrl" ? "w-fit px-2" : "w-7"
      )}
    >
      {children}
    </kbd>
  );
}
