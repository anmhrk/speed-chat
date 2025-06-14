import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  Navigate,
} from "@tanstack/react-router";
// import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import { getUser } from "@/lib/auth/get-user";
import { Toaster } from "@/components/ui/sonner";
import { getSidebarState } from "@/lib/utils.ts";

interface MyRouterContext {
  queryClient: QueryClient;
  user?: Awaited<ReturnType<typeof getUser>>;
  defaultOpen?: Awaited<ReturnType<typeof getSidebarState>>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const user = await getUser();
    const defaultOpen = await getSidebarState();
    return { user, defaultOpen };
  },

  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Speed Chat",
        description: "Speed Chat is a fast and snappy AI chat app",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  component: () => (
    <RootDocument>
      <Outlet />
      {/* <TanStackRouterDevtools /> */}
      <TanStackQueryLayout />
    </RootDocument>
  ),

  notFoundComponent: () => <NotFound />,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="overscroll-none">
        <Toaster />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

// Just navigate to home. Maybe implement a 404 page later.
function NotFound() {
  return <Navigate to="/" />;
}
