import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { SidebarProvider } from "@/components/ui/sidebar";
import { cookies } from "next/headers";
import { Hydration } from "@/components/hydration";
import { QueryClientProvider } from "@/components/query-client-provider";

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
  const DEV = process.env.NODE_ENV === "development";

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {DEV && (
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
              <Toaster />
              {children}
            </QueryClientProvider>
          </ThemeProvider>
        </SidebarProvider>
      </body>
    </html>
  );
}
