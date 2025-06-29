import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { Hydration } from "@/components/hydration";
import { QueryClientProvider } from "@/components/query-client-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { ChatProvider } from "@/contexts/chat-context";
import { getUser } from "@/lib/auth/get-user";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Speed Chat",
  description: "A fast AI chat app",
  icons: {
    icon: "/logo.svg",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get("sidebar_state")?.value !== "false";
  const user = await getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan/dist/auto.global.js" />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overscroll-none antialiased`}
      >
        <SidebarProvider defaultOpen={defaultOpen}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            disableTransitionOnChange
            enableSystem
          >
            <QueryClientProvider>
              <Hydration />
              <ChatProvider user={user}>
                <AppSidebar />
                <Toaster />
                {children}
              </ChatProvider>
            </QueryClientProvider>
          </ThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
