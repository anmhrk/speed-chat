import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Ghost, Settings, Key, Palette, Moon, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toggle } from "@/components/ui/toggle";
import Link from "next/link";

export function Header({
  temporaryChat,
  setTemporaryChat,
  setChatId,
}: {
  temporaryChat: boolean;
  setTemporaryChat: (temporaryChat: boolean) => void;
  setChatId: (chatId: string | null) => void;
}) {
  const pathname = usePathname();
  const isChatPage = pathname.includes("/chat");
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger variant="outline" />
        {(isChatPage || temporaryChat) && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="backdrop-blur-md"
                onClick={() => setChatId(null)}
                asChild
              >
                <Link href="/" className="flex items-center gap-2">
                  <Plus className="size-5" />
                  <span className="sr-only">New Chat</span>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>New Chat</TooltipContent>
          </Tooltip>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* {isChatPage && (
          <Button variant="outline" className="backdrop-blur-md">
            <Share className="size-5" />
            <span className="text-sm">Share</span>
          </Button>
        )} */}

        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="backdrop-blur-md"
                >
                  <Settings className="size-5" />
                  <span className="sr-only">Settings</span>
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent>Settings</TooltipContent>
          </Tooltip>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings/keys" className="flex items-center gap-2">
                <Key className="mr-2 size-4" />
                Set API Keys
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link
                href="/settings/customization"
                className="flex items-center gap-2"
              >
                <Palette className="mr-2 size-4" />
                Set Custom Instructions
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                setTheme(theme === "dark" ? "light" : "dark");
              }}
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <Moon className="size-4" />
                <span>Dark mode</span>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) =>
                  setTheme(checked ? "dark" : "light")
                }
              />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {!isChatPage && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <Toggle
                  variant="outline"
                  size="icon"
                  className="backdrop-blur-md"
                  onClick={() => {
                    setTemporaryChat(!temporaryChat);
                    setChatId(null);
                  }}
                >
                  <Ghost className="size-5" />
                  <span className="sr-only">Toggle Temporary Chat</span>
                </Toggle>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              {temporaryChat
                ? "Disable temporary chat"
                : "Enable temporary chat"}
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
