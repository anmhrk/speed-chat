import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/chat/$chatId")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/chat/$chatId"!</div>;
}
