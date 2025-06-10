import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { getWebRequest } from "@tanstack/react-start/server";
import { AppSidebar } from "@/components/AppSidebar";
import { ChatArea } from "@/components/ChatArea";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Header } from "@/components/Header";

const getSidebarState = createServerFn({ method: "GET" }).handler(async () => {
  const request = getWebRequest();
  const cookies = request?.headers?.get("cookie") || "";

  const match = cookies.match(/sidebar_state=([^;]*)/);
  const sidebarState = match ? match[1] : null;

  return sidebarState !== "false";
});

export const Route = createFileRoute("/")({
  component: App,
  loader: async () => {
    const defaultOpen = await getSidebarState();
    return { defaultOpen };
  },
});

function App() {
  const { defaultOpen } = Route.useLoaderData();
  const { user } = Route.useRouteContext();

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <Header />
      <AppSidebar user={user} />
      <main className="relative flex-1">
        <ChatArea user={user} />
      </main>
    </SidebarProvider>
  );
}
