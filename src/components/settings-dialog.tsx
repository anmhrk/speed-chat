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
import { useSettingsContext } from "./settings-provider";
import { deleteUser } from "@/lib/auth/auth-client";
import { useRouter } from "next/navigation";
import type {
  ProviderConfig,
  Providers,
  CustomInstructions,
} from "@/lib/types";
import { Separator } from "./ui/separator";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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
    label: "Custom Instructions",
    icon: Palette,
  },
  {
    label: "Memory",
    icon: Brain,
  },
];

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [activeItem, setActiveItem] = useState(sidebarItems[0].label);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 md:max-h-[500px] md:max-w-[700px] lg:max-w-[800px]">
        <DialogTitle className="sr-only">Settings</DialogTitle>
        <DialogDescription className="sr-only">
          Customize your settings here.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex w-1/4">
            <SidebarContent>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {sidebarItems.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton
                          isActive={item.label === activeItem}
                          onClick={() => setActiveItem(item.label)}
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
          <main className="flex h-[500px] flex-1 flex-col overflow-hidden">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-6">
                {activeItem === "General" && <GeneralSettings />}
                {activeItem === "API Keys" && <ApiKeysSettings />}
                {activeItem === "Custom Instructions" && (
                  <CustomInstructionsSettings />
                )}
                {activeItem === "Memory" && <MemorySettings />}
              </div>
            </ScrollArea>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
}

function GeneralSettings() {
  const router = useRouter();

  const handleDeleteAllChats = async () => {
    if (
      confirm(
        "Are you sure you want to delete all chats? This action cannot be undone."
      )
    ) {
      try {
        // TODO: Implement delete all chats functionality
        toast.success("All chats deleted successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete chats. Please try again.");
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
        await deleteUser();
        // TODO: Delete db stuff for user
        toast.success("Account deleted successfully!");
        router.push("/");
      } catch (error) {
        console.error(error);
        toast.error("Failed to delete account. Please try again.");
      }
    }
  };

  return (
    <>
      <h3 className="text-lg font-medium mb-4">General Settings</h3>
      <div className="space-y-4">
        <div className="flex items-center justify-between py-2">
          <div>
            <h4 className="font-medium">Delete All Chats</h4>
            <p className="text-sm text-muted-foreground">
              Remove all your chat history permanently
            </p>
          </div>
          <Button variant="destructive" onClick={handleDeleteAllChats}>
            <Trash className="mr-2 size-4" />
            Delete
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
            Delete
          </Button>
        </div>
      </div>
    </>
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

function ApiKeysSettings() {
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
    if (apiKeys) {
      setLocalApiKeys(apiKeys);
    }
  }, [apiKeys]);

  return (
    <>
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
    </>
  );
}

function CustomInstructionsSettings() {
  const { customInstructions, setCustomInstructions } = useSettingsContext();
  const [localInstructions, setLocalInstructions] =
    useState<CustomInstructions>({
      name: "",
      whatYouDo: "",
      howToRespond: "",
      additionalInfo: "",
    });

  const hasChanges =
    JSON.stringify(localInstructions) !== JSON.stringify(customInstructions);

  const handleChange = (field: keyof CustomInstructions, value: string) => {
    setLocalInstructions((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    try {
      setCustomInstructions(localInstructions);
      toast.success("Custom instructions saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save custom instructions. Please try again.");
    }
  };

  useEffect(() => {
    if (customInstructions) {
      setLocalInstructions(customInstructions);
    }
  }, [customInstructions]);

  return (
    <>
      <div>
        <h3 className="text-lg font-medium mb-2">Custom Instructions</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Customize how SpeedChat responds to you
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="Enter your name"
            value={localInstructions.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="what-you-do">What do you do?</Label>
          <Input
            id="what-you-do"
            placeholder="Engineer, student, etc."
            value={localInstructions.whatYouDo}
            onChange={(e) => handleChange("whatYouDo", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="how-to-respond">
            How should SpeedChat respond to you?
          </Label>
          <Textarea
            id="how-to-respond"
            placeholder="Explain concepts in an easy manner and use examples"
            value={localInstructions.howToRespond}
            onChange={(e) => handleChange("howToRespond", e.target.value)}
            className="max-h-[150px] min-h-[100px] resize-none"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="additional-info">
            Anything else SpeedChat should know about you?
          </Label>
          <Textarea
            id="additional-info"
            placeholder="Interests, values, or preferences to keep in mind"
            value={localInstructions.additionalInfo}
            onChange={(e) => handleChange("additionalInfo", e.target.value)}
            className="max-h-[150px] min-h-[100px] resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-4">
          <Button onClick={handleSave} disabled={!hasChanges}>
            Save Custom Instructions
          </Button>
        </div>
      </div>
    </>
  );
}

function MemorySettings() {
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
    <>
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
    </>
  );
}
