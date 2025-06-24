"use client";

import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between h-10">
      <Tooltip>
        <TooltipTrigger asChild>
          <SidebarTrigger className="size-6" />
        </TooltipTrigger>
        <TooltipContent side="right">Toggle Sidebar</TooltipContent>
      </Tooltip>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
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
        </div>
      </div>
    </div>
  );
}
