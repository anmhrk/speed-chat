'use client';

import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';
import { ConvexReactClient } from 'convex/react';
import { ConvexQueryCacheProvider } from 'convex-helpers/react/cache/provider';
import type { ReactNode } from 'react';
import { authClient } from '@/lib/auth/client';

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexBetterAuthProvider authClient={authClient} client={convex}>
      <ConvexQueryCacheProvider>{children}</ConvexQueryCacheProvider>
    </ConvexBetterAuthProvider>
  );
}
