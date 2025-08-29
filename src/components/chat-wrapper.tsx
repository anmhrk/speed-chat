'use client';

import { useConvexAuth } from 'convex/react';
import { Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useHotkeys } from 'react-hotkeys-hook';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInput } from '@/components/chat-input';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useCustomChat } from '@/providers/chat-provider';
import { useDialogs } from '@/providers/dialogs-provider';
import { Button } from './ui/button';

export function ChatWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { theme, setTheme } = useTheme();
  const { setIsSearchOpen, isApiKeysOpen, setIsApiKeysOpen } = useDialogs();
  const {
    chatId,
    input,
    inputRef,
    handleInputChange,
    handleSubmit,
    filesToSend,
    setFilesToSend,
    isStreaming,
    status,
    stop,
  } = useCustomChat();

  useHotkeys('meta+k, ctrl+k', () => setIsSearchOpen(true), {
    enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
    enableOnContentEditable: true,
  });
  useHotkeys('meta+shift+o, ctrl+shift+o', () => router.push('/'), {
    enableOnFormTags: ['INPUT', 'TEXTAREA', 'SELECT'],
    enableOnContentEditable: true,
  });

  return (
    <main className="flex h-screen w-full">
      <AppSidebar
        authLoading={isLoading}
        currentChatId={chatId}
        isApiKeysOpen={isApiKeysOpen}
        isStreaming={isStreaming}
        setIsApiKeysOpen={setIsApiKeysOpen}
        setIsSearchOpen={setIsSearchOpen}
      />
      <SidebarInset className="flex-1">
        <div className="relative flex h-full flex-col">
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

          {children}

          <div className="flex-shrink-0 px-2 pb-2">
            <ChatInput
              filesToSend={filesToSend}
              handleInputChange={handleInputChange}
              handleSubmit={handleSubmit}
              input={input}
              inputRef={inputRef}
              isAuthenticated={isAuthenticated}
              isStreaming={isStreaming}
              setFilesToSend={setFilesToSend}
              status={status}
              stop={stop}
            />
          </div>
        </div>
      </SidebarInset>
    </main>
  );
}
