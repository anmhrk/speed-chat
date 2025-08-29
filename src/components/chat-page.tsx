'use client';

import { useConvexAuth } from 'convex/react';
import { Moon, Sun } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { use, useState } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';
import { ApiKeysDialog } from '@/components/api-keys-dialog';
import { AppSidebar } from '@/components/app-sidebar';
import { ChatInput } from '@/components/chat-input';
import { SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { useCustomChat } from '@/hooks/use-custom-chat';
import type { MyUIMessage } from '@/lib/types';
import { Messages } from './messages';
import { SearchDialog } from './search-dialog';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const PROMPT_SUGGESTIONS = [
  'Explain how AI works in a way a 5 year old can understand',
  'How do I survive a long flight without losing my mind?',
  'What are the best sources of protein?',
  'Help me plan my summer vacation in Europe',
];

export function ChatPage({
  initialMessagesPromise,
}: {
  initialMessagesPromise: Promise<MyUIMessage[]>;
}) {
  const router = useRouter();
  const initialMessages = use(initialMessagesPromise);
  const { isAuthenticated, isLoading } = useConvexAuth();
  const [isApiKeysOpen, setIsApiKeysOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const {
    chatId,
    messages,
    sendMessage,
    setMessages,
    stop,
    regenerate,
    input,
    setInput,
    inputRef,
    handleInputChange,
    isStreaming,
    handleSubmit,
    filesToSend,
    setFilesToSend,
    buildBodyAndHeaders,
    status,
    error,
  } = useCustomChat({
    isAuthenticated,
    setIsApiKeysOpen,
    initialMessages,
  });

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

          <div className="flex min-h-0 flex-1 flex-col">
            {messages.length > 0 ? (
              <Messages
                buildBodyAndHeaders={buildBodyAndHeaders}
                currentChatId={chatId}
                error={error}
                messages={messages}
                regenerate={regenerate}
                sendMessage={sendMessage}
                setMessages={setMessages}
                status={status}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center space-y-10 text-center">
                <h1 className="font-medium text-3xl sm:text-4xl">
                  How can I help you today?
                </h1>
                <div className="w-full max-w-3xl px-2">
                  {PROMPT_SUGGESTIONS.map((suggestion, index) => (
                    <div key={suggestion}>
                      <Button
                        className="h-auto w-full justify-start p-3 font-normal text-muted-foreground text-sm hover:text-foreground"
                        onClick={() => {
                          setInput(suggestion);
                          inputRef.current?.focus();
                        }}
                        variant="ghost"
                      >
                        {suggestion}
                      </Button>
                      {index < PROMPT_SUGGESTIONS.length - 1 && (
                        <div className="px-3">
                          <Separator />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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

      <SearchDialog
        isAuthenticated={isAuthenticated}
        onOpenChange={setIsSearchOpen}
        open={isSearchOpen}
      />
      <ApiKeysDialog onOpenChange={setIsApiKeysOpen} open={isApiKeysOpen} />
    </main>
  );
}
