import { ChatInput } from './chat-input';

export function ChatWrapper({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex h-full flex-col px-2">
      <div className="flex-1">{children}</div>
      <div className="pb-2">
        <ChatInput />
      </div>
    </main>
  );
}
