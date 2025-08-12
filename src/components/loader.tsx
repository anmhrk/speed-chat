"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset } from "@/components/ui/sidebar";

export function Loader({
  userId,
  chatId,
}: {
  userId: string | null;
  chatId: string;
}) {
  return (
    <main className="flex h-screen w-full">
      <AppSidebar userId={userId} currentChatId={chatId} isStreaming={false} />
      <SidebarInset className="flex-1">
        <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
          Loading messages...
        </div>
      </SidebarInset>
    </main>
  );
}
