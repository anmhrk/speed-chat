import { shareChat } from "@/lib/actions";
import { toast } from "sonner";
import { Chat } from "@/lib/db/schema";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, Copy, Loader2 } from "lucide-react";
import { useCopyClipboard } from "@/hooks/use-copy-clipboard";

export function ShareChatDialog({
  chatId,
  isOpen,
  onOpenChange,
  chat,
}: {
  chatId: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  chat?: Chat;
}) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const { isCopied, copyToClipboard } = useCopyClipboard();

  if (!chatId || !chat) {
    return null;
  }

  const shareUrl = `${window.location.origin}/share/${chatId}`;

  const handleShareChat = async (isShared: boolean) => {
    const action = isShared ? "unshared" : "shared";
    setIsLoading(true);
    try {
      await shareChat(chatId);
      queryClient.invalidateQueries({
        queryKey: ["chats"],
      });
      toast.success(`Chat ${action} successfully!`);
    } catch (error) {
      console.error(error);
      toast.error(`Failed to ${action} chat`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {chat.isShared ? "Unshare Chat" : "Share Chat"}
          </DialogTitle>
          <DialogDescription>
            {chat.isShared
              ? "Your chat is shared. Anyone with the link below can view it."
              : "Are you sure you want to share this chat? Anyone with the link will be able to view it."}
          </DialogDescription>
        </DialogHeader>

        {chat.isShared ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input value={shareUrl} readOnly className="flex-1" />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(shareUrl)}
                className="shrink-0"
              >
                {isCopied ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        ) : null}

        <DialogFooter className="flex-col space-y-2 sm:flex-col sm:space-x-0">
          {chat.isShared ? (
            <Button
              variant="destructive"
              onClick={() => handleShareChat(true)}
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Unsharing...
                </>
              ) : (
                "Unshare Chat"
              )}
            </Button>
          ) : (
            <div className="flex space-x-2 w-full">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Go Back
              </Button>
              <Button
                onClick={() => handleShareChat(false)}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sharing...
                  </>
                ) : (
                  "Share Chat"
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
