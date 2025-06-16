import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Share, Ghost, Key } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "next/navigation";

export function Header() {
  const pathname = usePathname();
  const isChatPage = pathname.includes("/chat");
  const router = useRouter();

  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
      <SidebarTrigger variant="outline" />
      <div className="flex items-center gap-1">
        {isChatPage && (
          <Button
            variant="outline"
            className="bg-transparent/60 backdrop-blur-md"
          >
            <Share className="size-4" />
            <span className="text-sm">Share</span>
          </Button>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent/60 backdrop-blur-md"
              onClick={() => router.push("/settings/keys")}
            >
              <Key className="size-5" />
              <span className="sr-only">API Keys</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Set API Keys</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-transparent/60 backdrop-blur-md"
            >
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
