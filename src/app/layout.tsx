import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { SidebarProvider } from "@/components/ui/sidebar";
import { QueryClientProvider } from "@/components/providers/query-client-provider";
import { SettingsProvider } from "@/components/providers/settings-provider";
import { Toaster } from "sonner";
import { cookies, headers } from "next/headers";
import { MobileProvider } from "@/components/providers/mobile-provider";

export const dynamic = "force-dynamic";

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

  // Getting mobile status on the server because chatPage has a dynamic layout based on isMobile
  // and doing the mobile check on the client would show a tiny flash before layout is changed

  // However, this still doesn't work when desktop is resized to mobile and the page is refreshed
  const ua = (await headers()).get("user-agent") ?? "";
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overscroll-none antialiased`}
      >
        <MobileProvider serverState={isMobile}>
          <SidebarProvider defaultOpen={defaultOpen}>
            <ThemeProvider
              attribute="class"
              defaultTheme="system"
              disableTransitionOnChange
              enableSystem
            >
              <QueryClientProvider>
                <SettingsProvider>
                  <Toaster richColors />
                  {children}
                </SettingsProvider>
              </QueryClientProvider>
            </ThemeProvider>
          </SidebarProvider>
        </MobileProvider>
      </body>
    </html>
  );
}
