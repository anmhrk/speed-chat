"use client";

import { useSettingsContext } from "@/components/settings-provider";
import type { APIKeys, ProviderConfig, Providers } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Edit, Key } from "lucide-react";

const providers: ProviderConfig[] = [
  {
    id: "openrouter",
    name: "OpenRouter",
    placeholder: "OPENROUTER_API_KEY",
    url: "https://openrouter.ai/settings/keys",
  },
  {
    id: "openai",
    name: "OpenAI",
    placeholder: "OPENAI_API_KEY",
    url: "https://platform.openai.com/api-keys",
  },
  {
    id: "falai",
    name: "FalAI",
    placeholder: "FALAI_API_KEY",
    url: "https://fal.ai/dashboard/keys",
  },
  {
    id: "exa",
    name: "Exa",
    placeholder: "EXA_API_KEY",
    url: "https://dashboard.exa.ai/api-keys",
  },
];

export default function ApiKeysPage() {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { apiKeys, setApiKeys } = useSettingsContext();
  const [localApiKeys, setLocalApiKeys] = useState<APIKeys>({
    openrouter: "",
    openai: "",
    falai: "",
    exa: "",
  });
  const [editingKeys, setEditingKeys] = useState<
    Record<Providers | "exa", boolean>
  >({
    openrouter: true,
    openai: true,
    falai: true,
    exa: true,
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

  const handleEditClick = (inputKey: string) => {
    setEditingKeys((prev) => ({ ...prev, [inputKey]: true }));
    setTimeout(() => {
      inputRefs.current[inputKey]?.focus();
    }, 50);
  };

  useEffect(() => {
    setLocalApiKeys(apiKeys);
    setEditingKeys({
      openrouter: !apiKeys.openrouter,
      openai: !apiKeys.openai,
      falai: !apiKeys.falai,
      exa: !apiKeys.exa,
    });
  }, [apiKeys]);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Key className="size-5" />
          <h2 className="text-lg font-semibold">Configure API Keys</h2>
        </div>
      </div>
      {providers.map((provider) => (
        <div key={provider.id} className="space-y-2">
          <Label htmlFor={`${provider.id}-key`}>{provider.name} API Key</Label>
          {!editingKeys[provider.id as keyof typeof editingKeys] &&
          localApiKeys[provider.id as keyof typeof localApiKeys] ? (
            <ApiKeySet
              onClick={() => handleEditClick(provider.id)}
              message={`${provider.name} API key is set`}
            />
          ) : (
            <Input
              ref={(el) => {
                inputRefs.current[provider.id] = el;
              }}
              id={`${provider.id}-key`}
              type="password"
              placeholder={provider.placeholder}
              value={
                (localApiKeys[
                  provider.id as keyof typeof localApiKeys
                ] as string) || ""
              }
              onChange={(e) =>
                setLocalApiKeys((prev) => ({
                  ...prev,
                  [provider.id]: e.target.value,
                }))
              }
              onBlur={() => {
                if (apiKeys[provider.id as keyof typeof apiKeys]) {
                  setEditingKeys((prev) => ({ ...prev, [provider.id]: false }));
                }
              }}
            />
          )}
          {!apiKeys[provider.id as keyof typeof apiKeys] && (
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
          )}
        </div>
      ))}

      <div className="flex justify-end gap-2">
        <Button onClick={handleSave} disabled={!hasChanges}>
          Save Keys
        </Button>
      </div>
    </div>
  );
}

function ApiKeySet({
  onClick,
  message,
}: {
  onClick: () => void;
  message: string;
}) {
  return (
    <div className="flex items-center gap-2 p-1">
      <Check className="size-4 text-green-500" />
      <span className="text-sm text-muted-foreground">{message}</span>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClick}
        className="ml-auto"
      >
        <Edit className="size-4" />
      </Button>
    </div>
  );
}
