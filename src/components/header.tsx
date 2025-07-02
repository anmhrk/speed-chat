"use client";

import { Ghost, Github } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { SidebarTrigger } from "./ui/sidebar";
import { useRouter } from "next/navigation";
import { Toggle } from "./ui/toggle";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import Link from "next/link";

export function Header({ temporaryChat }: { temporaryChat: boolean }) {
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
              asChild
            >
              <Link href="https://github.com/anmhrk/speed-chat" target="_blank">
                <Github className="size-5" />
                <span className="sr-only">GitHub</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>View repo on GitHub</TooltipContent>
        </Tooltip>
        <ThemeToggle />
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
