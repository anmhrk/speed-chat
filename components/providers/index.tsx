import type { User } from 'better-auth';
import { cookies } from 'next/headers';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ChatConfigProvider } from './chat-config-provider';
import { ChatProvider } from './chat-provider';
import { TanstackQueryClientProvider } from './query-client-provider';
import { ThemeProvider } from './theme-provider';

export async function Providers({
  children,
  user,
}: {
  children: React.ReactNode;
  user: User | null;
}) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value !== 'false';

  return (
    <TanstackQueryClientProvider>
      <ChatConfigProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          <SidebarProvider defaultOpen={defaultOpen}>
            <ChatProvider user={user}>{children}</ChatProvider>
          </SidebarProvider>
        </ThemeProvider>
      </ChatConfigProvider>
    </TanstackQueryClientProvider>
  );
}
