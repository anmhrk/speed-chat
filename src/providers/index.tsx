import { ThemeProvider } from "./theme-provider";
import { ConvexClientProvider } from "./convex-client-provider";
import { ChatConfigProvider } from "./chat-config-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { ClerkProvider } from "@clerk/nextjs";

export async function Providers({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";

  return (
    <ClerkProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
        enableSystem
      >
        <ConvexClientProvider>
          <ChatConfigProvider>
            <SidebarProvider defaultOpen={defaultOpen}>
              {children}
            </SidebarProvider>
          </ChatConfigProvider>
        </ConvexClientProvider>
      </ThemeProvider>
    </ClerkProvider>
  );
}
