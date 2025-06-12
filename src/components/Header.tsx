import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Share, Ghost, Key } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { Link, useLocation } from "@tanstack/react-router";

export function Header() {
  const location = useLocation();
  const isChatPage = location.pathname.includes("/chat");

  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
      <SidebarTrigger />
      <div className="flex items-center gap-1">
        {isChatPage && (
          <Button variant="outline">
            <Share className="size-4" />
            <span className="hidden text-sm md:block">Share</span>
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild variant="ghost" size="icon">
              <Link to="/settings/keys">
                <Key className="size-5" />
                <span className="sr-only">API Keys</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Set API Keys</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon">
              <Ghost className="size-5" />
              <span className="sr-only">Start Temporary Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start temporary chat</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
