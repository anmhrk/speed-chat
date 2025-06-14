import { ChatPage } from "@/components/ChatPage";
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$chatId")({
  beforeLoad: async ({ context }) => {
    if (!context.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { defaultOpen, user } = Route.useRouteContext();
  const { chatId } = Route.useParams();

  return (
    <ChatPage user={user} defaultOpen={defaultOpen} chatIdParams={chatId} />
  );
}
