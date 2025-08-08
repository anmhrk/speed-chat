'use client';

import { AlertCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useChatConfig } from '@/components/providers/chat-config-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

type ApiKeysDialogProps = {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  isBlocking?: boolean;
};

export function ApiKeysDialog({
  open,
  onOpenChange,
  isBlocking = false,
}: ApiKeysDialogProps) {
  const { apiKeys, setApiKeys } = useChatConfig();
  const [localKeys, setLocalKeys] = useState(apiKeys);

  useEffect(() => {
    setLocalKeys(apiKeys);
  }, [apiKeys]);

  const isSaveDisabled = useMemo(
    () => localKeys.aiGateway.trim().length === 0 || localKeys === apiKeys,
    [localKeys, apiKeys]
  );

  const handleSave = () => {
    setApiKeys(localKeys);
    if (!isBlocking) {
      onOpenChange?.(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isBlocking && !nextOpen) {
      return; // prevent closing when blocking
    }
    onOpenChange?.(nextOpen);
  };

  return (
    <Dialog onOpenChange={handleOpenChange} open={open}>
      <DialogContent showCloseButton={!isBlocking}>
        <DialogHeader>
          <DialogTitle>Configure API Keys</DialogTitle>
          <DialogDescription>
            Enter your API keys. AI Gateway API Key is required.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm" htmlFor="ai-gateway-key">
              AI Gateway API Key
            </label>
            <Input
              autoComplete="off"
              id="ai-gateway-key"
              onChange={(e) =>
                setLocalKeys({ ...localKeys, aiGateway: e.target.value })
              }
              placeholder="Enter your API key"
              type="password"
              value={localKeys.aiGateway}
            />
            <p className="text-muted-foreground text-xs">
              Get your API key from{' '}
              <a
                className="text-blue-500"
                href="https://vercel.com/docs/ai-gateway#create-an-api-key"
                rel="noreferrer"
                target="_blank"
              >
                Vercel AI Gateway
              </a>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium text-sm" htmlFor="openai-key">
              OpenAI API Key (optional, used for image generation)
            </label>
            <Input
              autoComplete="off"
              id="openai-key"
              onChange={(e) =>
                setLocalKeys({ ...localKeys, openai: e.target.value })
              }
              placeholder="Enter your API key"
              type="password"
              value={localKeys.openai}
            />
            <p className="text-muted-foreground text-xs">
              Get your API key from{' '}
              <a
                className="text-blue-500"
                href="https://platform.openai.com/settings/organization/api-keys"
                rel="noreferrer"
                target="_blank"
              >
                OpenAI
              </a>
            </p>
          </div>
        </div>

        <DialogFooter className="flex w-full items-center">
          <p className="flex items-center gap-1.5 text-muted-foreground text-xs">
            <AlertCircle className="size-4" /> These keys are stored locally in
            your browser.
          </p>
          <Button
            className="ml-auto"
            disabled={isSaveDisabled}
            onClick={handleSave}
          >
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ApiKeysDialog;
