"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Key } from "lucide-react";
import { toast } from "sonner";
import type { ProviderConfig, Providers } from "@/lib/types";

const LOCAL_STORAGE_KEY = "api_keys";

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

export default function KeysPage() {
  const [apiKeys, setApiKeys] = useState<Record<Providers, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
  });
  const [originalKeys, setOriginalKeys] = useState<Record<Providers, string>>({
    openrouter: "",
    openai: "",
    anthropic: "",
  });
  const [showKeys, setShowKeys] = useState<Record<Providers, boolean>>({
    openrouter: false,
    openai: false,
    anthropic: false,
  });

  const hasChanges = JSON.stringify(apiKeys) !== JSON.stringify(originalKeys);

  const handleSave = async () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(apiKeys));
      setOriginalKeys({ ...apiKeys });
      toast.success("API keys saved successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save API keys. Please try again.");
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      const keys = saved ? JSON.parse(saved) : {};
      setApiKeys(keys);
      setOriginalKeys(keys);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load API keys. Please try again.");
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Key className="h-5 w-5" />
          <span>API Keys</span>
        </CardTitle>
        <CardDescription>
          Configure your API keys for different AI providers. These keys are
          stored locally in your browser.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                value={apiKeys[provider.id] || ""}
                onChange={(e) =>
                  setApiKeys((prev) => ({
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

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex w-full md:w-auto"
          >
            <span>Save Keys</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
