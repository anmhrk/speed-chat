"use client";

import { AlertCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useChatConfig } from "@/providers/chat-config-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type ApiKeysDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ApiKeysDialog({ open, onOpenChange }: ApiKeysDialogProps) {
  const { apiKey, setApiKey } = useChatConfig();
  const [localKey, setLocalKey] = useState(apiKey);

  useEffect(() => {
    setLocalKey(apiKey);
  }, [apiKey]);

  const isSaveDisabled = useMemo(
    () => localKey.trim().length === 0 || localKey === apiKey,
    [localKey, apiKey]
  );

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure API Keys</DialogTitle>
          <DialogDescription>Enter your AI Gatwat API key.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm" htmlFor="ai-gateway-key">
              AI Gateway API Key
            </label>
            <Input
              autoComplete="off"
              id="ai-gateway-key"
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="Enter your API key"
              type="password"
              value={localKey}
            />
            <p className="text-muted-foreground text-xs">
              Get your API key from{" "}
              <a
                className="text-blue-500 hover:underline"
                href="https://vercel.com/docs/ai-gateway#create-an-api-key"
                rel="noreferrer"
                target="_blank"
              >
                Vercel AI Gateway
              </a>
            </p>
          </div>
        </div>

        <DialogFooter className="flex w-full items-center">
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <AlertCircle className="size-4" /> This key is stored locally in
            your browser.
          </p>
          <Button
            className="ml-auto"
            disabled={isSaveDisabled}
            onClick={() => setApiKey(localKey)}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeysDialog;
