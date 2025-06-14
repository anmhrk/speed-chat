import { ChatPage } from "@/components/ChatPage";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$chatId")({
  component: RouteComponent,
});

function RouteComponent() {
  const { defaultOpen, user } = Route.useRouteContext();
  const { chatId } = Route.useParams();

  return (
    <ChatPage user={user} defaultOpen={defaultOpen} chatIdParams={chatId} />
  );
}
