import { ChatPage } from "@/components/ChatPage";
import { getSidebarState } from "@/lib/utils";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$chatId")({
  component: RouteComponent,
  beforeLoad: async ({ params }) => {
    console.log("params", params);
    // TODO: check if chatId is valid (it exists in db)
    // Will need to figure out how to verify user access for unauthed user
  },
  loader: async () => {
    const defaultOpen = await getSidebarState();
    return { defaultOpen };
  },
});

function RouteComponent() {
  const { defaultOpen } = Route.useLoaderData();
  const { chatId } = Route.useParams();
  const { user } = Route.useRouteContext();

  return (
    <ChatPage user={user} defaultOpen={defaultOpen} chatIdParams={chatId} />
  );
}
