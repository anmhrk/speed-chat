import { createFileRoute } from "@tanstack/react-router";
import { getSidebarState } from "@/lib/utils";
import { ChatPage } from "@/components/ChatPage";

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

  return <ChatPage user={user} defaultOpen={defaultOpen} />;
}
