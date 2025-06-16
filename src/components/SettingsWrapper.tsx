"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface SettingsWrapperProps {
  children: ReactNode;
}

export function SettingsWrapper({ children }: SettingsWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();

  const getActiveTab = () => {
    if (pathname === "/settings/keys") return "keys";
    if (pathname === "/settings/customization") return "customization";
    return "general";
  };

  return (
    <>
      <div className="relative">
        <div className="absolute top-8 left-4 z-10 md:left-8">
          <Button variant="ghost" onClick={() => router.push("/")}>
            <ArrowLeft className="!h-5 !w-5" />
            Back to chat
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl space-y-8 px-6 py-24">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <Tabs value={getActiveTab()} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger
              value="general"
              onClick={() => router.push("/settings")}
            >
              General
            </TabsTrigger>
            <TabsTrigger
              value="keys"
              onClick={() => router.push("/settings/keys")}
            >
              API Keys
            </TabsTrigger>
            <TabsTrigger
              value="customization"
              onClick={() => router.push("/settings/customization")}
            >
              Customization
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">{children}</div>
        </Tabs>
      </div>
    </>
  );
}
