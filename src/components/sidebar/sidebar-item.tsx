import { Chat } from "@/lib/db/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { useMobile } from "@/components/providers/mobile-provider";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from "@/components/ui/sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { getMessages } from "@/lib/db/actions";
import { renameChatTitle } from "@/lib/db/actions";
import { pinChat } from "@/lib/db/actions";
import { deleteChat } from "@/lib/db/actions";
import {
  GitBranch,
  Loader2,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Share,
  Trash2,
} from "lucide-react";

export function SidebarItem({
  chat,
  chatIdParams,
  isMessageStreaming,
  onShareChat,
}: {
  chat: Chat;
  chatIdParams: string;
  isMessageStreaming: boolean;
  onShareChat: (chatId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { isMobile } = useMobile();
  const router = useRouter();
  const [isRenamingChat, setIsRenamingChat] = useState(false);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const clearInput = () => {
    setIsRenamingChat(false);
    setRenamingChatId(null);
    setNewChatTitle("");
  };

  return (
    <SidebarMenuItem
      key={chat.id}
      onMouseEnter={() => {
        if (chat.id === chatIdParams) return;
        queryClient.prefetchQuery({
          queryKey: ["messages", chat.id],
          queryFn: async () => await getMessages(chat.id, false),
        });
      }}
    >
      <SidebarMenuButton
        asChild={!(isRenamingChat && chat.id === renamingChatId)}
        isActive={chat.id === chatIdParams}
      >
        {isRenamingChat && chat.id === renamingChatId ? (
          <Input
            ref={renameInputRef}
            value={newChatTitle}
            onChange={(e) => setNewChatTitle(e.target.value)}
            onBlur={clearInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
                  if (!oldData) return oldData;
                  return oldData.map((chatItem) =>
                    chatItem.id === chat.id
                      ? { ...chatItem, title: newChatTitle }
                      : chatItem
                  );
                });
                try {
                  renameChatTitle(chat.id, newChatTitle);
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to rename chat");
                }
                clearInput();
              } else if (e.key === "Escape") {
                clearInput();
              }
            }}
            className="border-none focus-visible:ring-0 !bg-transparent w-full px-0"
          />
        ) : (
          <Link
            href={`/chat/${chat.id}`}
            className="flex items-center gap-2 w-full"
          >
            {chat.isBranched && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <GitBranch className="size-4" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {/* Show parent chat title instead of parent chat id? */}
                  Branched from {chat.parentChatId}
                </TooltipContent>
              </Tooltip>
            )}
            <span className="truncate">{chat.title}</span>
          </Link>
        )}
      </SidebarMenuButton>
      {chat.id === chatIdParams && isMessageStreaming ? (
        <SidebarMenuAction className="!top-2">
          <Loader2 className="size-4 animate-spin" />
          <span className="sr-only">Loading</span>
        </SidebarMenuAction>
      ) : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuAction showOnHover className="!top-2 cursor-pointer">
              <MoreHorizontal />
              <span className="sr-only">Chat Actions</span>
            </SidebarMenuAction>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align={isMobile ? "end" : "start"}
            onCloseAutoFocus={(e) => {
              if (isRenamingChat) {
                e.preventDefault();
              }
            }}
          >
            <DropdownMenuItem
              onClick={async () => {
                queryClient.setQueryData(["chats"], (oldData: Chat[]) => {
                  if (!oldData) return oldData;
                  return oldData.map((chatItem) =>
                    chatItem.id === chat.id
                      ? {
                          ...chatItem,
                          isPinned: !chatItem.isPinned,
                        }
                      : chatItem
                  );
                });

                // Update db in background but show optimistic update immediately
                try {
                  pinChat(chat.id);
                } catch (error) {
                  console.error(error);
                  toast.error("Failed to pin chat");
                }
              }}
            >
              {chat.isPinned ? <PinOff /> : <Pin />}
              <span>{chat.isPinned ? "Unpin" : "Pin"}</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                setIsRenamingChat(true);
                setRenamingChatId(chat.id);
                setNewChatTitle(chat.title);
                setTimeout(() => {
                  renameInputRef.current?.focus();
                  renameInputRef.current?.select();
                }, 100);
              }}
            >
              <Pencil />
              <span>Rename</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                onShareChat(chat.id);
              }}
            >
              <Share />
              <span>{chat.isShared ? "Unshare" : "Share"}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={() => {
                toast.promise(
                  deleteChat(chat.id).finally(() => {
                    queryClient.invalidateQueries({
                      queryKey: ["chats"],
                    });
                    if (chat.id === chatIdParams) {
                      router.push("/");
                    }
                  }),
                  {
                    loading: "Deleting chat...",
                    success: "Chat deleted",
                    error: "Failed to delete chat",
                  }
                );
              }}
            >
              <Trash2 />
              <span>Delete</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </SidebarMenuItem>
  );
}
