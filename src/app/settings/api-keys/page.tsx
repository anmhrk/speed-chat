"use client";

import { useSettingsContext } from "@/components/settings-provider";
import type { APIKeys, ProviderConfig, Providers } from "@/lib/types";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Edit } from "lucide-react";

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
    id: "falai",
    name: "FalAI",
    placeholder: "sk-...",
    url: "https://fal.ai/dashboard/keys",
  },
];

export default function ApiKeysPage() {
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const { apiKeys, setApiKeys } = useSettingsContext();
  const [localApiKeys, setLocalApiKeys] = useState<APIKeys>({
    openrouter: "",
    openai: "",
    falai: "",
    vertex: {
      clientEmail: "",
      privateKey: "",
    },
  });
  const [editingKeys, setEditingKeys] = useState<
    Record<Exclude<Providers, "vertex">, boolean> & {
      vertex: {
        clientEmail: boolean;
        privateKey: boolean;
      };
    }
  >({
    openrouter: true,
    openai: true,
    falai: true,
    vertex: {
      clientEmail: true,
      privateKey: true,
    },
  });

  const hasChanges = JSON.stringify(localApiKeys) !== JSON.stringify(apiKeys);

  const handleSave = async () => {
    try {
      if (localApiKeys.vertex.clientEmail || localApiKeys.vertex.privateKey) {
        if (
          !localApiKeys.vertex.clientEmail ||
          !localApiKeys.vertex.privateKey
        ) {
          toast.error(
            "Please fill in both client email and private key for Vertex"
          );
          return;
        }
      }

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

  const handleVertexEditClick = (field: "clientEmail" | "privateKey") => {
    setEditingKeys((prev) => ({
      ...prev,
      vertex: { ...prev.vertex, [field]: true },
    }));
    setTimeout(() => {
      inputRefs.current[`vertex-${field}`]?.focus();
    }, 50);
  };

  useEffect(() => {
    setLocalApiKeys(apiKeys);
    setEditingKeys({
      openrouter: !apiKeys.openrouter,
      openai: !apiKeys.openai,
      falai: !apiKeys.falai,
      vertex: {
        clientEmail: !apiKeys.vertex.clientEmail,
        privateKey: !apiKeys.vertex.privateKey,
      },
    });
  }, [apiKeys]);

  return (
    <div className="space-y-8">
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

      <div className="space-y-2">
        <div className="space-y-8">
          <div className="space-y-1">
            <Label htmlFor="vertex-client-email" className="text-sm">
              Vertex Client Email
            </Label>
            {!editingKeys.vertex.clientEmail &&
            localApiKeys.vertex.clientEmail ? (
              <ApiKeySet
                onClick={() => handleVertexEditClick("clientEmail")}
                message="Client email is set"
              />
            ) : (
              <Input
                ref={(el) => {
                  inputRefs.current["vertex-clientEmail"] = el;
                }}
                id="vertex-client-email"
                type="email"
                placeholder="service-account@project.iam.gserviceaccount.com"
                value={localApiKeys.vertex.clientEmail}
                onChange={(e) =>
                  setLocalApiKeys((prev) => ({
                    ...prev,
                    vertex: {
                      ...prev.vertex,
                      clientEmail: e.target.value,
                    },
                  }))
                }
                onBlur={() => {
                  if (apiKeys.vertex.clientEmail) {
                    setEditingKeys((prev) => ({
                      ...prev,
                      vertex: { ...prev.vertex, clientEmail: false },
                    }));
                  }
                }}
              />
            )}
          </div>
          <div className="space-y-1">
            <Label htmlFor="vertex-private-key" className="text-sm">
              Vertex Private Key
            </Label>
            {!editingKeys.vertex.privateKey &&
            localApiKeys.vertex.privateKey ? (
              <ApiKeySet
                onClick={() => handleVertexEditClick("privateKey")}
                message="Private key is set"
              />
            ) : (
              <Input
                ref={(el) => {
                  inputRefs.current["vertex-privateKey"] = el;
                }}
                id="vertex-private-key"
                type="password"
                placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
                value={localApiKeys.vertex.privateKey}
                onChange={(e) =>
                  setLocalApiKeys((prev) => ({
                    ...prev,
                    vertex: {
                      ...prev.vertex,
                      privateKey: e.target.value,
                    },
                  }))
                }
                onBlur={() => {
                  if (apiKeys.vertex.privateKey) {
                    setEditingKeys((prev) => ({
                      ...prev,
                      vertex: { ...prev.vertex, privateKey: false },
                    }));
                  }
                }}
              />
            )}
          </div>
        </div>
        {!apiKeys.vertex.clientEmail && !apiKeys.vertex.privateKey && (
          <p className="text-muted-foreground text-sm">
            Get your Vertex service account credentials from{" "}
            <a
              href="https://console.cloud.google.com/apis/credentials"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              console.cloud.google.com/apis/credentials
            </a>
            .
          </p>
        )}
      </div>

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
