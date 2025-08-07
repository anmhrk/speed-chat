import { cookies } from 'next/headers';
import { SidebarProvider } from '@/components/ui/sidebar';
import { ChatConfigProvider } from './chat-config-provider';
import { TanstackQueryClientProvider } from './query-client-provider';
import { ThemeProvider } from './theme-provider';

export async function Providers({ children }: { children: React.ReactNode }) {
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
            {children}
          </SidebarProvider>
        </ThemeProvider>
      </ChatConfigProvider>
    </TanstackQueryClientProvider>
  );
}
