import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  Navigate,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import TanStackQueryLayout from "../integrations/tanstack-query/layout.tsx";

import appCss from "../styles.css?url";

import type { QueryClient } from "@tanstack/react-query";

import type { TRPCRouter } from "@/integrations/trpc/router";
import type { TRPCOptionsProxy } from "@trpc/tanstack-react-query";
import { getUser } from "@/backend/auth/get-user";

interface MyRouterContext {
  queryClient: QueryClient;
  trpc: TRPCOptionsProxy<TRPCRouter>;
  user?: Awaited<ReturnType<typeof getUser>>;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    const user = await getUser();
    return { user };
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
      <TanStackRouterDevtools />
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
