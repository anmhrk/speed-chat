import { AppSidebar } from "./AppSidebar";
import { ChatArea } from "./ChatArea";
import { Header } from "./Header";
import { SidebarProvider } from "./ui/sidebar";
import type { User } from "better-auth";

interface ChatPageProps {
  chatId?: string;
  user: User | null | undefined;
  defaultOpen: boolean;
}

export function ChatPage({ chatId, user, defaultOpen }: ChatPageProps) {
  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Header />
      <AppSidebar user={user} />
      <main className="relative h-screen flex-1 overflow-hidden pt-10">
        <ChatArea user={user} chatId={chatId} />
      </main>
    </SidebarProvider>
  );
}
