import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Share, Ghost, Settings, Key, Palette, Moon, Plus } from "lucide-react";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { usePathname, useRouter } from "next/navigation";
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

export function Header({
  temporaryChat,
  setTemporaryChat,
}: {
  temporaryChat: boolean;
  setTemporaryChat: (temporaryChat: boolean) => void;
}) {
  const pathname = usePathname();
  const isChatPage = pathname.includes("/chat");
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  return (
    <div className="absolute top-0 right-0 left-0 z-10 flex items-center justify-between p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger variant="outline" />
        {isChatPage && (
          <Button
            variant="outline"
            size="icon"
            className="backdrop-blur-md"
            onClick={() => router.push("/")}
          >
            <Plus className="size-5" />
            <span className="sr-only">New Chat</span>
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {isChatPage && (
          <Button variant="outline" className="backdrop-blur-md">
            <Share className="size-5" />
            <span className="text-sm">Share</span>
          </Button>
        )}

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
            <DropdownMenuItem onClick={() => router.push("/settings/keys")}>
              <Key className="mr-2 size-4" />
              Set API Keys
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings/customization")}
            >
              <Palette className="mr-2 size-4" />
              Set Custom Instructions
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
                  onClick={() => setTemporaryChat(!temporaryChat)}
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
