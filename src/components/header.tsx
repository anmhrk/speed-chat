"use client";

import { Button } from "@/components/ui/button";
import { Ghost, Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";
import { useRouter } from "next/navigation";
import { Toggle } from "./ui/toggle";

export function Header({ temporaryChat }: { temporaryChat: boolean }) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between h-12 p-3">
      <SidebarTrigger />
      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Moon className="size-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Sun className="absolute size-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle Theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Toggle Theme</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Toggle
                size="icon"
                pressed={temporaryChat}
                onPressedChange={() => {
                  if (temporaryChat) {
                    router.push("/");
                  } else {
                    router.push("/?temporary=true");
                  }
                }}
                className="rounded-full"
              >
                <Ghost className="size-5" />
                <span className="sr-only">Temporary Chat</span>
              </Toggle>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {temporaryChat ? "Disable Temporary Chat" : "Enable Temporary Chat"}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
