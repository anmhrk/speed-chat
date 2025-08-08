'use client';

import type { User } from 'better-auth';
import { useMemo, useState } from 'react';
import ApiKeysDialog from '@/components/api-keys-dialog';
import { useChatConfig } from '@/components/providers/chat-config-provider';
import { ChatInput } from './chat-input';

export function ChatWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const { apiKeys, isLoading } = useChatConfig();
  const [open, setOpen] = useState(true);

  const shouldBlock = useMemo(() => {
    if (isLoading || !user) {
      return false;
    }

    // AI Gateway key must exist. OpenAI may exist or be empty, but AI Gateway missing is not OK.
    return !apiKeys.aiGateway || apiKeys.aiGateway.trim().length === 0;
  }, [apiKeys.aiGateway, isLoading, user]);

  if (shouldBlock) {
    return <ApiKeysDialog isBlocking onOpenChange={setOpen} open={open} />;
  }

  return (
    <main className="flex h-full flex-col px-2">
      <div className="flex-1">{children}</div>
      <div className="pb-2">
        <ChatInput />
      </div>
    </main>
  );
}
