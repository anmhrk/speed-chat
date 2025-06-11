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
import { SettingsWrapper } from "@/components/SettingsWrapper";
import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Key, Save } from "lucide-react";
import { toast } from "sonner";
import { getLocalStorage, setLocalStorage } from "@/lib/utils";

export const Route = createFileRoute("/settings/keys")({
  component: RouteComponent,
});

const LOCAL_STORAGE_KEY = "api_keys";

type Provider = {
  key: string;
  name: string;
  placeholder: string;
  url: string;
};

const providers: Provider[] = [
  {
    key: "openrouter",
    name: "OpenRouter",
    placeholder: "sk-or-...",
    url: "https://openrouter.ai/settings/keys",
  },
  {
    key: "openai",
    name: "OpenAI",
    placeholder: "sk-...",
    url: "https://platform.openai.com/api-keys",
  },
  {
    key: "anthropic",
    name: "Anthropic",
    placeholder: "sk-ant-...",
    url: "https://console.anthropic.com/settings/keys",
  },
];

function RouteComponent() {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [originalKeys, setOriginalKeys] = useState<Record<string, string>>({});
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = JSON.stringify(apiKeys) !== JSON.stringify(originalKeys);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setLocalStorage(LOCAL_STORAGE_KEY, JSON.stringify(apiKeys));
      setOriginalKeys({ ...apiKeys });
      toast.success("API keys saved successfully!");
    } catch {
      toast.error("Failed to save API keys. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    try {
      const saved = getLocalStorage(LOCAL_STORAGE_KEY);
      const keys = saved ? JSON.parse(saved) : {};
      setApiKeys(keys);
      setOriginalKeys(keys);
    } catch {
      console.error("Failed to load saved API keys.");
    }
  }, []);

  return (
    <SettingsWrapper>
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
            <div key={provider.key} className="space-y-2">
              <Label htmlFor={`${provider.key}-key`}>
                {provider.name} API Key
              </Label>
              <div className="relative">
                <Input
                  id={`${provider.key}-key`}
                  type={showKeys[provider.key] ? "text" : "password"}
                  placeholder={provider.placeholder}
                  value={apiKeys[provider.key] || ""}
                  onChange={(e) =>
                    setApiKeys((prev) => ({
                      ...prev,
                      [provider.key]: e.target.value,
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
                      [provider.key]: !prev[provider.key],
                    }))
                  }
                >
                  {showKeys[provider.key] ? (
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
              </p>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-muted-foreground text-sm">
              API keys are stored locally and never sent to our servers
            </p>
            <Button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className="flex items-center space-x-2"
            >
              <Save className="size-4" />
              <span>{isSaving ? "Saving..." : "Save Keys"}</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </SettingsWrapper>
  );
}
