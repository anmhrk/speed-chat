import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import '../backend/orpc/server';

import { getUser } from '@/backend/auth/get-user';
import { AppSidebar } from '@/components/app-sidebar';
import { Providers } from '@/components/providers';
import { SidebarInset } from '@/components/ui/sidebar';
import { Toaster } from '@/components/ui/sonner';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Speed Chat',
  description:
    'An AI chat app with support for all flagship models and image generation.',
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getUser();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} overscroll-none antialiased`}
      >
        <Providers>
          <main className="flex h-screen w-full">
            <AppSidebar user={user} />
            <SidebarInset className="flex-1">{children}</SidebarInset>
          </main>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
