import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ChatProvider } from "@/components/providers/ChatProvider";
import { ConvexClientProvider } from "@/components/providers/ConvexClientProvider";
import { Toaster } from "sonner";

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
  description: "An AI chat app with multiple providers and byok support",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} overscroll-none antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            disableTransitionOnChange
          >
            <ConvexClientProvider>
              <ChatProvider>
                <Toaster />
                {children}
              </ChatProvider>
            </ConvexClientProvider>
          </ThemeProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
