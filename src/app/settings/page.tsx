"use client";

import { Button } from "@/components/ui/button";
import { deleteAllChats, deleteUser } from "@/lib/db/actions";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { signOut } from "@/lib/auth/auth-client";
import { Separator } from "@/components/ui/separator";
import { Settings, Trash } from "lucide-react";

export default function GeneralPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deletingAllChats, setDeletingAllChats] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAllChats = async () => {
    if (
      confirm(
        `Are you sure you want to delete all your chats? This action cannot be undone.`,
      )
    ) {
      try {
        setDeletingAllChats(true);
        await deleteAllChats();
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        toast.success("All chats deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete chats");
      } finally {
        setDeletingAllChats(false);
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (
      confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      try {
        setDeletingAccount(true);
        await deleteUser();
        await queryClient.invalidateQueries({ queryKey: ["chats"] });
        void signOut({
          fetchOptions: {
            onSuccess: () => {
              router.push("/");
            },
          },
        });
        toast.success("Account deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete account");
      } finally {
        setDeletingAccount(false);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Settings className="size-5" />
          <h2 className="text-lg font-semibold">Settings</h2>
        </div>
      </div>
      <div className="flex items-center justify-between py-2">
        <div>
          <h4 className="font-medium">Delete All Chats</h4>
          <p className="text-sm text-muted-foreground">
            Remove all your chat history permanently
          </p>
        </div>
        <Button
          variant="destructive"
          onClick={handleDeleteAllChats}
          disabled={deletingAllChats}
        >
          <Trash className="mr-2 size-4" />
          {deletingAllChats ? "Deleting..." : "Delete"}
        </Button>
      </div>
      <Separator />
      <div className="flex items-center justify-between py-2">
        <div>
          <h4 className="font-medium text-destructive">Delete Account</h4>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all associated data
          </p>
        </div>
        <Button variant="destructive" onClick={handleDeleteAccount}>
          <Trash className="mr-2 size-4" />
          {deletingAccount ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
