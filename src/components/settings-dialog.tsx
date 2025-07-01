"use client";

import {
  Key,
  Palette,
  Settings,
  Brain,
  Eye,
  EyeOff,
  Trash,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "./ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "./ui/sidebar";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useState, useEffect } from "react";
import { ScrollArea } from "./ui/scroll-area";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { ProviderConfig, Providers } from "@/lib/types";
import { Separator } from "./ui/separator";
import { useSettingsContext } from "@/contexts/settings-context";
import { deleteAllChats, deleteUser } from "@/lib/db/actions";
import { useQueryClient } from "@tanstack/react-query";
import { signOut } from "@/lib/auth/auth-client";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chatsCount: number;
  dialogActiveItem: string;
  setDialogActiveItem: (item: string) => void;
}

const sidebarItems = [
  {
    label: "General",
    icon: Settings,
  },
  {
    label: "API Keys",
    icon: Key,
  },
  {
    label: "Custom Prompt",
    icon: Palette,
  },
  {
    label: "Memory",
    icon: Brain,
  },
];

export function SettingsDialog({
  open,
  onOpenChange,
  chatsCount,
  dialogActiveItem,
  setDialogActiveItem,
}: SettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 h-full w-full max-h-[90vh] md:max-h-[600px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>

        <SidebarProvider className="md:items-start flex flex-col md:flex-row">
          <Sidebar
            collapsible="none"
            className="w-full md:w-1/4 shrink-0 h-auto md:h-full"
          >
            <SidebarContent className="md:border-r border-b md:border-b-0">
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu className="grid grid-cols-2 md:grid-cols-1 gap-2 md:gap-0 p-4 md:p-0">
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={item.label === dialogActiveItem}
                          onClick={() => setDialogActiveItem(item.label)}
                          className="justify-start"
                        >
                          <item.icon />
                          <span>{item.label}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>

          <ScrollArea className="flex flex-col w-full max-h-[90vh] md:max-h-[600px]">
            {dialogActiveItem === "General" && (
              <General onOpenChange={onOpenChange} chatsCount={chatsCount} />
            )}
            {dialogActiveItem === "API Keys" && <ApiKeys />}
            {dialogActiveItem === "Custom Prompt" && <CustomPrompt />}
            {dialogActiveItem === "Memory" && <Memory />}
          </ScrollArea>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

function General({
  onOpenChange,
  chatsCount,
}: {
  onOpenChange: (open: boolean) => void;
  chatsCount: number;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deletingAllChats, setDeletingAllChats] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleDeleteAllChats = async () => {
    if (
      confirm(
        `Are you sure you want to delete all ${chatsCount} chats? This action cannot be undone.`
      )
    ) {
      try {
        setDeletingAllChats(true);
        await deleteAllChats();
        queryClient.invalidateQueries({ queryKey: ["chats"] });
        router.push("/");
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
        "Are you sure you want to delete your account? This action cannot be undone."
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
        onOpenChange(false);
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
    <div className="p-6 space-y-6">
      <h3 className="text-lg font-medium mb-4">General Settings</h3>
      <div className="space-y-4">
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
            disabled={chatsCount === 0 || deletingAllChats}
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
    </div>
  );
}

const providers: ProviderConfig[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    placeholder: "sk-or-...",
    url: "https://openrouter.ai/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-...",
    url: "https://console.anthropic.com/settings/keys",
  },
];

function ApiKeys() {
  const { apiKeys, setApiKeys } = useSettingsContext();
  const [localApiKeys, setLocalApiKeys] = useState<Record<Providers, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
  });
  const [showKeys, setShowKeys] = useState<Record<Providers, boolean>>({
    openrouter: false,
    openai: false,
    anthropic: false,
  });

  const hasChanges = JSON.stringify(localApiKeys) !== JSON.stringify(apiKeys);

  const handleSave = async () => {
    try {
      setApiKeys(localApiKeys);
      toast.success("API keys saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save API keys. Please try again.");
    }
  };

  useEffect(() => {
    setLocalApiKeys(apiKeys);
  }, [apiKeys]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">API Keys</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Configure your API keys for different AI providers. These keys are
          stored locally in your browser.
        </p>
      </div>

      <div className="space-y-6">
        {providers.map((provider) => (
          <div key={provider.id} className="space-y-2">
            <Label htmlFor={`${provider.id}-key`}>
              {provider.name} API Key
            </Label>
            <div className="relative">
              <Input
                id={`${provider.id}-key`}
                type={showKeys[provider.id] ? "text" : "password"}
                placeholder={provider.placeholder}
                value={localApiKeys[provider.id] || ""}
                onChange={(e) =>
                  setLocalApiKeys((prev) => ({
                    ...prev,
                    [provider.id]: e.target.value,
                  }))
                }
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() =>
                  setShowKeys((prev) => ({
                    ...prev,
                    [provider.id]: !prev[provider.id],
                  }))
                }
              >
                {showKeys[provider.id] ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
            <p className="text-muted-foreground text-sm">
              Get your {provider.name} API key from{" "}
              <a
                href={provider.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {provider.url.replace("https://", "")}
              </a>
              .
            </p>
          </div>
        ))}

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Keys
          </Button>
        </div>
      </div>
    </div>
  );
}

function CustomPrompt() {
  const { customPrompt, setCustomPrompt } = useSettingsContext();
  const [localPrompt, setLocalPrompt] = useState<string>("");

  const hasChanges = localPrompt !== customPrompt;

  const handleSave = async () => {
    try {
      setCustomPrompt(localPrompt);
      toast.success("Custom prompt saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save custom prompt. Please try again.");
    }
  };

  useEffect(() => {
    setLocalPrompt(customPrompt);
  }, [customPrompt]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Custom Prompt</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize how SpeedChat responds to you
        </p>
      </div>

      <div className="space-y-6">
        <Textarea
          id="custom-prompt"
          value={localPrompt}
          onChange={(e) => setLocalPrompt(e.target.value)}
          className="max-h-[400px] min-h-[400px] focus-visible:ring-0"
          placeholder="Extend the system prompt here..."
        />

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Custom Prompt
          </Button>
        </div>
      </div>
    </div>
  );
}

function Memory() {
  // TODO: Implement real data fetching later
  const [memories] = useState([
    {
      id: 1,
      content: "User prefers concise explanations with code examples",
      createdAt: "2024-01-15",
    },
    {
      id: 2,
      content: "Working on a React project with TypeScript",
      createdAt: "2024-01-14",
    },
    {
      id: 3,
      content: "Interested in learning about machine learning",
      createdAt: "2024-01-13",
    },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-2">Memory</h3>
        <p className="text-sm text-muted-foreground mb-6">
          View and manage your saved memories that help personalize responses
        </p>
      </div>

      {memories.length === 0 ? (
        <div className="text-center py-8">
          <Brain className="mx-auto size-12 text-muted-foreground mb-4" />
          <h4 className="text-lg font-medium mb-2">No memories saved</h4>
          <p className="text-sm text-muted-foreground">
            Start chatting to build up your personalized memory
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {memories.map((memory) => (
            <div
              key={memory.id}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="flex-1">
                <p className="text-sm">{memory.content}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  Saved on {memory.createdAt}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                // onClick={() => await deleteMemory(memory.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
