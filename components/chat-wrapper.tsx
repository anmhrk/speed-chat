'use client';

import type { User } from 'better-auth';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useMemo, useState } from 'react';
import ApiKeysDialog from '@/components/api-keys-dialog';
import { useChatConfig } from '@/components/providers/chat-config-provider';
import { ChatInput } from './chat-input';
import { Button } from './ui/button';
import { SidebarTrigger } from './ui/sidebar';

export function ChatWrapper({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const { apiKeys, isLoading } = useChatConfig();
  const [open, setOpen] = useState(true);
  const { theme, setTheme } = useTheme();

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
    <main className="flex h-full flex-col">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between px-2">
        <SidebarTrigger />
        <Button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          size="icon"
          variant="ghost"
        >
          <Sun className="absolute size-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <Moon className="dark:-rotate-90 size-5 rotate-0 scale-100 transition-all dark:scale-0" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </header>

      <div className="flex-1 overflow-y-auto">{children}</div>
      <div className="px-2 pb-2">
        <ChatInput />
      </div>
    </main>
  );
}
