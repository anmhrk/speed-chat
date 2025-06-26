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

export function Header({
  temporaryChat,
  isScrolled,
}: {
  temporaryChat: boolean;
  isScrolled: boolean;
}) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  return (
    <div
      className={`sticky top-0 z-10 flex items-center justify-between h-12 p-3 ${isScrolled && "border-b border-border"}`}
      // className="sticky top-0 z-10 flex items-center justify-between h-12 p-3 border-b border-border"
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="size-6" />
        </TooltipTrigger>
        <TooltipContent side="right">Toggle Sidebar</TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Moon className="size-6 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Sun className="absolute size-6 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
              <span className="sr-only">Toggle Theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </TooltipContent>
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
              >
                <Ghost className="size-6" />
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
