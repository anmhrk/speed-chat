import { createFileRoute } from "@tanstack/react-router";
import { ChatPage } from "@/components/ChatPage";

export const Route = createFileRoute("/")({
  component: App,
});

function App() {
  const { defaultOpen, user } = Route.useRouteContext();

  return <ChatPage user={user} defaultOpen={defaultOpen} />;
}
