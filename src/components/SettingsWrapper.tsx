import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { ArrowLeft } from "lucide-react";

interface SettingsWrapperProps {
  children: ReactNode;
}

export function SettingsWrapper({ children }: SettingsWrapperProps) {
  const location = useLocation();

  const getActiveTab = () => {
    if (location.pathname === "/settings/keys") return "keys";
    if (location.pathname === "/settings/customization") return "customization";
    return "general";
  };

  return (
    <>
      <div className="relative">
        <div className="absolute top-8 left-8 z-10">
          <Button variant="ghost" asChild>
            <Link to="/">
              <ArrowLeft className="!h-5 !w-5" />
              Back to chat
            </Link>
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
            <TabsTrigger value="general" asChild>
              <Link to="/settings">General</Link>
            </TabsTrigger>
            <TabsTrigger value="keys" asChild>
              <Link to="/settings/keys">API Keys</Link>
            </TabsTrigger>
            <TabsTrigger value="customization" asChild>
              <Link to="/settings/customization">Customization</Link>
            </TabsTrigger>
          </TabsList>

          <div className="space-y-6">{children}</div>
        </Tabs>
      </div>
    </>
  );
}
