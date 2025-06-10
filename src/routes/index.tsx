import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getUser } from "@/backend/auth/get-user";

const getSidebarState = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const cookies = request?.headers?.get("cookie") || "";

  const match = cookies.match(/sidebar_state=([^;]*)/);
  const sidebarState = match ? match[1] : null;

  return sidebarState === "true";
});

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    const defaultOpen = await getSidebarState();
    const user = await getUser();
    return { defaultOpen, user };
  },
});

function App() {
  const { defaultOpen, user } = Route.useLoaderData();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <div className="absolute top-0 left-0 z-10 p-4">
        {/* TODO: Add search, new chat button here once db fetching is implemented */}
        <SidebarTrigger />
      </div>
      <AppSidebar user={user} />
      <main className="relative flex-1">
        <ChatArea user={user} />
      </main>
    </SidebarProvider>
  );
}
