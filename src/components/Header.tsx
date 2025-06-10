import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Share, Ghost } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

export function Header() {
  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
      <SidebarTrigger />
      <div className="flex gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <Share className="size-5" />
              <span className="sr-only">Share Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Share Chat</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="size-7">
              <Ghost className="size-5" />
              <span className="sr-only">Temporary Chat</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Temporary Chat</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
